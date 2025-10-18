import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wordsAPI, articlesAPI, usersAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload data when screen comes into focus
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      const [statsResponse, planResponse] = await Promise.all([
        wordsAPI.getStats(),
        usersAPI.getLearningPlan().catch(() => ({ data: { learningPlan: null } }))
      ]);
      
      setStats(statsResponse.data);
      setLearningPlan(planResponse.data.learningPlan);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            navigation.navigate('Login');
          },
        },
      ]
    );
  };

  const handleGenerateArticle = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.generateArticle(10);
      Alert.alert('Success', 'Article generated!', [
        { text: 'Read Now', onPress: () => navigation.navigate('Article', { article: response.data.article }) }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.username}!</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Learning Plan Info */}
      {learningPlan && (
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>📚 Chinese Learning Plan</Text>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Level:</Text>
            <Text style={styles.planValue}>
              {learningPlan.difficulty === 'beginner' && '初级 Beginner'}
              {learningPlan.difficulty === 'intermediate' && '中级 Intermediate'}
              {learningPlan.difficulty === 'advanced' && '高级 Advanced'}
            </Text>
          </View>
          <View style={styles.planRow}>
            <Text style={styles.planLabel}>Daily Goal:</Text>
            <Text style={styles.planValue}>{learningPlan.dailyWordGoal} words/day</Text>
          </View>
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.total || 0}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
          {learningPlan && (
            <Text style={styles.statGoal}>
              Goal: {learningPlan.monthlyWordGoal}/month
            </Text>
          )}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.known || 0}</Text>
          <Text style={styles.statLabel}>Known</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.unknown || 0}</Text>
          <Text style={styles.statLabel}>To Learn</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.todayLearned || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
          {learningPlan && (
            <Text style={styles.statGoal}>
              Goal: {learningPlan.dailyWordGoal}/day
            </Text>
          )}
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.highlightButton]}
          onPress={() => navigation.navigate('QuickImport')}
        >
          <Text style={styles.actionButtonText}>⚡ Quick Import Sample Words</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.actionButtonText}>📸 Scan Book</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('AddWord')}
        >
          <Text style={styles.actionButtonText}>➕ Add Word</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('WordsList')}
        >
          <Text style={styles.actionButtonText}>📚 My Words</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleGenerateArticle}
        >
          <Text style={styles.actionButtonText}>📝 Generate Article</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('LearningPlan')}
        >
          <Text style={styles.actionButtonText}>🎯 Learning Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#4A90E2',
    fontSize: 16,
  },
  planInfo: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    color: '#666',
  },
  planValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    margin: '1%',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statGoal: {
    fontSize: 11,
    color: '#4A90E2',
    marginTop: 5,
    fontStyle: 'italic',
  },
  actionsContainer: {
    padding: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#50C878',
  },
  highlightButton: {
    backgroundColor: '#FF6B6B',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

