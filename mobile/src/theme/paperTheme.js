/**
 * React Native Paper 主题配置
 * 儿童友好的 Material Design 主题
 */
import { MD3LightTheme, configureFonts } from 'react-native-paper';
import ChildrenTheme from './childrenTheme';

// 创建 Paper 主题的函数（支持动态主题）
export const createPaperTheme = (childrenTheme = ChildrenTheme) => {
  return {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // 主色调 - 使用传入的动态主题
    primary: childrenTheme.colors.primary,
    primaryContainer: childrenTheme.colors.primaryLight,
    onPrimary: childrenTheme.colors.textInverse,
    onPrimaryContainer: childrenTheme.colors.primaryDark,
    
    // 次要色
    secondary: childrenTheme.colors.secondary,
    secondaryContainer: childrenTheme.colors.secondaryLight,
    onSecondary: childrenTheme.colors.textInverse,
    onSecondaryContainer: childrenTheme.colors.secondaryDark,
    
    // 强调色
    tertiary: childrenTheme.colors.accent,
    tertiaryContainer: childrenTheme.colors.accentLight,
    onTertiary: childrenTheme.colors.text,
    onTertiaryContainer: childrenTheme.colors.text,
    
    // 错误色
    error: childrenTheme.colors.error,
    errorContainer: '#FFE4E1',
    onError: childrenTheme.colors.textInverse,
    onErrorContainer: childrenTheme.colors.error,
    
    // 背景色
    background: childrenTheme.colors.background,
    onBackground: childrenTheme.colors.text,
    surface: childrenTheme.colors.card,
    onSurface: childrenTheme.colors.text,
    surfaceVariant: childrenTheme.colors.backgroundDark,
    onSurfaceVariant: childrenTheme.colors.textLight,
    
    // 轮廓色
    outline: childrenTheme.colors.border,
    outlineVariant: childrenTheme.colors.divider,
    
    // 阴影
    shadow: childrenTheme.colors.shadow,
    scrim: childrenTheme.colors.overlay,
    
    // 反转色（用于深色模式）
    inverseSurface: childrenTheme.colors.text,
    inverseOnSurface: childrenTheme.colors.background,
    inversePrimary: childrenTheme.colors.primaryLight,
    
    // 表面色调
    surfaceDim: childrenTheme.colors.backgroundDark,
    surfaceBright: childrenTheme.colors.card,
    surfaceContainerLowest: childrenTheme.colors.backgroundLight,
    surfaceContainerLow: childrenTheme.colors.background,
    surfaceContainer: childrenTheme.colors.card,
    surfaceContainerHigh: childrenTheme.colors.cardElevated,
    surfaceContainerHighest: childrenTheme.colors.card,
  },
  // 圆角
  roundness: childrenTheme.borderRadius.medium,
  // 字体配置
  fonts: configureFonts({
    config: {
      displayLarge: {
        ...childrenTheme.typography.h1,
      },
      displayMedium: {
        ...childrenTheme.typography.h2,
      },
      displaySmall: {
        ...childrenTheme.typography.h3,
      },
      headlineLarge: {
        ...childrenTheme.typography.h2,
      },
      headlineMedium: {
        ...childrenTheme.typography.h3,
      },
      headlineSmall: {
        ...childrenTheme.typography.h4,
      },
      titleLarge: {
        ...childrenTheme.typography.h4,
      },
      titleMedium: {
        ...childrenTheme.typography.bodyLarge,
      },
      titleSmall: {
        ...childrenTheme.typography.body,
      },
      bodyLarge: {
        ...childrenTheme.typography.bodyLarge,
      },
      bodyMedium: {
        ...childrenTheme.typography.body,
      },
      bodySmall: {
        ...childrenTheme.typography.bodySmall,
      },
      labelLarge: {
        ...childrenTheme.typography.label,
      },
      labelMedium: {
        ...childrenTheme.typography.bodySmall,
      },
      labelSmall: {
        ...childrenTheme.typography.caption,
      },
    },
  }),
  };
};

// 默认主题（向后兼容）
export const paperTheme = createPaperTheme();

export default paperTheme;

