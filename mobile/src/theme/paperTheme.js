/**
 * React Native Paper 主题配置
 * 儿童友好的 Material Design 主题
 */
import { MD3LightTheme, configureFonts } from 'react-native-paper';
import ChildrenTheme from './childrenTheme';

// 将我们的儿童主题转换为 Paper 主题格式
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // 主色调
    primary: ChildrenTheme.colors.primary, // 粉红色
    primaryContainer: ChildrenTheme.colors.primaryLight,
    onPrimary: ChildrenTheme.colors.textInverse,
    onPrimaryContainer: ChildrenTheme.colors.primaryDark,
    
    // 次要色
    secondary: ChildrenTheme.colors.secondary, // 青绿色
    secondaryContainer: ChildrenTheme.colors.secondaryLight,
    onSecondary: ChildrenTheme.colors.textInverse,
    onSecondaryContainer: ChildrenTheme.colors.secondaryDark,
    
    // 强调色
    tertiary: ChildrenTheme.colors.accent, // 黄色
    tertiaryContainer: ChildrenTheme.colors.accentLight,
    onTertiary: ChildrenTheme.colors.text,
    onTertiaryContainer: ChildrenTheme.colors.text,
    
    // 错误色
    error: ChildrenTheme.colors.error,
    errorContainer: '#FFE4E1',
    onError: ChildrenTheme.colors.textInverse,
    onErrorContainer: ChildrenTheme.colors.error,
    
    // 背景色
    background: ChildrenTheme.colors.background,
    onBackground: ChildrenTheme.colors.text,
    surface: ChildrenTheme.colors.card,
    onSurface: ChildrenTheme.colors.text,
    surfaceVariant: ChildrenTheme.colors.backgroundDark,
    onSurfaceVariant: ChildrenTheme.colors.textLight,
    
    // 轮廓色
    outline: ChildrenTheme.colors.border,
    outlineVariant: ChildrenTheme.colors.divider,
    
    // 阴影
    shadow: ChildrenTheme.colors.shadow,
    scrim: ChildrenTheme.colors.overlay,
    
    // 反转色（用于深色模式）
    inverseSurface: ChildrenTheme.colors.text,
    inverseOnSurface: ChildrenTheme.colors.background,
    inversePrimary: ChildrenTheme.colors.primaryLight,
    
    // 表面色调
    surfaceDim: ChildrenTheme.colors.backgroundDark,
    surfaceBright: ChildrenTheme.colors.card,
    surfaceContainerLowest: ChildrenTheme.colors.backgroundLight,
    surfaceContainerLow: ChildrenTheme.colors.background,
    surfaceContainer: ChildrenTheme.colors.card,
    surfaceContainerHigh: ChildrenTheme.colors.cardElevated,
    surfaceContainerHighest: ChildrenTheme.colors.card,
  },
  // 圆角
  roundness: ChildrenTheme.borderRadius.medium,
  // 字体配置
  fonts: configureFonts({
    config: {
      displayLarge: {
        ...ChildrenTheme.typography.h1,
      },
      displayMedium: {
        ...ChildrenTheme.typography.h2,
      },
      displaySmall: {
        ...ChildrenTheme.typography.h3,
      },
      headlineLarge: {
        ...ChildrenTheme.typography.h2,
      },
      headlineMedium: {
        ...ChildrenTheme.typography.h3,
      },
      headlineSmall: {
        ...ChildrenTheme.typography.h4,
      },
      titleLarge: {
        ...ChildrenTheme.typography.h4,
      },
      titleMedium: {
        ...ChildrenTheme.typography.bodyLarge,
      },
      titleSmall: {
        ...ChildrenTheme.typography.body,
      },
      bodyLarge: {
        ...ChildrenTheme.typography.bodyLarge,
      },
      bodyMedium: {
        ...ChildrenTheme.typography.body,
      },
      bodySmall: {
        ...ChildrenTheme.typography.bodySmall,
      },
      labelLarge: {
        ...ChildrenTheme.typography.label,
      },
      labelMedium: {
        ...ChildrenTheme.typography.bodySmall,
      },
      labelSmall: {
        ...ChildrenTheme.typography.caption,
      },
    },
  }),
};

export default paperTheme;

