/**
 * 主题变体配置
 * 支持多种颜色主题：粉红色、草绿色、天蓝色
 */

// 粉红色主题（默认）
export const pinkTheme = {
  name: 'pink',
  displayName: '粉红色 / Pink',
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
};

// 草绿色主题
export const greenTheme = {
  name: 'green',
  displayName: '草绿色 / Green',
  colors: {
    // 主色调
    primary: '#7CB342',      // 草绿色 - 自然、清新
    primaryLight: '#AED581', // 浅草绿
    primaryDark: '#558B2F',  // 深草绿
    
    // 辅助色
    secondary: '#66BB6A',    // 绿色 - 活泼、清新
    secondaryLight: '#A5D6A7', // 浅绿色
    secondaryDark: '#388E3C',   // 深绿色
    
    // 强调色
    accent: '#FFE66D',      // 黄色 - 明亮、快乐
    accentLight: '#FFF4B3',  // 浅黄色
    
    // 功能色
    success: '#81C784',      // 绿色 - 成功
    warning: '#FFB74D',      // 橙色 - 提醒
    error: '#E57373',       // 红色 - 错误（柔和）
    info: '#64B5F6',        // 蓝色 - 信息
    
    // 背景色
    background: '#F1F8E9',   // 浅绿色背景
    backgroundLight: '#FFFFFF', // 纯白
    backgroundDark: '#DCEDC8', // 浅绿色
    
    // 卡片和表面
    card: '#FFFFFF',
    cardElevated: '#F9FBE7',
    
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
};

// 天蓝色主题
export const blueTheme = {
  name: 'blue',
  displayName: '天蓝色 / Sky Blue',
  colors: {
    // 主色调
    primary: '#42A5F5',      // 天蓝色 - 清新、明亮
    primaryLight: '#90CAF9', // 浅天蓝
    primaryDark: '#1976D2',  // 深天蓝
    
    // 辅助色
    secondary: '#5C9BD1',    // 蓝色 - 活泼、清新
    secondaryLight: '#90C5F0', // 浅蓝色
    secondaryDark: '#1565C0',   // 深蓝色
    
    // 强调色
    accent: '#FFE66D',      // 黄色 - 明亮、快乐
    accentLight: '#FFF4B3',  // 浅黄色
    
    // 功能色
    success: '#66BB6A',      // 绿色 - 成功
    warning: '#FFA726',      // 橙色 - 提醒
    error: '#EF5350',       // 红色 - 错误（柔和）
    info: '#42A5F5',        // 蓝色 - 信息
    
    // 背景色
    background: '#E3F2FD',   // 浅蓝色背景
    backgroundLight: '#FFFFFF', // 纯白
    backgroundDark: '#BBDEFB', // 浅蓝色
    
    // 卡片和表面
    card: '#FFFFFF',
    cardElevated: '#E1F5FE',
    
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
};

// 所有主题列表
export const themeVariants = {
  pink: pinkTheme,
  green: greenTheme,
  blue: blueTheme,
};

// 默认主题（天蓝色）
export const defaultTheme = blueTheme;

