import { useRef } from 'react';

/**
 * Hook to track scroll/drag state and prevent click events after dragging
 * @returns {Object} { isDragging, scrollHandlers, createPressHandler }
 */
export const useScrollDragHandler = () => {
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef(null);

  const handleScrollBeginDrag = () => {
    isDraggingRef.current = true;
    // Clear any existing timeout
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    // Wait a bit before allowing clicks again (in case of momentum scrolling)
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleMomentumScrollEnd = () => {
    // Clear dragging state when momentum scrolling ends
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 50);
  };

  const scrollHandlers = {
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    onMomentumScrollEnd: handleMomentumScrollEnd,
  };

  /**
   * Creates a press handler that checks if we're dragging
   * @param {Function} onPress - Original onPress handler
   * @returns {Function} Wrapped onPress handler
   */
  const createPressHandler = (onPress) => {
    return (event) => {
      if (isDraggingRef.current) {
        // Don't trigger if we're dragging
        return;
      }
      if (onPress) {
        onPress(event);
      }
    };
  };

  return {
    isDragging: isDraggingRef.current,
    scrollHandlers,
    createPressHandler,
  };
};

