/**
 * PanelHeader Component
 * Header section of the control panel with title and action buttons
 */

import React from 'react';
import { User, Settings, Lock, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * PanelHeader - Control panel header
 * @param {Object} props
 * @param {boolean} props.showApiKeyWarning - Whether to show API key warning
 * @param {Function} props.onEditPersona - Open persona editor
 * @param {Function} props.onOpenSettings - Open settings modal
 * @param {Function} props.onLockVault - Lock the vault
 * @param {Function} props.onRecalculate - Open recalculate modal
 * @param {number} props.friendsCount - Number of friends (to enable/disable recalculate)
 */
export default function PanelHeader({
  showApiKeyWarning,
  onEditPersona,
  onOpenSettings,
  onLockVault,
  onRecalculate,
  friendsCount = 0
}) {
  return (
    <div className="p-6 border-b border-slate-800 bg-slate-950">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={`${import.meta.env.BASE_URL}social-orbit-logo.png`}
            alt="Social Orbit" 
            className="w-10 h-10 drop-shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Social Orbit
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Relationship Cartographer</p>
          </div>
        </div>
        <div className="flex gap-1">
          {friendsCount > 0 && (
            <button
              onClick={onRecalculate}
              className="p-2 hover:bg-purple-500/20 rounded-full text-slate-400 hover:text-purple-400 transition-colors"
              title="Recalculate Positions"
            >
              <RefreshCw size={18} />
            </button>
          )}
          <button
            onClick={onEditPersona}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
            title="Edit Persona"
          >
            <User size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={onLockVault}
            className="p-2 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-400 transition-colors"
            title="Lock Vault"
          >
            <Lock size={18} />
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

