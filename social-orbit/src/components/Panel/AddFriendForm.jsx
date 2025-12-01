/**
 * AddFriendForm Component
 * Form for adding or editing a single friend
 */

import React from 'react';
import { Plus, Edit, Sparkles } from 'lucide-react';
import { ICON_LIST } from '../../constants/icons';

/**
 * AddFriendForm - Single friend add/edit form
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {Function} props.onFormChange - Update form data
 * @param {boolean} props.isEditing - Whether editing an existing friend
 * @param {Function} props.onCancelEdit - Cancel edit mode
 * @param {boolean} props.manualMode - Whether manual mode is enabled
 * @param {Function} props.onToggleManualMode - Toggle manual mode
 * @param {boolean} props.loading - Whether analysis is in progress
 * @param {Function} props.onAnalyze - Analyze and add friend
 * @param {Function} props.onManualAdd - Add friend without analysis
 */
export default function AddFriendForm({
  formData,
  onFormChange,
  isEditing,
  onCancelEdit,
  manualMode,
  onToggleManualMode,
  loading,
  onAnalyze,
  onManualAdd
}) {
  const updateField = (field, value) => {
    onFormChange({ ...formData, [field]: value });
  };

  const canSubmit = formData.name && (manualMode || formData.description);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
            {isEditing ? (
              <><Edit size={18} className="text-purple-400" /> Recalculate Orbit</>
            ) : (
              <><Plus size={18} className="text-purple-400" /> Add to Orbit</>
            )}
          </h2>
          <p className="text-slate-500 text-xs">
            {isEditing ? 'Update details and re-analyze.' : 'Describe your dynamic.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleManualMode}
            className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            {manualMode ? 'Manual Mode: On' : 'Manual Mode: Off'}
          </button>
          {isEditing && (
            <button
              onClick={onCancelEdit}
              className="text-xs text-red-400 hover:text-red-300 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="e.g. Sarah"
          />
        </div>

        {/* Gender & Age */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Age</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => updateField('age', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="25"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Relationship Context
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            maxLength={1500}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none modern-scrollbar"
            placeholder="How did you meet? How often do you talk? Do you share secrets or just memes? Be honest..."
          />
        </div>

        {/* Manual mode fields */}
        {manualMode && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                X (0-100) Emotion
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.x}
                onChange={(e) => updateField('x', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Y (0-100) Time Gap
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.y}
                onChange={(e) => updateField('y', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Icon</label>
              <select
                value={formData.icon}
                onChange={(e) => updateField('icon', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {ICON_LIST.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Summary (optional)
              </label>
              <input
                type="text"
                value={formData.summary || ''}
                onChange={(e) => updateField('summary', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Reasoning (optional)
              </label>
              <input
                type="text"
                value={formData.reasoning || ''}
                onChange={(e) => updateField('reasoning', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        {!manualMode ? (
          <button
            onClick={onAnalyze}
            disabled={loading || !canSubmit}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
              loading
                ? 'bg-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 hover:scale-[1.02]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {isEditing ? 'Update & Recalculate' : 'Analyze & Plot'}
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onManualAdd}
            disabled={!formData.name}
            className="w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
          >
            <Plus size={18} /> Add Without AI
          </button>
        )}
      </div>
    </div>
  );
}

