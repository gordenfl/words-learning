import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import WordsListScreen from './src/screens/WordsListScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LearningPlanScreen from './src/screens/LearningPlanScreen';
import WordDetailScreen from './src/screens/WordDetailScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Create Account' }}
        />
        
        {/* Main App Screens */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Words Learning' }}
        />
        <Stack.Screen 
          name="WordsList" 
          component={WordsListScreen}
          options={{ title: 'My Words' }}
        />
        <Stack.Screen 
          name="Article" 
          component={ArticleScreen}
          options={{ title: 'Read Article' }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
        />
        <Stack.Screen 
          name="LearningPlan" 
          component={LearningPlanScreen}
          options={{ title: 'Learning Plan' }}
        />
        <Stack.Screen 
          name="WordDetail" 
          component={WordDetailScreen}
          options={{ title: 'Word Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
