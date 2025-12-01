/**
 * RecalculateModal Component
 * Select friends to recalculate their positions
 * 
 * Supports progress tracking for batch operations
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Check, Square, CheckSquare, AlertTriangle } from 'lucide-react';
import { ICON_MAP, DEFAULT_ICON } from '../../constants/icons';

/**
 * Render an icon by name
 */
function renderIcon(iconName, size = 16, color = 'currentColor') {
  const IconComponent = ICON_MAP[iconName] || ICON_MAP[DEFAULT_ICON];
  return <IconComponent size={size} style={{ color }} />;
}

/**
 * RecalculateModal - Multi-select friends for recalculation
 */
export default function RecalculateModal({
  isOpen,
  onClose,
  friends,
  loading,
  onRecalculate,
  progress = null // { processed, total, current }
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  if (!isOpen) return null;

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === friends.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(friends.map(f => f.id)));
    }
  };

  const handleRecalculate = () => {
    const selectedFriends = friends.filter(f => selectedIds.has(f.id));
    onRecalculate(selectedFriends);
  };

  const allSelected = selectedIds.size === friends.length && friends.length > 0;
  const progressPercent = progress ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCw className="text-purple-400" size={20} />
              Recalculate Positions
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {selectedIds.size > 5 
                ? `Processing in batches of 3 (${Math.ceil(selectedIds.size / 3)} batches)`
                : 'Select friends to re-analyze with AI'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar (when loading) */}
        {loading && progress && (
          <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Processing: {progress.current}</span>
              <span>{progress.processed}/{progress.total} ({progressPercent}%)</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ⏱️ Free models have rate limits. Please be patient...
            </p>
          </div>
        )}

        {/* Warning for large selections */}
        {!loading && selectedIds.size > 10 && (
          <div className="px-5 py-3 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-400">
              Processing {selectedIds.size} friends will take ~{Math.ceil(selectedIds.size * 4 / 60)} minutes with free models.
            </p>
          </div>
        )}

        {/* Select All */}
        {!loading && (
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-800/30">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={18} className="text-purple-400" />
              ) : (
                <Square size={18} />
              )}
              Select All ({friends.length} friends)
            </button>
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 modern-scrollbar">
          {friends.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No friends to recalculate
            </p>
          ) : (
            friends.map((friend) => {
              const isSelected = selectedIds.has(friend.id);
              const isProcessing = loading && progress?.current === friend.name;
              
              return (
                <button
                  key={friend.id}
                  onClick={() => !loading && toggleSelect(friend.id)}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg border transition-all flex items-center gap-3 text-left ${
                    isProcessing
                      ? 'bg-purple-500/20 border-purple-500 animate-pulse'
                      : isSelected
                        ? 'bg-purple-500/10 border-purple-500/50'
                        : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                  } ${loading ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {/* Checkbox */}
                  <div className={`flex-shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-500'}`}>
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                    ) : isSelected ? (
                      <CheckSquare size={20} />
                    ) : (
                      <Square size={20} />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className="p-2 rounded-full bg-slate-900 flex-shrink-0"
                    style={{ color: friend.color || '#fff' }}
                  >
                    {renderIcon(friend.icon, 16, friend.color)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {friend.name}
                      {isProcessing && <span className="text-purple-400 ml-2 text-xs">analyzing...</span>}
                    </div>
                    <div className="text-xs text-slate-500 flex gap-3">
                      <span>X: {Math.round(friend.x)}</span>
                      <span>Y: {Math.round(friend.y)}</span>
                    </div>
                  </div>

                  {/* Current summary */}
                  <div className="text-xs text-slate-400 max-w-[120px] truncate hidden sm:block">
                    {friend.summary}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-slate-700 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please Wait' : 'Cancel'}
            </button>
            <button
              onClick={handleRecalculate}
              disabled={loading || selectedIds.size === 0}
              className={`flex-[2] py-2.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                loading || selectedIds.size === 0
                  ? 'bg-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {progress ? `${progress.processed}/${progress.total}` : 'Starting...'}
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Recalculate ({selectedIds.size})
                </>
              )}
            </button>
          </div>
          
          {/* Estimation */}
          {!loading && selectedIds.size > 0 && (
            <p className="text-xs text-slate-500 mt-2 text-center">
              Estimated time: ~{Math.max(1, Math.ceil(selectedIds.size * 4 / 60))} minute{selectedIds.size > 15 ? 's' : ''}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
