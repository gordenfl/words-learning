/**
 * Web stub for react-native-pager-view (native-only).
 * Vertical scroll with paging; exposes setPage via ref.
 */
import React, { useImperativeHandle, useRef } from "react";
import { View, ScrollView, StyleSheet, Dimensions } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const PagerViewWebStub = React.forwardRef(function PagerViewWebStub(
  {
    style,
    initialPage = 0,
    onPageSelected,
    onPageScrollStateChanged,
    children,
    orientation = "vertical",
    overdrag,
    scrollEnabled,
    ...rest
  },
  ref
) {
  const scrollRef = useRef(null);
  const childArray = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = React.useState(
    Math.min(initialPage, Math.max(0, childArray.length - 1))
  );

  useImperativeHandle(ref, () => ({
    setPage: (index) => {
      const i = Math.max(0, Math.min(index, childArray.length - 1));
      setCurrentIndex(i);
      scrollRef.current?.scrollTo({ y: i * SCREEN_HEIGHT, animated: true });
    },
  }));

  React.useEffect(() => {
    if (onPageSelected) {
      onPageSelected({ nativeEvent: { position: currentIndex } });
    }
  }, [currentIndex, onPageSelected]);

  if (childArray.length === 0) return <View style={[styles.pager, style]} />;

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.pager, style]}
      pagingEnabled
      vertical
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={(e) => {
        const index = Math.round(
          e.nativeEvent.contentOffset.y / SCREEN_HEIGHT
        );
        setCurrentIndex(index);
        if (onPageScrollStateChanged) {
          onPageScrollStateChanged({ nativeEvent: { pageScrollState: "idle" } });
        }
      }}
      onScrollBeginDrag={() => {
        if (onPageScrollStateChanged) {
          onPageScrollStateChanged({
            nativeEvent: { pageScrollState: "dragging" },
          });
        }
      }}
      scrollEventThrottle={16}
      {...rest}
    >
      {childArray.map((child, i) => (
        <View key={i} style={styles.page}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  pager: { flex: 1 },
  page: { height: SCREEN_HEIGHT, width: "100%" },
});

export default PagerViewWebStub;
