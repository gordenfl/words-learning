/**
 * 儿童友好主题配置
 * 专为儿童设计的颜色、字体、间距等设计系统
 * Duolingo 风格：圆润、友好、易读
 */
import { Platform } from 'react-native';

export const ChildrenTheme = {
  // 颜色系统 - 明亮、友好、温暖
  colors: {
    // 主色调
    primary: '#FF6B9D',      // 粉红色 - 温暖、友好
    primaryLight: '#FFB3D1', // 浅粉色
    primaryDark: '#E63946',  // 深粉色
    
    // 辅助色
    secondary: '#4ECDC4',    // 青绿色 - 活泼、清新
    secondaryLight: '#95E1D3', // 薄荷绿
    secondaryDark: '#2A9D8F',   // 深青色
    
    // 强调色
    accent: '#FFE66D',      // 黄色 - 明亮、快乐
    accentLight: '#FFF4B3',  // 浅黄色
    
    // 功能色
    success: '#95E1D3',      // 薄荷绿 - 成功
    warning: '#FFA07A',      // 橙色 - 提醒
    error: '#FF6B6B',       // 红色 - 错误（柔和）
    info: '#4A90E2',        // 蓝色 - 信息
    
    // 背景色 - Duolingo 风格：纯白、清爽
    background: '#FFFFFF',   // 纯白色背景（类似 Duolingo）
    backgroundLight: '#FFFFFF', // 纯白
    backgroundDark: '#F5F5F5', // 浅灰色（替代浅棕色）
    
    // 卡片和表面
    card: '#FFFFFF',
    cardElevated: '#FFFBF5',
    
    // 文字颜色
    text: '#2C3E50',        // 深灰蓝
    textLight: '#7F8C8D',   // 中灰
    textMuted: '#BDC3C7',   // 浅灰
    textInverse: '#FFFFFF', // 白色文字
    
    // 边框和分割线 - Duolingo 风格：更柔和
    border: '#E0E0E0',
    divider: '#F5F5F5',
    
    // 特殊用途
    overlay: 'rgba(0, 0, 0, 0.3)', // 遮罩层
    shadow: 'rgba(0, 0, 0, 0.1)',  // 阴影
  },

  // 字体系统 - Duolingo 风格：圆润、友好、易读
  // 使用圆润字体（iOS: Avenir Next, Android: Roboto）
  fontFamily: {
    regular: Platform.select({
      ios: 'Avenir Next',
      android: 'Roboto',
      default: 'System',
    }),
    medium: Platform.select({
      ios: 'Avenir Next Medium',
      android: 'Roboto Medium',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'Avenir Next Bold',
      android: 'Roboto Bold',
      default: 'System',
    }),
  },
  
  typography: {
    // 标题 - 更大、更圆润
    h1: {
      fontSize: 40,
      fontWeight: '700',
      lineHeight: 48,
      color: '#2C3E50',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      color: '#2C3E50',
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 26,
      fontWeight: '600',
      lineHeight: 34,
      color: '#2C3E50',
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 30,
      color: '#2C3E50',
      letterSpacing: -0.1,
    },
    
    // 正文 - 更大、更友好
    body: {
      fontSize: 19,
      fontWeight: '400',
      lineHeight: 30,
      color: '#2C3E50',
      letterSpacing: 0.1,
    },
    bodyLarge: {
      fontSize: 21,
      fontWeight: '400',
      lineHeight: 32,
      color: '#2C3E50',
      letterSpacing: 0.1,
    },
    bodySmall: {
      fontSize: 17,
      fontWeight: '400',
      lineHeight: 26,
      color: '#7F8C8D',
      letterSpacing: 0.1,
    },
    
    // 特殊用途
    caption: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: '#7F8C8D',
      letterSpacing: 0.2,
    },
    label: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 26,
      color: '#2C3E50',
      letterSpacing: 0.1,
    },
    
    // 汉字显示（超大）- 更圆润
    chinese: {
      fontSize: 80,
      fontWeight: '700',
      lineHeight: 96,
      color: '#2C3E50',
      letterSpacing: 2,
    },
    chineseMedium: {
      fontSize: 64,
      fontWeight: '700',
      lineHeight: 76,
      color: '#2C3E50',
      letterSpacing: 1.5,
    },
    chineseSmall: {
      fontSize: 48,
      fontWeight: '700',
      lineHeight: 58,
      color: '#2C3E50',
      letterSpacing: 1,
    },
    
    // 拼音 - 更友好
    pinyin: {
      fontSize: 26,
      fontWeight: '400',
      lineHeight: 34,
      color: '#4A90E2',
      fontStyle: 'italic',
      letterSpacing: 0.5,
    },
  },

  // 间距系统 - Duolingo 风格：更宽松的间距
  spacing: {
    xs: 6,
    sm: 12,
    md: 20,
    lg: 28,
    xl: 36,
    xxl: 56,
    xxxl: 80,
  },

  // 圆角系统 - Duolingo 风格：更大的圆角
  borderRadius: {
    small: 12,
    medium: 16,
    large: 24,
    xlarge: 32,
    round: 999, // 完全圆形
  },

  // 阴影系统 - Duolingo 风格：更柔和、更轻的阴影
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    // Duolingo 风格的按钮阴影
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    // 卡片阴影
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },

  // 按钮尺寸 - Duolingo 风格：更大、更友好的按钮
  button: {
    small: {
      height: 48,
      paddingHorizontal: 20,
      fontSize: 17,
      borderRadius: 16,
    },
    medium: {
      height: 60,
      paddingHorizontal: 28,
      fontSize: 19,
      borderRadius: 20,
    },
    large: {
      height: 68,
      paddingHorizontal: 36,
      fontSize: 21,
      borderRadius: 24,
    },
    icon: {
      size: 64, // 图标按钮更大
    },
  },

  // 卡片样式（注意：在 StyleSheet 中使用时，需要单独应用阴影）
  // card: {
  //   padding: 20,
  //   borderRadius: 16,
  //   backgroundColor: '#FFFFFF',
  // },

  // 动画时长
  animation: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // 图标尺寸
  icon: {
    small: 24,
    medium: 32,
    large: 48,
    xlarge: 64,
  },
};

// 导出默认主题
export default ChildrenTheme;

// 导出主题创建函数（用于动态主题）
export const createChildrenTheme = (colorOverrides) => {
  return {
    ...ChildrenTheme,
    colors: {
      ...ChildrenTheme.colors,
      ...colorOverrides,
    },
  };
};

