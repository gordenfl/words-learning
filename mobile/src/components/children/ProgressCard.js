/**
 * 进度卡片组件 - 儿童友好版本
 * 用于显示学习进度，带进度条和动画效果
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import ChildrenTheme from '../../theme/childrenTheme';

export default function ProgressCard({
  emoji = '📚',
  label = '学习进度',
  current = 0,
  total = 10,
  color = ChildrenTheme.colors.primary,
  showPercentage = true,
  style,
}) {
  const [progressAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    const progress = total > 0 ? Math.min(current / total, 1) : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [current, total]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: color + '20' }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.count}>
          {current} / {total}
        </Text>
        {showPercentage && (
          <Text style={[styles.percentage, { color }]}>
            {percentage}%
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.large,
    padding: ChildrenTheme.spacing.lg,
    marginBottom: ChildrenTheme.spacing.md,
    ...ChildrenTheme.shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ChildrenTheme.spacing.md,
  },
  emoji: {
    fontSize: 32,
    marginRight: ChildrenTheme.spacing.sm,
  },
  label: {
    ...ChildrenTheme.typography.h4,
    flex: 1,
  },
  progressContainer: {
    marginBottom: ChildrenTheme.spacing.sm,
  },
  progressBar: {
    height: 20,
    borderRadius: ChildrenTheme.borderRadius.round,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: ChildrenTheme.borderRadius.round,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    ...ChildrenTheme.typography.body,
    fontWeight: '600',
  },
  percentage: {
    ...ChildrenTheme.typography.body,
    fontWeight: 'bold',
  },
});

