import { useRef } from 'react';

/**
 * Hook to track scroll/drag state and prevent click events after dragging
 * @returns {Object} { isDragging, scrollHandlers, createPressHandler }
 */
export const useScrollDragHandler = () => {
  const isDraggingRef = useRef(false);
  const dragTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchMoveRef = useRef(null);

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
    }, 150);
  };

  const handleMomentumScrollEnd = () => {
    // Clear dragging state when momentum scrolling ends
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  // 处理触摸开始
  const handleTouchStart = (event) => {
    const touch = event.nativeEvent.touches[0];
    touchStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    touchMoveRef.current = null;
  };

  // 处理触摸移动
  const handleTouchMove = (event) => {
    if (!touchStartRef.current) return;
    
    const touch = event.nativeEvent.touches[0];
    const moveX = Math.abs(touch.pageX - touchStartRef.current.x);
    const moveY = Math.abs(touch.pageY - touchStartRef.current.y);
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
    
    // 如果移动距离超过阈值（10px），认为是拖动
    if (moveDistance > 10) {
      isDraggingRef.current = true;
      touchMoveRef.current = {
        x: touch.pageX,
        y: touch.pageY,
      };
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    if (touchMoveRef.current) {
      // 如果发生了移动，延迟清除拖动状态
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      dragTimeoutRef.current = setTimeout(() => {
        isDraggingRef.current = false;
        touchStartRef.current = null;
        touchMoveRef.current = null;
      }, 200);
    } else {
      // 如果没有移动，立即清除
      touchStartRef.current = null;
    }
  };

  const scrollHandlers = {
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    onMomentumScrollEnd: handleMomentumScrollEnd,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  /**
   * Creates a press handler that checks if we're dragging
   * @param {Function} onPress - Original onPress handler
   * @returns {Function} Wrapped onPress handler
   */
  const createPressHandler = (onPress) => {
    return (event) => {
      // 检查是否正在拖动
      if (isDraggingRef.current) {
        // Don't trigger if we're dragging
        return;
      }
      
      // 检查是否有触摸移动
      if (touchMoveRef.current) {
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

