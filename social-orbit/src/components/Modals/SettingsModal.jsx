/**
 * SettingsModal Component
 * Settings dialog for API key and mock mode
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Sparkles, Lock, Key as KeyIcon, Plus, Save } from 'lucide-react';

/**
 * SettingsModal - Settings dialog
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close the modal
 * @param {string} props.apiKey - Current API key
 * @param {Function} props.onApiKeyChange - Update API key
 * @param {boolean} props.useMockMode - Whether mock mode is enabled
 * @param {Function} props.onMockModeChange - Toggle mock mode
 * @param {Function} props.onSave - Save settings
 * @param {Function} props.onClearApiKey - Clear API key
 */
export default function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
  useMockMode,
  onMockModeChange,
  onSave,
  onClearApiKey
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="text-purple-400" /> Settings
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X />
            </button>
          </div>

          <div className="space-y-4">
            {/* Mock Mode Toggle */}
            <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    useMockMode
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Use Mock Mode</div>
                  <div className="text-xs text-slate-400">
                    Generate random data without API
                  </div>
                </div>
              </div>
              <button
                onClick={() => onMockModeChange(!useMockMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  useMockMode ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    useMockMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                OpenRouter API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  placeholder="sk-or-..."
                  className={`flex-1 bg-slate-950 border rounded-lg p-3 text-white focus:border-purple-500 outline-none ${
                    useMockMode
                      ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'border-slate-700'
                  }`}
                  disabled={useMockMode}
                />
                {apiKey && (
                  <button
                    onClick={onClearApiKey}
                    className="px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                    title="Clear API Key"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-2 bg-green-500/10 border border-green-500/20 rounded p-2 text-xs text-green-400 flex items-center gap-2">
                <Lock size={12} />
                <span>
                  <b>Encrypted & Expires:</b> API key is stored encrypted and auto-expires after 24 hours.
                </span>
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                ℹ️ Your API key is encrypted with your passphrase. Clearing it does NOT affect friends data.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-slate-800/50 p-3 rounded text-xs text-slate-400 space-y-2">
              <p className="flex gap-2 items-center">
                <KeyIcon size={14} /> 1. Go to <b>openrouter.ai</b> and sign up.
              </p>
              <p className="flex gap-2 items-center">
                <Plus size={14} /> 2. Create a <b>Free API Key</b>.
              </p>
              <p className="flex gap-2 items-center">
                <Save size={14} /> 3. Paste it here and click Save.
              </p>
            </div>

            {/* Save button */}
            <button
              onClick={onSave}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors font-medium"
            >
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

