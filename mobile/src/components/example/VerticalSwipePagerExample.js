import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import { useTheme } from "react-native-paper";
import VerticalSwipePager from "../VerticalSwipePager";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Example DetailPage component - Full screen detail view
 */
function DetailPage({ item, index }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.detailPage,
        { backgroundColor: item.color || theme.colors.background },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {item.title || `Item ${index + 1}`}
        </Text>
        {item.description && (
          <Text style={[styles.description, { color: theme.colors.text }]}>
            {item.description}
          </Text>
        )}
        <Text style={[styles.index, { color: theme.colors.text }]}>
          Page {index + 1} of {item.total || "?"}
        </Text>
      </View>
    </View>
  );
}

/**
 * Example usage of VerticalSwipePager
 */
export default function VerticalSwipePagerExample() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial data
  useEffect(() => {
    // Simulate loading initial data
    setTimeout(() => {
      const initialData = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i + 1}`,
        description: `This is the detail view for item ${i + 1}`,
        color: `hsl(${(i * 30) % 360}, 70%, 80%)`,
        total: 10,
      }));
      setItems(initialData);
      setLoading(false);
    }, 500);
  }, []);

  // Load next items (simulate API call)
  const loadNextItems = async (currentIndex) => {
    console.log(`Loading next items after index ${currentIndex}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Return new items
    const newItems = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${items.length + i}`,
      title: `Item ${items.length + i + 1}`,
      description: `This is a newly loaded item ${items.length + i + 1}`,
      color: `hsl(${((items.length + i) * 30) % 360}, 70%, 80%)`,
      total: items.length + 5,
    }));
    
    return newItems;
  };

  // Load previous items (simulate API call)
  const loadPreviousItems = async (currentIndex) => {
    console.log(`Loading previous items before index ${currentIndex}`);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Return new items (prepend to list)
    const newItems = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${-i - 1}`,
      title: `Previous Item ${-i}`,
      description: `This is a previously loaded item ${-i}`,
      color: `hsl(${((-i - 1) * 30) % 360}, 70%, 80%)`,
      total: items.length + 5,
    }));
    
    return newItems;
  };

  // Handle page selection
  const handlePageSelected = (index) => {
    console.log(`Page selected: ${index}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <VerticalSwipePager
        data={items}
        renderItem={({ item, index }) => (
          <DetailPage item={item} index={index} />
        )}
        initialPage={0}
        onPageSelected={handlePageSelected}
        onLoadNext={loadNextItems}
        onLoadPrevious={loadPreviousItems}
        preloadCount={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  detailPage: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 18,
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  index: {
    fontSize: 16,
    opacity: 0.7,
  },
});

