/**
 * FriendDetail Component
 * Detailed view of a selected friend
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Edit, Trash2, Sparkles, MessageCircle, 
  ChevronDown, Info, Palette 
} from 'lucide-react';
import { ICON_MAP, DEFAULT_ICON } from '../../constants/icons';
import IconPicker from './IconPicker';
import ColorPicker from './ColorPicker';

/**
 * Render an icon by name
 */
function renderIcon(iconName, size = 32, color = 'currentColor') {
  const IconComponent = ICON_MAP[iconName] || ICON_MAP[DEFAULT_ICON];
  return <IconComponent size={size} fill={color} className="text-slate-900" />;
}

/**
 * FriendDetail - Detailed view of selected friend
 * @param {Object} props
 * @param {Object} props.friend - Selected friend object
 * @param {Function} props.onClose - Close detail view
 * @param {Function} props.onEdit - Start editing this friend
 * @param {Function} props.onDelete - Delete this friend
 * @param {Function} props.onUpdateIcon - Update friend's icon
 * @param {Function} props.onUpdateColor - Update friend's color
 */
export default function FriendDetail({
  friend,
  onClose,
  onEdit,
  onDelete,
  onUpdateIcon,
  onUpdateColor
}) {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleIconSelect = (icon) => {
    onUpdateIcon(icon);
    setShowIconPicker(false);
  };

  const handleColorSelect = (color) => {
    onUpdateColor(color);
    setShowColorPicker(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex flex-col gap-1">
              {/* Icon button */}
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-purple-500/50 transition-colors group relative"
                title="Change Icon"
              >
                {renderIcon(friend.icon, 32, friend.color)}
                <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-1 border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit size={10} className="text-white" />
                </div>
              </button>
              
              {/* Color button */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 bg-slate-900 rounded-lg border border-slate-700 hover:border-purple-500/50 flex justify-center items-center"
                title="Change Color"
              >
                <Palette size={14} style={{ color: friend.color || '#fff' }} />
              </button>
            </div>

            {/* Pickers */}
            {showIconPicker && (
              <IconPicker
                currentIcon={friend.icon}
                color={friend.color}
                onSelect={handleIconSelect}
              />
            )}
            {showColorPicker && (
              <ColorPicker onSelect={handleColorSelect} />
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{friend.name}</h2>
            <p className="text-sm text-slate-400">
              {friend.gender}, {friend.age}yo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 mb-6 relative">
        <div
          className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative group cursor-help"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Emotion
            </div>
            <Info size={12} className="text-slate-600" />
          </div>
          <div className="text-xl font-mono text-purple-400">
            {Math.round(friend.x)}
            <span className="text-xs text-slate-600">/100</span>
          </div>
        </div>

        <div
          className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 relative group cursor-help"
          onMouseEnter={() => setShowInfo(true)}
          onMouseLeave={() => setShowInfo(false)}
        >
          <div className="flex justify-between items-start">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
              Time Gap
            </div>
            <Info size={12} className="text-slate-600" />
          </div>
          <div className="text-xl font-mono text-blue-400">
            {Math.round(friend.y)}
            <span className="text-xs text-slate-600">/100</span>
          </div>
        </div>

        {/* Info tooltip */}
        {showInfo && (
          <div className="absolute top-full left-0 w-full mt-2 z-50 p-3 bg-black/90 backdrop-blur border border-slate-700 rounded-lg text-xs text-slate-300 shadow-xl">
            <p className="mb-1">
              <span className="text-purple-400 font-bold">Emotion (X):</span> 0 = Soulmate, 100 = Stranger.
            </p>
            <p>
              <span className="text-blue-400 font-bold">Time (Y):</span> 0 = Daily Contact, 100 = No Contact.
            </p>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-yellow-500" /> AI Summary
          </h3>
          <p className="text-slate-300 italic text-sm border-l-2 border-yellow-500/50 pl-3">
            "{friend.summary}"
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-1">Reasoning</h3>
          <p className="text-xs text-slate-400">{friend.reasoning}</p>
        </div>

        {/* Original input collapsible */}
        <details className="group bg-slate-900/30 rounded-lg border border-slate-700/50 open:bg-slate-900/50 transition-all duration-200">
          <summary className="flex items-center justify-between p-3 cursor-pointer select-none text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-purple-400" /> Original Input
            </div>
            <div className="text-slate-500 group-open:rotate-180 transition-transform">
              <ChevronDown size={16} />
            </div>
          </summary>
          <div className="px-3 pb-3 pt-0">
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto modern-scrollbar">
              {friend.description}
            </p>
          </div>
        </details>

        {/* Delete button */}
        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={onDelete}
            className="w-full py-2 px-4 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Trash2 size={16} /> Remove from Orbit
          </button>
        </div>
      </div>
    </motion.div>
  );
}

