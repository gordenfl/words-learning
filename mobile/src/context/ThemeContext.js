/**
 * 主题上下文
 * 管理应用的主题切换
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themeVariants, defaultTheme } from '../theme/themeVariants';
import ChildrenTheme from '../theme/childrenTheme';
import { usersAPI } from '../services/api';

const ThemeContext = createContext();

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentThemeName, setCurrentThemeName] = useState('blue');
  const [currentTheme, setCurrentTheme] = useState(themeVariants.blue || defaultTheme);

  // 加载保存的主题（仅从本地存储，不依赖服务器）
  useEffect(() => {
    loadThemeFromLocal();
  }, []);

  // 当主题名称改变时，更新主题对象
  useEffect(() => {
    const theme = themeVariants[currentThemeName] || defaultTheme;
    setCurrentTheme(theme);
  }, [currentThemeName]);

  // 从本地存储加载主题（用于未登录状态或首次启动）
  const loadThemeFromLocal = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme && themeVariants[savedTheme]) {
        setCurrentThemeName(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme from local:', error);
    }
  };

  // 从服务器加载用户主题（登录后调用）
  const loadThemeFromServer = async (userTheme) => {
    try {
      if (userTheme && themeVariants[userTheme]) {
        setCurrentThemeName(userTheme);
        await AsyncStorage.setItem('appTheme', userTheme);
      }
    } catch (error) {
      console.error('Error loading theme from server:', error);
    }
  };

  // 设置主题（同时保存到本地和服务器）
  const setTheme = async (themeName, saveToServer = true) => {
    try {
      if (themeVariants[themeName]) {
        setCurrentThemeName(themeName);
        await AsyncStorage.setItem('appTheme', themeName);
        
        // 如果 saveToServer 为 true，尝试保存到服务器
        if (saveToServer) {
          try {
            await usersAPI.updateTheme(themeName);
            console.log('✅ Theme saved to server:', themeName);
          } catch (serverError) {
            console.warn('⚠️ Failed to save theme to server:', serverError.message);
            // 即使服务器保存失败，本地主题仍然更新成功
          }
        }
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // 创建完整的主题对象（包含所有 ChildrenTheme 的其他属性）
  const fullTheme = useMemo(() => ({
    ...ChildrenTheme,
    colors: {
      ...ChildrenTheme.colors,
      ...currentTheme.colors,
    },
  }), [currentTheme]);

  const value = useMemo(() => ({
    currentThemeName,
    currentTheme: fullTheme,
    setTheme,
    loadThemeFromServer,
    themeVariants,
  }), [currentThemeName, fullTheme, themeVariants]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

