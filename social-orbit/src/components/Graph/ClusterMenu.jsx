/**
 * ClusterMenu Component
 * Popup menu when multiple nodes overlap
 */

import React from 'react';
import { ICON_MAP, DEFAULT_ICON } from '../../constants/icons';

/**
 * Render an icon by name
 */
function renderIcon(iconName, size = 14, color = 'currentColor') {
  const IconComponent = ICON_MAP[iconName] || ICON_MAP[DEFAULT_ICON];
  return <IconComponent size={size} fill={color} className="text-slate-900" />;
}

/**
 * ClusterMenu - Selection menu for overlapping nodes
 * @param {Object} props
 * @param {Array} props.items - Array of overlapping friends
 * @param {number} props.x - X position (percentage)
 * @param {number} props.y - Y position (percentage)
 * @param {number} props.scale - Current view scale (for inverse scaling)
 * @param {Function} props.onSelect - Called when a friend is selected
 * @param {Function} props.onClose - Called when menu should close
 */
export default function ClusterMenu({ items, x, y, scale, onSelect, onClose }) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className="absolute z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 min-w-[150px] flex flex-col gap-1"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(10px, -50%) scale(${1 / scale})`
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="text-[10px] uppercase text-slate-500 font-bold px-2 py-1">
        Select Friend
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
            onClose();
          }}
          className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded text-left text-xs text-white"
        >
          {renderIcon(item.icon, 14, item.color)}
          {item.name}
        </button>
      ))}
    </div>
  );
}

