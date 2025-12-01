/**
 * GraphControls Component
 * HUD controls for graph viewport (zoom, grid toggle, etc.)
 */

import React from 'react';
import { ZoomIn, ZoomOut, Move, Grid, Info } from 'lucide-react';

/**
 * GraphControls - Floating control buttons for graph
 * @param {Object} props
 * @param {Function} props.onZoomIn - Zoom in handler
 * @param {Function} props.onZoomOut - Zoom out handler
 * @param {Function} props.onReset - Reset view handler
 * @param {boolean} props.showGrid - Whether grid is visible
 * @param {Function} props.onToggleGrid - Toggle grid visibility
 * @param {boolean} props.showInsights - Whether insight zones are visible
 * @param {Function} props.onToggleInsights - Toggle insight zones visibility
 */
export default function GraphControls({
  onZoomIn,
  onZoomOut,
  onReset,
  showGrid,
  onToggleGrid,
  showInsights,
  onToggleInsights
}) {
  const buttonBase = "p-2 rounded-full text-white backdrop-blur transition-colors";
  const buttonInactive = "bg-slate-800/80 hover:bg-slate-700";
  const buttonActive = "bg-purple-600";

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className={`${buttonBase} ${buttonInactive}`}
        title="Zoom In"
      >
        <ZoomIn size={20} />
      </button>
      
      <button
        onClick={onZoomOut}
        className={`${buttonBase} ${buttonInactive}`}
        title="Zoom Out"
      >
        <ZoomOut size={20} />
      </button>
      
      <button
        onClick={onReset}
        className={`${buttonBase} ${buttonInactive}`}
        title="Reset View"
      >
        <Move size={20} />
      </button>
      
      <button
        onClick={onToggleGrid}
        className={`${buttonBase} ${showGrid ? buttonActive : buttonInactive}`}
        title="Toggle Grid"
      >
        <Grid size={18} />
      </button>
      
      <button
        onClick={onToggleInsights}
        className={`${buttonBase} ${showInsights ? buttonActive : buttonInactive}`}
        title="Toggle Insight Zones"
      >
        <Info size={18} />
      </button>
    </div>
  );
}

