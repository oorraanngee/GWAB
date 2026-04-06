/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Chat from './components/Chat';
import Workspace from './components/Workspace';
import SettingsModal from './components/SettingsModal';
import { Message, WorkspaceState, AppSettings } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    activeTab: 'browser',
    browserUrl: '',
    mediaItems: [],
    code: ''
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      theme: 'light',
      customApiKey: '',
      temperature: 1.0
    };
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  return (
    <div className={`flex h-screen w-full bg-white dark:bg-gray-900 overflow-hidden font-sans transition-colors ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <div className={`h-full transition-all duration-300 ease-in-out ${isWorkspaceOpen ? 'w-1/3 min-w-[350px] max-w-[500px]' : 'w-full max-w-3xl mx-auto'}`}>
        <Chat 
          messages={messages} 
          setMessages={setMessages} 
          workspace={workspace} 
          setWorkspace={setWorkspace}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          settings={settings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isWorkspaceOpen={isWorkspaceOpen}
          toggleWorkspace={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
        />
      </div>
      
      <div className={`h-full transition-all duration-300 ease-in-out ${isWorkspaceOpen ? 'flex-1 border-l border-gray-200 dark:border-gray-800' : 'w-0 overflow-hidden opacity-0'}`}>
        <Workspace 
          workspace={workspace} 
          setWorkspace={setWorkspace} 
          onClose={() => setIsWorkspaceOpen(false)}
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        setSettings={setSettings} 
      />
    </div>
  );
}
