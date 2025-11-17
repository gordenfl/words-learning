/**
 * 成就徽章组件 - 儿童友好版本
 * 用于显示解锁的成就
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import ChildrenTheme from '../../theme/childrenTheme';

export default function AchievementBadge({
  icon = '🏆',
  title = '成就',
  description = '完成了一项成就',
  unlocked = false,
  size = 'medium',
  onPress,
}) {
  const scaleAnim = useRef(new Animated.Value(unlocked ? 1 : 0.8)).current;
  const opacityAnim = useRef(new Animated.Value(unlocked ? 1 : 0.5)).current;

  useEffect(() => {
    if (unlocked) {
      // 解锁动画
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
      ]).start();
      
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [unlocked]);

  const sizeStyles = {
    small: {
      container: { width: 80, height: 100 },
      icon: { fontSize: 32 },
      title: { fontSize: 12 },
    },
    medium: {
      container: { width: 100, height: 120 },
      icon: { fontSize: 40 },
      title: { fontSize: 14 },
    },
    large: {
      container: { width: 120, height: 140 },
      icon: { fontSize: 48 },
      title: { fontSize: 16 },
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <Animated.View
      style={[
        styles.container,
        currentSize.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        !unlocked && styles.locked,
      ]}
    >
      <View style={styles.iconContainer}>
        <Text style={[styles.icon, { fontSize: currentSize.icon.fontSize }]}>
          {icon}
        </Text>
      </View>
      <Text
        style={[
          styles.title,
          { fontSize: currentSize.title.fontSize },
          !unlocked && styles.lockedText,
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {description && size !== 'small' && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.large,
    padding: ChildrenTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    margin: ChildrenTheme.spacing.sm,
    ...ChildrenTheme.shadows.small,
  },
  locked: {
    backgroundColor: ChildrenTheme.colors.backgroundDark,
    opacity: 0.6,
  },
  iconContainer: {
    marginBottom: ChildrenTheme.spacing.sm,
  },
  icon: {
    textAlign: 'center',
  },
  title: {
    ...ChildrenTheme.typography.label,
    textAlign: 'center',
    marginBottom: ChildrenTheme.spacing.xs,
  },
  description: {
    ...ChildrenTheme.typography.caption,
    textAlign: 'center',
  },
  lockedText: {
    color: ChildrenTheme.colors.textMuted,
  },
});

