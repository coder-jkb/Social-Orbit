/**
 * IconPicker Component
 * Popup grid for selecting an icon
 */

import React from 'react';
import { ICON_MAP, ICON_LIST } from '../../constants/icons';

/**
 * Render an icon by name
 */
function renderIcon(iconName, size = 16, color = 'currentColor') {
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return null;
  return <IconComponent size={size} fill={color} className="text-slate-900" />;
}

/**
 * IconPicker - Grid popup for icon selection
 * @param {Object} props
 * @param {string} props.currentIcon - Currently selected icon name
 * @param {string} props.color - Color to render icons with
 * @param {Function} props.onSelect - Called when an icon is selected
 */
export default function IconPicker({ currentIcon, color, onSelect }) {
  return (
    <div className="absolute top-0 left-full ml-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 grid grid-cols-5 gap-2 max-h-48 overflow-y-auto modern-scrollbar">
      {ICON_LIST.map((iconKey) => (
        <button
          key={iconKey}
          onClick={() => onSelect(iconKey)}
          className={`p-2 rounded hover:bg-slate-800 flex items-center justify-center ${
            currentIcon === iconKey ? 'bg-purple-500/20' : ''
          }`}
        >
          {renderIcon(iconKey, 16, color)}
        </button>
      ))}
    </div>
  );
}

