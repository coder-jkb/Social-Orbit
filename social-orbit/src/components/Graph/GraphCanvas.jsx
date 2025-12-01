/**
 * GraphCanvas Component
 * Main graph viewport containing all graph elements
 */

import React, { useRef, useCallback } from 'react';
import { User } from 'lucide-react';
import { useGraphInteraction } from '../../hooks';
import FriendNode from './FriendNode';
import ClusterMenu from './ClusterMenu';
import GraphControls from './GraphControls';
import GraphBackground from './GraphBackground';

/**
 * Detect cluster of overlapping friends at a position
 */
function detectCluster(friends, targetFriend, threshold = 3) {
  return friends.filter((f) => {
    const dx = f.x - targetFriend.x;
    const dy = f.y - targetFriend.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  });
}

/**
 * GraphCanvas - Main graph viewport
 * @param {Object} props
 * @param {Array} props.friends - Array of friend objects
 * @param {Object|null} props.selectedFriend - Currently selected friend
 * @param {Function} props.onSelectFriend - Called when a friend is selected
 * @param {Function} props.onUpdateFriends - Called when friends array needs updating
 * @param {Function} props.onEditPersona - Called when "ME" button is clicked
 * @param {number} props.width - Width percentage of container
 */
export default function GraphCanvas({
  friends,
  selectedFriend,
  onSelectFriend,
  onUpdateFriends,
  onEditPersona,
  width
}) {
  const graphRef = useRef(null);
  const [clusterMenu, setClusterMenu] = React.useState(null);
  const [showGrid, setShowGrid] = React.useState(true);
  const [showInsights, setShowInsights] = React.useState(true);

  // Handle node click - either select or show cluster menu
  const handleNodeClick = useCallback((nodeId) => {
    const clickedFriend = friends.find((f) => f.id === nodeId);
    if (!clickedFriend) return;

    const neighbors = detectCluster(friends, clickedFriend);

    if (neighbors.length > 1) {
      // Multiple nodes at this position - show cluster menu
      setClusterMenu({
        items: neighbors,
        x: clickedFriend.x,
        y: clickedFriend.y
      });
      onSelectFriend(null);
    } else {
      // Single node - select it
      onSelectFriend(clickedFriend);
      setClusterMenu(null);
    }
  }, [friends, onSelectFriend]);

  // Handle node drag - update friend position
  const handleNodeDrag = useCallback((nodeId, deltaX, deltaY) => {
    onUpdateFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === nodeId) {
          const newX = Math.min(Math.max(f.x + deltaX, 0), 100);
          const newY = Math.min(Math.max(f.y + deltaY, 0), 100);
          return { ...f, x: newX, y: newY };
        }
        return f;
      })
    );

    // Update selected friend if it's being dragged
    if (selectedFriend?.id === nodeId) {
      onSelectFriend((prev) => ({
        ...prev,
        x: Math.min(Math.max(prev.x + deltaX, 0), 100),
        y: Math.min(Math.max(prev.y + deltaY, 0), 100)
      }));
    }
  }, [selectedFriend, onSelectFriend, onUpdateFriends]);

  // Graph interaction hook
  const {
    view,
    handleWheel,
    handleGraphMouseDown,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetView,
    zoomIn,
    zoomOut
  } = useGraphInteraction({
    onNodeClick: handleNodeClick,
    onNodeDrag: handleNodeDrag,
    graphRef
  });

  // Close cluster menu when clicking on graph
  const handleGraphClick = useCallback((e) => {
    handleGraphMouseDown(e);
    setClusterMenu(null);
  }, [handleGraphMouseDown]);

  return (
    <div
      className="relative h-screen overflow-hidden bg-slate-950 transition-[width] duration-75 ease-linear"
      style={{ width: `${width}%` }}
    >
      {/* Main graph area */}
      <div
        ref={graphRef}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleGraphClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Transform layer */}
        <div
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: 'top left',
            width: '100%',
            height: '100%'
          }}
          className="w-full h-full"
        >
          {/* Background layers */}
          <GraphBackground
            showGrid={showGrid}
            showInsights={showInsights}
            scale={view.scale}
          />

          {/* Nodes container */}
          <div className="absolute top-0 left-0 w-full h-full border-l-2 border-t-2 border-white/50 origin-top-left p-12">
            {/* Friend nodes */}
            {friends.map((friend) => (
              <FriendNode
                key={friend.id}
                friend={friend}
                isSelected={selectedFriend?.id === friend.id}
                onMouseDown={(e) => handleNodeMouseDown(e, friend.id)}
              />
            ))}

            {/* Cluster menu */}
            {clusterMenu && (
              <ClusterMenu
                items={clusterMenu.items}
                x={clusterMenu.x}
                y={clusterMenu.y}
                scale={view.scale}
                onSelect={onSelectFriend}
                onClose={() => setClusterMenu(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* HUD Controls */}
      <GraphControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        showInsights={showInsights}
        onToggleInsights={() => setShowInsights((v) => !v)}
      />

      {/* ME button (user position at 0,0) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto">
        <button
          onClick={onEditPersona}
          className="bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
          title="Edit My Persona"
        >
          <User size={16} />
          ME <span className="text-xs text-slate-500">(0,0)</span>
        </button>
      </div>
    </div>
  );
}

