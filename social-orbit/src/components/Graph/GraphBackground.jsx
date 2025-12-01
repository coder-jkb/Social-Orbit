/**
 * GraphBackground Component
 * Gradient background, grid overlay, and insight zones
 */

import React from 'react';

/**
 * Gradient background style
 */
const gradientStyle = {
  background: `radial-gradient(farthest-corner at 0 0,
    #ffffff 0%,
    #f8fafc 4%,
    #e2e8f0 8%,
    #c084fc 14%,
    #a855f7 22%,
    #3b82f6 40%,
    #1e3a8a 58%,
    #0f172a 72%,
    #000000 100%)`,
  opacity: 0.9
};

/**
 * Grid overlay with percentage markers
 */
function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[25, 50, 75].map((v) => (
        <React.Fragment key={v}>
          {/* Horizontal line */}
          <div
            style={{ top: `${v}%` }}
            className="absolute left-0 w-full h-px bg-slate-600/30"
          />
          {/* Vertical line */}
          <div
            style={{ left: `${v}%` }}
            className="absolute top-0 h-full w-px bg-slate-600/30"
          />
          {/* Y-axis label */}
          <div
            style={{ top: `${v}%`, left: 4 }}
            className="absolute -translate-y-1 text-[10px] text-slate-500/70 font-mono"
          >
            {v}
          </div>
          {/* X-axis label */}
          <div
            style={{ left: `${v}%`, top: 4 }}
            className="absolute -translate-x-1 text-[10px] text-slate-500/70 font-mono"
          >
            {v}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * Insight zone overlays showing relationship regions
 */
function InsightZones({ scale }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Inner Circle Zone (0-40) */}
      <div
        className="absolute"
        style={{
          left: '0%',
          top: '0%',
          width: '40%',
          height: '40%',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="absolute bottom-2 right-2 text-[10px] font-semibold tracking-wide text-black/70">
          Inner Circle / Family (0-40)
        </div>
      </div>

      {/* Mid Zone (45-75) */}
      <div
        className="absolute"
        style={{
          left: '45%',
          top: '45%',
          width: '30%',
          height: '30%',
          background: 'rgba(150,100,255,0.30)',
          border: '1px solid rgba(99,102,241,0.07)'
        }}
      >
        <div className="absolute top-2 left-2 text-[10px] font-semibold tracking-wide text-white-500/40">
          Close → Formal (45-75)
        </div>
      </div>

      {/* Outer Weak Bonds Zone (80-100) */}
      <div
        className="absolute"
        style={{
          left: '80%',
          top: '80%',
          width: '20%',
          height: '20%',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.12)'
        }}
      >
        <div className="absolute top-2 left-2 text-[10px] font-semibold tracking-wide text-red-400/80">
          Weak / Fading (80-100)
        </div>
      </div>

      {/* Diagonal watermark */}
      <div
        className="absolute w-[140%] left-0 top-20 rotate-[-25deg] text-center font-bold text-4xl select-none"
        style={{ opacity: 0.04, transformOrigin: 'left top' }}
      >
        <div className="bg-gradient-to-r from-purple-400 to-red-500 bg-clip-text text-transparent">
          RELATIONSHIP GRAVITY FIELD
        </div>
      </div>

      {/* Corner markers (scale inversely for readability) */}
      <div
        className="absolute text-[10px] font-semibold text-white/40 select-none"
        style={{
          left: '0%',
          top: '0%',
          transform: `translate(4px,4px) scale(${1 / scale})`,
          transformOrigin: 'top left'
        }}
      >
        0,0
      </div>
      <div
        className="absolute text-[10px] font-semibold text-white/40 select-none"
        style={{
          left: '100%',
          top: '100%',
          transform: `translate(-100%,-100%) translate(-4px,-4px) scale(${1 / scale})`,
          transformOrigin: 'bottom right'
        }}
      >
        100,100
      </div>
    </div>
  );
}

/**
 * GraphBackground - Background layers for the graph
 * @param {Object} props
 * @param {boolean} props.showGrid - Whether to show grid
 * @param {boolean} props.showInsights - Whether to show insight zones
 * @param {number} props.scale - Current view scale
 */
export default function GraphBackground({ showGrid, showInsights, scale }) {
  return (
    <>
      {/* Gradient background */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={gradientStyle}
      />

      {/* Grid overlay */}
      {showGrid && <GridOverlay />}

      {/* Insight zones */}
      {showInsights && <InsightZones scale={scale} />}
    </>
  );
}

