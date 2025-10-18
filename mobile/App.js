import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import WordsListScreen from './src/screens/WordsListScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import CameraScreen from './src/screens/CameraScreen';
import ArticleScreen from './src/screens/ArticleScreen';
import ProfileScreen from './src/screens/ProfileScreen';

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
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
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
        {!isAuthenticated ? (
          <>
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
          </>
        ) : (
          <>
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
              name="AddWord" 
              component={AddWordScreen}
              options={{ title: 'Add Word' }}
            />
            <Stack.Screen 
              name="Camera" 
              component={CameraScreen}
              options={{ title: 'Scan Text' }}
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

