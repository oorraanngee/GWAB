import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, X, Loader2, Settings, Sidebar, Square } from 'lucide-react';
import Markdown from 'react-markdown';
import { Message, WorkspaceState, AppSettings } from '../types';
import { getBaseAi, getPaidAi, ensureApiKey, performActionTool, systemInstruction } from '../lib/gemini';
import { ChatSession } from '@google/genai';

interface ChatProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  workspace: WorkspaceState;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceState>>;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  settings: AppSettings;
  onOpenSettings: () => void;
  isWorkspaceOpen: boolean;
  toggleWorkspace: () => void;
}

export default function Chat({ messages, setMessages, workspace, setWorkspace, selectedModel, setSelectedModel, settings, onOpenSettings, isWorkspaceOpen, toggleWorkspace }: ChatProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAborted = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    const ai = getBaseAi(settings.customApiKey);
    chatRef.current = ai.chats.create({
      model: selectedModel,
      config: {
        systemInstruction,
        temperature: settings.temperature,
        tools: [{ functionDeclarations: [performActionTool] }],
      }
    });
  };

  useEffect(() => {
    initChat();
    // Reset chat when model or settings change
    setMessages([]);
  }, [selectedModel, settings.customApiKey, settings.temperature]);

  const stopGeneration = () => {
    isAborted.current = true;
    setIsLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    isAborted.current = false;

    try {
      if (!chatRef.current) initChat();
      
      let responseStream = await chatRef.current!.sendMessageStream({ message: userMsg.text });
      
      let aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: '' };
      setMessages(prev => [...prev, aiMsg]);

      for await (const chunk of responseStream) {
        if (isAborted.current) break;
        if (chunk.functionCalls && chunk.functionCalls.length > 0) {
          const call = chunk.functionCalls[0];
          if (call.name === 'performAction') {
            const args = call.args as any;
            aiMsg.isPendingPermission = true;
            aiMsg.permissionRequest = {
              actionType: args.actionType,
              payload: args.payload,
              reason: args.reason,
              toolCallId: call.id
            };
            setMessages(prev => prev.map(m => m.id === aiMsg.id ? aiMsg : m));
            setIsLoading(false);
            return; // Pause execution to wait for user permission
          }
        }
        if (chunk.text) {
          aiMsg.text += chunk.text;
          setMessages(prev => prev.map(m => m.id === aiMsg.id ? aiMsg : m));
        }
      }
    } catch (e) {
      if (!isAborted.current) {
        console.error(e);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error: ' + (e as Error).message }]);
      }
    }
    setIsLoading(false);
  };

  const handlePermission = async (msgId: string, approved: boolean) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.permissionRequest) return;

    // Update UI immediately
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, isPendingPermission: false, text: m.text + `\n\n*[Permission ${approved ? 'Granted' : 'Denied'} for ${msg.permissionRequest!.actionType}]*` };
      }
      return m;
    }));

    setIsLoading(true);
    isAborted.current = false;
    let toolResponseResult: any = { status: 'denied', reason: 'User denied permission' };

    if (approved) {
      const { actionType, payload } = msg.permissionRequest;
      try {
        if (actionType === 'browser') {
          setWorkspace(w => ({ ...w, activeTab: 'browser', browserUrl: payload }));
          if (!isWorkspaceOpen) toggleWorkspace();
          const screenshotUrl = `https://image.thum.io/get/width/1024/crop/800/${payload}`;
          const res = await fetch(screenshotUrl);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
          });
          toolResponseResult = { status: 'success', screenshotBase64: base64, url: payload };
        } else if (actionType === 'image') {
          if (!settings.customApiKey) await ensureApiKey();
          const ai = getPaidAi(settings.customApiKey);
          const res = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: { parts: [{ text: payload }] },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
          });
          let base64 = '';
          for (const part of res.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              base64 = part.inlineData.data;
              break;
            }
          }
          const url = `data:image/jpeg;base64,${base64}`;
          setWorkspace(w => ({ ...w, activeTab: 'media', mediaItems: [{ type: 'image', url, prompt: payload }, ...w.mediaItems] }));
          if (!isWorkspaceOpen) toggleWorkspace();
          toolResponseResult = { status: 'success', message: 'Image generated and displayed to user' };
        } else if (actionType === 'video') {
          if (!settings.customApiKey) await ensureApiKey();
          const ai = getPaidAi(settings.customApiKey);
          let operation = await ai.models.generateVideos({
            model: 'veo-3.1-lite-generate-preview',
            prompt: payload,
            config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
          });
          while (!operation.done) {
            if (isAborted.current) break;
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({operation: operation});
          }
          if (!isAborted.current) {
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
              const videoRes = await fetch(downloadLink, {
                headers: { 'x-goog-api-key': settings.customApiKey || (process.env.API_KEY || process.env.GEMINI_API_KEY) as string },
              });
              const blob = await videoRes.blob();
              const url = URL.createObjectURL(blob);
              setWorkspace(w => ({ ...w, activeTab: 'media', mediaItems: [{ type: 'video', url, prompt: payload }, ...w.mediaItems] }));
              if (!isWorkspaceOpen) toggleWorkspace();
              toolResponseResult = { status: 'success', message: 'Video generated and displayed to user' };
            } else {
              toolResponseResult = { status: 'error', message: 'Video generation failed' };
            }
          }
        } else if (actionType === 'audio') {
          if (!settings.customApiKey) await ensureApiKey();
          const ai = getPaidAi(settings.customApiKey);
          const res = await ai.models.generateContentStream({
            model: "lyria-3-clip-preview",
            contents: payload,
          });
          let audioBase64 = "";
          let mimeType = "audio/wav";
          for await (const chunk of res) {
            if (isAborted.current) break;
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (!parts) continue;
            for (const part of parts) {
              if (part.inlineData?.data) {
                if (!audioBase64 && part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
                audioBase64 += part.inlineData.data;
              }
            }
          }
          if (!isAborted.current) {
            const url = `data:${mimeType};base64,${audioBase64}`;
            setWorkspace(w => ({ ...w, activeTab: 'media', mediaItems: [{ type: 'audio', url, prompt: payload }, ...w.mediaItems] }));
            if (!isWorkspaceOpen) toggleWorkspace();
            toolResponseResult = { status: 'success', message: 'Audio generated and displayed to user' };
          }
        } else if (actionType === 'code') {
          setWorkspace(w => ({ ...w, activeTab: 'code', code: payload }));
          if (!isWorkspaceOpen) toggleWorkspace();
          toolResponseResult = { status: 'success', message: 'Code executed and displayed to user' };
        }
      } catch (e) {
        console.error(e);
        toolResponseResult = { status: 'error', message: (e as Error).message };
      }
    }

    if (isAborted.current) {
      setIsLoading(false);
      return;
    }

    try {
      let responseStream = await chatRef.current!.sendMessageStream([{
        functionResponse: {
          name: 'performAction',
          response: toolResponseResult,
          id: msg.permissionRequest.toolCallId
        }
      }]);

      let aiMsg: Message = { id: Date.now().toString(), role: 'model', text: '' };
      setMessages(prev => [...prev, aiMsg]);

      for await (const chunk of responseStream) {
        if (isAborted.current) break;
        if (chunk.text) {
          aiMsg.text += chunk.text;
          setMessages(prev => prev.map(m => m.id === aiMsg.id ? aiMsg : m));
        }
      }
    } catch (e) {
      if (!isAborted.current) {
        console.error(e);
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Error: ' + (e as Error).message }]);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          {!isWorkspaceOpen && (
            <button onClick={toggleWorkspace} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
              <Sidebar className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-semibold text-gray-800 dark:text-white">Gemini</h1>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gemini-3.1-pro-preview">Pro</option>
            <option value="gemini-3.1-flash-preview">Fast</option>
            <option value="gemini-3.1-flash-lite-preview">Flash-Lite</option>
          </select>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 space-y-4">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-center max-w-sm">
              I can browse the web, generate images, videos, music, and run code. What would you like to do?
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <Markdown>{msg.text}</Markdown>
              </div>
            </div>
            
            {msg.isPendingPermission && msg.permissionRequest && (
              <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-xl max-w-[85%] w-full shadow-sm">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-500 mb-2 flex items-center gap-2">
                  Permission Required: {msg.permissionRequest.actionType.toUpperCase()}
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-600 mb-2"><strong>Reason:</strong> {msg.permissionRequest.reason}</p>
                <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800/30 mb-4 max-h-32 overflow-y-auto text-gray-600 dark:text-gray-400 font-mono">
                  {msg.permissionRequest.payload}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handlePermission(msg.id, true)}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => handlePermission(msg.id, false)}
                    disabled={isLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    <X className="w-4 h-4" /> Deny
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && !messages.find(m => m.isPendingPermission) && (
          <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask Gemini to browse, draw, or code..."
            className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={isLoading || messages.some(m => m.isPendingPermission)}
          />
          {isLoading ? (
            <button
              onClick={stopGeneration}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
              title="Stop Generation"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || messages.some(m => m.isPendingPermission)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
