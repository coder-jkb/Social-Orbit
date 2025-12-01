/**
 * useGraphInteraction Hook
 * Handles all graph viewport interactions:
 * - Panning (drag to move view)
 * - Zooming (mouse wheel)
 * - Node dragging
 * - Click detection
 */

import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook for graph interaction
 * @param {Object} options - Hook options
 * @param {Function} options.onNodeClick - Callback when a node is clicked (not dragged)
 * @param {Function} options.onNodeDrag - Callback when a node is dragged with new position
 * @param {React.RefObject} options.graphRef - Ref to the graph container for position calculations
 * @returns {Object} Interaction handlers and state
 */
export function useGraphInteraction({ onNodeClick, onNodeDrag, graphRef }) {
  // Viewport state
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  
  // Drag tracking ref (not state to avoid re-renders during drag)
  const dragInfo = useRef({
    isDragging: false,
    type: null, // 'view' or 'node'
    targetId: null,
    startX: 0,
    startY: 0,
    hasMoved: false
  });

  // Handle mouse wheel for zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setView(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale + scaleAmount, 0.5), 4)
    }));
  }, []);

  // Handle mouse down on graph background (start view drag)
  const handleGraphMouseDown = useCallback((e) => {
    dragInfo.current = {
      isDragging: true,
      type: 'view',
      targetId: null,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };
  }, []);

  // Handle mouse down on a node (start node drag)
  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation(); // Prevent graph drag
    dragInfo.current = {
      isDragging: true,
      type: 'node',
      targetId: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false
    };
  }, []);

  // Handle mouse move (drag view or node)
  const handleMouseMove = useCallback((e) => {
    if (!dragInfo.current.isDragging) return;

    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;

    // Threshold to distinguish click vs drag
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragInfo.current.hasMoved = true;
    }

    if (dragInfo.current.type === 'view') {
      // Drag the viewport
      setView(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
    } else if (dragInfo.current.type === 'node' && dragInfo.current.hasMoved) {
      // Drag a node - convert pixel delta to percentage
      if (graphRef?.current) {
        const rect = graphRef.current.getBoundingClientRect();
        const currentScale = view.scale;
        const percentDx = (dx / currentScale / rect.width) * 100;
        const percentDy = (dy / currentScale / rect.height) * 100;

        if (onNodeDrag) {
          onNodeDrag(dragInfo.current.targetId, percentDx, percentDy);
        }
      }
    }

    // Update last position for next frame
    dragInfo.current.startX = e.clientX;
    dragInfo.current.startY = e.clientY;
  }, [graphRef, view.scale, onNodeDrag]);

  // Handle mouse up (end drag, detect click)
  const handleMouseUp = useCallback(() => {
    const { isDragging, hasMoved, type, targetId } = dragInfo.current;

    // If it was a click (not a drag) on a node, trigger click handler
    if (isDragging && !hasMoved && type === 'node' && onNodeClick) {
      onNodeClick(targetId);
    }

    dragInfo.current.isDragging = false;
  }, [onNodeClick]);

  // Reset view to default
  const resetView = useCallback(() => {
    setView({ x: 0, y: 0, scale: 1 });
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setView(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.5, 4)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setView(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.5, 0.5)
    }));
  }, []);

  return {
    // State
    view,
    isDragging: dragInfo.current.isDragging,
    
    // Event handlers
    handleWheel,
    handleGraphMouseDown,
    handleNodeMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Actions
    resetView,
    zoomIn,
    zoomOut,
    setView
  };
}

