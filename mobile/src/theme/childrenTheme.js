/**
 * 儿童友好主题配置
 * 专为儿童设计的颜色、字体、间距等设计系统
 */

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
    
    // 背景色
    background: '#FFF8F0',   // 米白色 - 柔和背景
    backgroundLight: '#FFFFFF', // 纯白
    backgroundDark: '#F5E6D3', // 浅棕色
    
    // 卡片和表面
    card: '#FFFFFF',
    cardElevated: '#FFFBF5',
    
    // 文字颜色
    text: '#2C3E50',        // 深灰蓝
    textLight: '#7F8C8D',   // 中灰
    textMuted: '#BDC3C7',   // 浅灰
    textInverse: '#FFFFFF', // 白色文字
    
    // 边框和分割线
    border: '#E8E8E8',
    divider: '#F0F0F0',
    
    // 特殊用途
    overlay: 'rgba(0, 0, 0, 0.3)', // 遮罩层
    shadow: 'rgba(0, 0, 0, 0.1)',  // 阴影
  },

  // 字体系统 - 大、清晰、易读
  typography: {
    // 标题
    h1: {
      fontSize: 36,
      fontWeight: 'bold',
      lineHeight: 44,
      color: '#2C3E50',
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
      color: '#2C3E50',
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      color: '#2C3E50',
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: '#2C3E50',
    },
    
    // 正文
    body: {
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 28,
      color: '#2C3E50',
    },
    bodyLarge: {
      fontSize: 20,
      fontWeight: '400',
      lineHeight: 30,
      color: '#2C3E50',
    },
    bodySmall: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#7F8C8D',
    },
    
    // 特殊用途
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: '#7F8C8D',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 24,
      color: '#2C3E50',
    },
    
    // 汉字显示（超大）
    chinese: {
      fontSize: 72,
      fontWeight: 'bold',
      lineHeight: 88,
      color: '#2C3E50',
    },
    chineseMedium: {
      fontSize: 56,
      fontWeight: 'bold',
      lineHeight: 68,
      color: '#2C3E50',
    },
    chineseSmall: {
      fontSize: 40,
      fontWeight: 'bold',
      lineHeight: 48,
      color: '#2C3E50',
    },
    
    // 拼音
    pinyin: {
      fontSize: 24,
      fontWeight: '400',
      lineHeight: 32,
      color: '#4A90E2',
      fontStyle: 'italic',
    },
  },

  // 间距系统
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  // 圆角系统
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 24,
    round: 999, // 完全圆形
  },

  // 阴影系统 - 柔和、友好
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 8,
    },
  },

  // 按钮尺寸 - 大按钮适合儿童
  button: {
    small: {
      height: 44,
      paddingHorizontal: 16,
      fontSize: 16,
    },
    medium: {
      height: 56,
      paddingHorizontal: 24,
      fontSize: 18,
    },
    large: {
      height: 64,
      paddingHorizontal: 32,
      fontSize: 20,
    },
    icon: {
      size: 56, // 图标按钮至少56x56
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

