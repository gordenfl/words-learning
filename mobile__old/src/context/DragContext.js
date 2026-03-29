import React, { createContext, useContext, useRef, useState } from 'react';

const DragContext = createContext(null);

export const DragProvider = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragTimeoutRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchMoveRef = useRef(null);

  const startDrag = () => {
    setIsDragging(true);
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  };

  const endDrag = () => {
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
    dragTimeoutRef.current = setTimeout(() => {
      setIsDragging(false);
      touchStartRef.current = null;
      touchMoveRef.current = null;
    }, 200);
  };

  const handleTouchStart = (event) => {
    const touch = event.nativeEvent.touches[0];
    touchStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    touchMoveRef.current = null;
  };

  const handleTouchMove = (event) => {
    if (!touchStartRef.current) return;
    
    const touch = event.nativeEvent.touches[0];
    const moveX = Math.abs(touch.pageX - touchStartRef.current.x);
    const moveY = Math.abs(touch.pageY - touchStartRef.current.y);
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);
    
    // 如果移动距离超过阈值（10px），认为是拖动
    if (moveDistance > 10) {
      startDrag();
      touchMoveRef.current = {
        x: touch.pageX,
        y: touch.pageY,
      };
    }
  };

  const handleTouchEnd = () => {
    if (touchMoveRef.current) {
      endDrag();
    } else {
      touchStartRef.current = null;
    }
  };

  return (
    <DragContext.Provider
      value={{
        isDragging,
        startDrag,
        endDrag,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
      }}
    >
      {children}
    </DragContext.Provider>
  );
};

export const useDrag = () => {
  const context = useContext(DragContext);
  if (!context) {
    return {
      isDragging: false,
      startDrag: () => {},
      endDrag: () => {},
      handleTouchStart: () => {},
      handleTouchMove: () => {},
      handleTouchEnd: () => {},
    };
  }
  return context;
};

