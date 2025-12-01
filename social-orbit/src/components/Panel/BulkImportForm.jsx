/**
 * BulkImportForm Component
 * Form for adding multiple friends at once
 */

import React from 'react';
import { Plus, Trash2, Layers, Sparkles } from 'lucide-react';

/**
 * BulkImportForm - Bulk friend import form
 * @param {Object} props
 * @param {Array} props.bulkList - Array of bulk item objects
 * @param {Function} props.onUpdateList - Update the bulk list
 * @param {boolean} props.loading - Whether analysis is in progress
 * @param {Function} props.onAnalyze - Analyze all items
 */
export default function BulkImportForm({
  bulkList,
  onUpdateList,
  loading,
  onAnalyze
}) {
  const addItem = () => {
    onUpdateList([
      ...bulkList,
      { id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }
    ]);
  };

  const removeItem = (id) => {
    if (bulkList.length > 1) {
      onUpdateList(bulkList.filter((item) => item.id !== id));
    } else {
      // Reset to empty if last item
      onUpdateList([{ id: Date.now(), name: '', gender: 'Non-binary', age: '', description: '' }]);
    }
  };

  const updateItem = (id, field, value) => {
    onUpdateList(
      bulkList.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const hasValidItems = bulkList.some((item) => item.name?.trim() && item.description?.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Layers size={18} className="text-purple-400" /> Bulk Import
        </h2>
        <p className="text-slate-500 text-xs">
          Add multiple friends at once to save time.
        </p>
      </div>

      {/* Items list */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto modern-scrollbar pr-2">
        {bulkList.map((item, index) => (
          <div
            key={item.id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-4 relative group"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-400">
                Friend #{index + 1}
              </h3>
              {bulkList.length > 1 && (
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Name, Gender, Age row */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                />
                <select
                  value={item.gender}
                  onChange={(e) => updateItem(item.id, 'gender', e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none w-24"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>NB</option>
                  <option>Other</option>
                </select>
                <input
                  type="number"
                  placeholder="Age"
                  value={item.age}
                  onChange={(e) => updateItem(item.id, 'age', e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none w-16"
                />
              </div>

              {/* Description */}
              <textarea
                placeholder="Description..."
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none resize-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={addItem}
          className="flex-1 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Another
        </button>
        <button
          onClick={onAnalyze}
          disabled={loading || !hasValidItems}
          className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
            loading
              ? 'bg-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-[1.02]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles size={18} /> Process All
            </>
          )}
        </button>
      </div>
    </div>
  );
}

