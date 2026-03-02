/**
 * 功能图标组件 - 围绕中心角色的功能按钮
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import ChildrenTheme from '../../theme/childrenTheme';

export default function FeatureIcon({
  icon,
  label,
  color,
  onPress,
  size = 128,
  position, // 数字：0-5 表示在圆圈上的位置（6个图标均匀分布）
  totalIcons = 6, // 总图标数量
  imageSource, // 背景图片源
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
        <ImageBackground
          source={imageSource}
          style={[
            styles.iconContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              overflow: 'hidden',
            },
          ]}
          resizeMode="cover"
        >
          {label && (
            <Text 
              style={[
                styles.label, 
                { 
                  fontSize: size * 0.15, // 根据按钮大小动态计算，放大一倍
                  top: size * 0.5 - (size * 0.22) / 2, // 上下居中
                }
              ]} 
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
        </ImageBackground>
        {!imageSource && label && (
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
  // 标签现在在按钮内部，不需要额外空间
  const left = centerX + x - size / 2;
  const top = centerY + y - size / 2;

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
  label: {
    ...ChildrenTheme.typography.caption,
    textAlign: 'center',
    fontWeight: 'bold',
    color: ChildrenTheme.colors.textInverse,
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
