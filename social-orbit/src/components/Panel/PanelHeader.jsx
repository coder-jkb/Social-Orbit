/**
 * PanelHeader Component
 * Header section of the control panel with title and action buttons
 */

import React from 'react';
import { User, Settings, Lock, AlertTriangle } from 'lucide-react';

/**
 * PanelHeader - Control panel header
 * @param {Object} props
 * @param {boolean} props.showApiKeyWarning - Whether to show API key warning
 * @param {Function} props.onEditPersona - Open persona editor
 * @param {Function} props.onOpenSettings - Open settings modal
 * @param {Function} props.onLockVault - Lock the vault
 */
export default function PanelHeader({
  showApiKeyWarning,
  onEditPersona,
  onOpenSettings,
  onLockVault
}) {
  return (
    <div className="p-6 border-b border-slate-800 bg-slate-950">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Social Orbit
          </h1>
          <p className="text-slate-500 text-xs mt-1">Relationship Cartographer</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEditPersona}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
            title="Edit Persona"
          >
            <User size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={onLockVault}
            className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition-colors"
            title="Lock Vault"
          >
            <Lock size={20} />
          </button>
        </div>
      </div>

      {/* API Key Warning */}
      {showApiKeyWarning && (
        <div
          onClick={onOpenSettings}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 cursor-pointer hover:bg-yellow-500/20 transition-colors group"
        >
          <div className="flex items-center gap-2 text-yellow-500 text-sm font-semibold mb-1">
            <AlertTriangle size={16} /> API Key Missing
          </div>
          <p className="text-xs text-yellow-200/70">
            Click to add API Key or enable Mock Mode.
          </p>
        </div>
      )}
    </div>
  );
}

