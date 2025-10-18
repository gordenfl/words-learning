import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wordsAPI, articlesAPI, usersAPI } from '../services/api';

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingArticle, setGeneratingArticle] = useState(false);
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
        wordsAPI.getStats().catch(err => {
          console.error('Stats error:', err);
          // 如果是401错误，需要重新登录
          if (err.response?.status === 401) {
            Alert.alert(
              'Session Expired',
              'Please login again',
              [{ text: 'OK', onPress: () => {
                AsyncStorage.clear();
                navigation.replace('Login');
              }}]
            );
            throw err;
          }
          return { data: { total: 0, known: 0, unknown: 0, learning: 0, todayLearned: 0 } };
        }),
        usersAPI.getLearningPlan().catch(err => {
          console.error('Learning plan error:', err);
          // 401错误会被上面的stats捕获
          return { 
            data: { 
              learningPlan: {
                dailyWordGoal: 10,
                weeklyWordGoal: 50,
                monthlyWordGoal: 200,
                difficulty: 'intermediate',
                preferredStudyTime: []
              }
            } 
          };
        })
      ]);
      
      setStats(statsResponse.data);
      setLearningPlan(planResponse.data.learningPlan);
    } catch (error) {
      console.error('Error loading data:', error);
      // 401错误已经处理，其他错误使用默认值
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArticle = async () => {
    try {
      setGeneratingArticle(true);
      const response = await articlesAPI.generateArticle(10);
      
      // 检查是否需要更多单词
      if (response.data.needMoreWords) {
        setGeneratingArticle(false);
        Alert.alert(
          response.data.message || 'Great job! 🎉',
          response.data.suggestion || 'Add more words to continue learning.',
          [
            { text: 'Add Words', onPress: () => navigation.navigate('AddWord') },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        // 直接进入文章页面
        setGeneratingArticle(false);
        navigation.navigate('Article', { article: response.data.article });
      }
    } catch (error) {
      setGeneratingArticle(false);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to generate article';
      Alert.alert('Oops!', errorMsg);
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
        <TouchableOpacity 
          onPress={() => navigation.navigate('Profile')} 
          style={styles.avatarButton}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
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
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('WordsList', { filter: 'all' })}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats?.total || 0}</Text>
          <Text style={styles.statLabel}>Total Words</Text>
          {learningPlan && (
            <Text style={styles.statGoal}>
              Goal: {learningPlan.monthlyWordGoal}/month
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('WordsList', { filter: 'known' })}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats?.known || 0}</Text>
          <Text style={styles.statLabel}>Known</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('WordsList', { filter: 'unknown' })}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats?.unknown || 0}</Text>
          <Text style={styles.statLabel}>To Learn</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => navigation.navigate('WordsList', { filter: 'learning' })}
          activeOpacity={0.7}
        >
          <Text style={styles.statNumber}>{stats?.todayLearned || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
          {learningPlan && (
            <Text style={styles.statGoal}>
              Goal: {learningPlan.dailyWordGoal}/day
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.actionsContainer}>
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
          style={[
            styles.actionButton, 
            styles.primaryButton,
            generatingArticle && styles.disabledButton
          ]}
          onPress={handleGenerateArticle}
          disabled={generatingArticle}
        >
          <Text style={styles.actionButtonText}>📝 Generate Article</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('LearningPlan')}
        >
          <Text style={styles.actionButtonText}>🎯 Learning Plan</Text>
        </TouchableOpacity>
      </View>

      {/* 生成文章时的加载overlay */}
      <Modal
        transparent={true}
        visible={generatingArticle}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.modalTitle}>Generating Article...</Text>
            <Text style={styles.modalSubtitle}>
              AI is creating your personalized Chinese story
            </Text>
          </View>
        </View>
      </Modal>
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
  avatarButton: {
    padding: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
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
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

