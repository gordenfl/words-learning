/**
 * 中心角色组件 - 小男孩形象
 * 用于主界面中心显示
 */
import React from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import ChildrenTheme from '../../theme/childrenTheme';

export default function CenterCharacter({ size = 120, style }) {
  const [bounceAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    // 轻微的弹跳动画，让角色更生动
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ translateY: bounceAnim }],
        },
        style,
      ]}
    >
      <View style={[styles.characterWrapper, { width: size, height: size }]}>
        <Image
          source={require('../../../assets/icon.png')}
          style={[styles.character, { width: size, height: size }]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterWrapper: {
    borderRadius: ChildrenTheme.borderRadius.round,
    overflow: 'hidden',
    backgroundColor: ChildrenTheme.colors.background,
    ...ChildrenTheme.shadows.medium,
  },
  character: {
    width: '100%',
    height: '100%',
  },
});
