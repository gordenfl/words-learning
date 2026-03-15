import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import PagerView from "react-native-pager-view";
import { DragProvider, useDrag } from "../context/DragContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * VerticalSwipePager - TikTok-like vertical swipe pager (native)
 */
function VerticalSwipePagerInner({
  data = [],
  renderItem,
  initialPage = 0,
  onPageSelected,
  onLoadNext,
  onLoadPrevious,
  preloadCount = 1,
  loadingComponent,
}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [items, setItems] = useState(data);
  const { startDrag, endDrag, handleTouchStart, handleTouchMove, handleTouchEnd } = useDrag();
  const [loading, setLoading] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set([initialPage]));
  const pagerRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    setItems(data);
    setCurrentPage(initialPage);
    setLoadedPages(new Set([initialPage]));
  }, [data, initialPage]);

  useEffect(() => {
    preloadAdjacentPages(currentPage);
  }, [currentPage, items.length]);

  const preloadAdjacentPages = useCallback(
    async (pageIndex) => {
      const pagesToLoad = new Set();
      for (let i = 1; i <= preloadCount; i++) {
        if (pageIndex + i < items.length) pagesToLoad.add(pageIndex + i);
        if (pageIndex - i >= 0) pagesToLoad.add(pageIndex - i);
      }
      for (const page of pagesToLoad) {
        if (!loadedPages.has(page)) {
          setLoadedPages((prev) => new Set([...prev, page]));
        }
      }
    },
    [items.length, preloadCount, loadedPages]
  );

  const handlePageSelected = useCallback(
    async (e) => {
      const page = e.nativeEvent.position;
      setCurrentPage(page);
      if (onPageSelected) onPageSelected(page);
      preloadAdjacentPages(page);
      if (
        onLoadNext &&
        !loadingRef.current &&
        page >= items.length - preloadCount - 1
      ) {
        loadingRef.current = true;
        setLoading(true);
        try {
          const newItems = await onLoadNext(page);
          if (newItems?.length > 0) setItems((prev) => [...prev, ...newItems]);
        } catch (err) {
          console.error("Error loading next items:", err);
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
      if (
        onLoadPrevious &&
        !loadingRef.current &&
        page <= preloadCount
      ) {
        loadingRef.current = true;
        setLoading(true);
        try {
          const newItems = await onLoadPrevious(page);
          if (newItems?.length > 0) {
            setItems((prev) => [...newItems, ...prev]);
            setTimeout(() => {
              if (pagerRef.current) {
                pagerRef.current.setPage(page + newItems.length);
              }
            }, 100);
          }
        } catch (err) {
          console.error("Error loading previous items:", err);
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }
    },
    [
      items.length,
      onLoadNext,
      onLoadPrevious,
      onPageSelected,
      preloadCount,
      preloadAdjacentPages,
    ]
  );

  const defaultLoadingComponent = (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        orientation="vertical"
        onPageSelected={handlePageSelected}
        onPageScrollStateChanged={(e) => {
          const state = e.nativeEvent.pageScrollState;
          if (state === "dragging") startDrag();
          else if (state === "idle") endDrag();
        }}
        overdrag={false}
        scrollEnabled={true}
      >
        {items.map((item, index) => {
          const shouldRender =
            loadedPages.has(index) ||
            Math.abs(index - currentPage) <= preloadCount + 1;
          if (!shouldRender) {
            return (
              <View key={`placeholder-${index}`} style={styles.page}>
                {loadingComponent || defaultLoadingComponent}
              </View>
            );
          }
          return (
            <View key={`page-${index}`} style={styles.page}>
              {renderItem({ item, index })}
            </View>
          );
        })}
      </PagerView>
      {loading && (
        <View style={styles.loadingOverlay}>
          {loadingComponent || defaultLoadingComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pager: { flex: 1 },
  page: { height: SCREEN_HEIGHT, width: "100%" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function VerticalSwipePager(props) {
  return (
    <DragProvider>
      <VerticalSwipePagerInner {...props} />
    </DragProvider>
  );
}
