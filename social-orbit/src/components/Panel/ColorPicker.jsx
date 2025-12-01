/**
 * ColorPicker Component
 * Popup grid for selecting a color
 */

import React from 'react';
import { COLORS } from '../../constants/colors';

/**
 * ColorPicker - Grid popup for color selection
 * @param {Object} props
 * @param {Function} props.onSelect - Called when a color is selected
 */
export default function ColorPicker({ onSelect }) {
  return (
    <div className="absolute top-12 left-full ml-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 grid grid-cols-5 gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className="w-6 h-6 rounded-full border border-slate-600 hover:scale-110 transition-transform"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

