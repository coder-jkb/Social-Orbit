/**
 * FriendNode Component
 * Renders a single friend node on the graph
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ICON_MAP, DEFAULT_ICON } from '../../constants/icons';

/**
 * Render an icon by name
 */
function renderIcon(iconName, size = 20, color = 'currentColor') {
  const IconComponent = ICON_MAP[iconName] || ICON_MAP[DEFAULT_ICON];
  return <IconComponent size={size} fill={color} className="text-slate-900" />;
}

/**
 * FriendNode - Individual node on the graph
 * @param {Object} props
 * @param {Object} props.friend - Friend data object
 * @param {boolean} props.isSelected - Whether this node is selected
 * @param {Function} props.onMouseDown - Mouse down handler for dragging
 */
export default function FriendNode({ friend, isSelected, onMouseDown }) {
  return (
    <motion.div
      key={friend.id}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute"
      style={{
        left: `${friend.x}%`,
        top: `${friend.y}%`,
        zIndex: isSelected ? 50 : 10
      }}
    >
      <button
        onMouseDown={onMouseDown}
        className={`group relative transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${
          isSelected ? 'scale-125' : 'hover:scale-110'
        }`}
      >
        <div
          className={`p-2 rounded-full shadow-lg border-2 backdrop-blur-md flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-white border-white'
              : 'bg-black/40 border-white/20 hover:bg-black/60'
          }`}
          style={{ color: friend.color || '#fff' }}
        >
          {renderIcon(friend.icon, 20, friend.color || '#fff')}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 bg-black/50 rounded text-[10px] font-medium text-white whitespace-nowrap backdrop-blur-sm pointer-events-none">
          {friend.name}
        </div>
      </button>
    </motion.div>
  );
}

