import React from 'react';
import { Globe, Image as ImageIcon, Video, Music, Code, X } from 'lucide-react';
import { WorkspaceState } from '../types';

interface WorkspaceProps {
  workspace: WorkspaceState;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceState>>;
  onClose: () => void;
}

export default function Workspace({ workspace, setWorkspace, onClose }: WorkspaceProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pr-2">
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${workspace.activeTab === 'browser' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          onClick={() => setWorkspace(w => ({ ...w, activeTab: 'browser' }))}
        >
          <Globe className="w-4 h-4" /> Browser
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${workspace.activeTab === 'media' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          onClick={() => setWorkspace(w => ({ ...w, activeTab: 'media' }))}
        >
          <ImageIcon className="w-4 h-4" /> Media
        </button>
        <button
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${workspace.activeTab === 'code' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
          onClick={() => setWorkspace(w => ({ ...w, activeTab: 'code' }))}
        >
          <Code className="w-4 h-4" /> Code
        </button>
        <div className="flex items-center justify-center pl-2">
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 rounded-md transition-colors"
            title="Close Workspace"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {workspace.activeTab === 'browser' && (
          <div className="absolute inset-0 flex flex-col">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center">
              <div className="bg-white dark:bg-gray-900 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm w-full truncate text-gray-600 dark:text-gray-300">
                {workspace.browserUrl || 'about:blank'}
              </div>
            </div>
            {workspace.browserUrl ? (
              <iframe src={workspace.browserUrl} className="w-full h-full bg-white dark:bg-gray-900" title="Browser" sandbox="allow-same-origin allow-scripts" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
                No URL loaded
              </div>
            )}
          </div>
        )}

        {workspace.activeTab === 'media' && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4">
            {workspace.mediaItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                No media generated yet
              </div>
            ) : (
              workspace.mediaItems.map((item, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    {item.type === 'image' && <ImageIcon className="w-4 h-4" />}
                    {item.type === 'video' && <Video className="w-4 h-4" />}
                    {item.type === 'audio' && <Music className="w-4 h-4" />}
                    <span className="truncate">{item.prompt}</span>
                  </div>
                  {item.type === 'image' && <img src={item.url} alt={item.prompt} className="w-full rounded-md" referrerPolicy="no-referrer" />}
                  {item.type === 'video' && <video src={item.url} controls className="w-full rounded-md" />}
                  {item.type === 'audio' && <audio src={item.url} controls className="w-full" />}
                </div>
              ))
            )}
          </div>
        )}

        {workspace.activeTab === 'code' && (
          <div className="absolute inset-0">
            {workspace.code ? (
              <iframe srcDoc={workspace.code} className="w-full h-full bg-white dark:bg-gray-900" title="Code Runner" sandbox="allow-scripts" />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                No code generated yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
