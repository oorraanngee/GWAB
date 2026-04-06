import React from 'react';
import { X } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function SettingsModal({ isOpen, onClose, settings, setSettings }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Theme */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${settings.theme === 'light' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                Light
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
                className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${settings.theme === 'dark' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom API Key (Optional)
            </label>
            <input
              type="password"
              value={settings.customApiKey}
              onChange={e => setSettings(s => ({ ...s, customApiKey: e.target.value }))}
              placeholder="Leave empty to use default"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              If provided, this key will be used instead of the default environment key.
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <label className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Temperature</span>
              <span>{settings.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={settings.temperature}
              onChange={e => setSettings(s => ({ ...s, temperature: parseFloat(e.target.value) }))}
              className="w-full accent-blue-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Higher values make output more random, lower values make it more focused and deterministic.
            </p>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
