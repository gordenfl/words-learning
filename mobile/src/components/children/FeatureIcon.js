/**
 * 功能图标组件 - 围绕中心角色的功能按钮
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import ChildrenTheme from '../../theme/childrenTheme';

export default function FeatureIcon({
  icon,
  label,
  color,
  onPress,
  size = 64,
  position, // 数字：0-5 表示在圆圈上的位置（6个图标均匀分布）
  totalIcons = 6, // 总图标数量
}) {
  const positionStyle = getPositionStyle(position, size, totalIcons);
  
  return (
    <View
      style={[
        styles.wrapper,
        positionStyle,
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color || ChildrenTheme.colors.primary,
            },
          ]}
        >
          <IconButton
            icon={icon}
            size={size * 0.5}
            iconColor={ChildrenTheme.colors.textInverse}
            style={styles.icon}
          />
        </View>
        {label && (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function getPositionStyle(position, size, totalIcons = 6) {
  const radius = 140; // 距离中心的距离
  
  // 如果是数字，计算均匀分布的角度
  // 从顶部开始（-90度），顺时针分布
  let angle;
  if (typeof position === 'number') {
    // 均匀分布在圆圈上
    // 从顶部开始，每个图标间隔 360/totalIcons 度
    const angleStep = 360 / totalIcons;
    angle = -90 + (position * angleStep); // -90 是顶部，顺时针旋转
  } else {
    // 兼容旧的字符串位置（向后兼容）
    const angleMap = {
      top: -90,
      topRight: -45,
      right: 0,
      bottomRight: 45,
      bottom: 90,
      bottomLeft: 135,
      left: 180,
      topLeft: -135,
    };
    angle = angleMap[position] || 0;
  }

  const radian = (angle * Math.PI) / 180;
  const x = Math.cos(radian) * radius;
  const y = Math.sin(radian) * radius;

  // 计算相对于容器中心的位置
  // 容器是 300x300，中心在 150, 150
  const centerX = 150;
  const centerY = 150;
  // 考虑标签的高度，调整位置
  const labelHeight = 20;
  const totalHeight = size + labelHeight + 8; // 8 是间距
  const left = centerX + x - size / 2;
  const top = centerY + y - totalHeight / 2;

  return {
    position: 'absolute',
    left,
    top,
    alignItems: 'center',
  };
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...ChildrenTheme.shadows.button,
  },
  icon: {
    margin: 0,
  },
  label: {
    ...ChildrenTheme.typography.caption,
    marginTop: ChildrenTheme.spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
    color: ChildrenTheme.colors.text,
    fontSize: 13,
  },
});
