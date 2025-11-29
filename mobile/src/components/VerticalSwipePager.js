import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import PagerView from "react-native-pager-view";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * VerticalSwipePager - TikTok-like vertical swipe pager
 * 
 * @param {Array} data - Array of items to display
 * @param {Function} renderItem - Function to render each item: ({ item, index }) => ReactNode
 * @param {Number} initialPage - Initial page index (default: 0)
 * @param {Function} onPageSelected - Callback when page changes: (index) => void
 * @param {Function} onLoadNext - Optional: async function to load next items: (currentIndex) => Promise<Array>
 * @param {Function} onLoadPrevious - Optional: async function to load previous items: (currentIndex) => Promise<Array>
 * @param {Number} preloadCount - Number of pages to preload (default: 1)
 * @param {ReactNode} loadingComponent - Component to show while loading
 */
export default function VerticalSwipePager({
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
  const [loading, setLoading] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set([initialPage]));
  const pagerRef = useRef(null);
  const loadingRef = useRef(false);

  // Update items when data prop changes
  useEffect(() => {
    setItems(data);
    setCurrentPage(initialPage);
    setLoadedPages(new Set([initialPage]));
  }, [data, initialPage]);

  // Preload adjacent pages
  useEffect(() => {
    preloadAdjacentPages(currentPage);
  }, [currentPage, items.length]);

  const preloadAdjacentPages = useCallback(
    async (pageIndex) => {
      const pagesToLoad = new Set();
      
      // Add pages to preload
      for (let i = 1; i <= preloadCount; i++) {
        if (pageIndex + i < items.length) {
          pagesToLoad.add(pageIndex + i);
        }
        if (pageIndex - i >= 0) {
          pagesToLoad.add(pageIndex - i);
        }
      }

      // Load pages that haven't been loaded yet
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

      // Call onPageSelected callback
      if (onPageSelected) {
        onPageSelected(page);
      }

      // Preload adjacent pages
      preloadAdjacentPages(page);

      // Load next items if we're near the end
      if (
        onLoadNext &&
        !loadingRef.current &&
        page >= items.length - preloadCount - 1
      ) {
        loadingRef.current = true;
        setLoading(true);
        try {
          const newItems = await onLoadNext(page);
          if (newItems && newItems.length > 0) {
            setItems((prev) => [...prev, ...newItems]);
          }
        } catch (error) {
          console.error("Error loading next items:", error);
        } finally {
          setLoading(false);
          loadingRef.current = false;
        }
      }

      // Load previous items if we're near the beginning
      if (
        onLoadPrevious &&
        !loadingRef.current &&
        page <= preloadCount
      ) {
        loadingRef.current = true;
        setLoading(true);
        try {
          const newItems = await onLoadPrevious(page);
          if (newItems && newItems.length > 0) {
            setItems((prev) => [...newItems, ...prev]);
            // Adjust current page after prepending items
            setTimeout(() => {
              if (pagerRef.current) {
                pagerRef.current.setPage(page + newItems.length);
              }
            }, 100);
          }
        } catch (error) {
          console.error("Error loading previous items:", error);
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
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        orientation="vertical"
        onPageSelected={handlePageSelected}
        overdrag={false}
        scrollEnabled={true}
      >
        {items.map((item, index) => {
          // Only render if page is loaded or adjacent to current page
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
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    height: SCREEN_HEIGHT,
    width: "100%",
  },
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

