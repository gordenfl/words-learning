import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Speech from 'expo-speech';
import { wordsAPI } from '../services/api';

export default function WordDetailScreen({ route, navigation }) {
  const { wordId } = route.params;
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWordDetail();
  }, []);

  const loadWordDetail = async () => {
    try {
      // 获取单词列表，找到对应的单词
      const response = await wordsAPI.getAll();
      const foundWord = response.data.words.find(w => w._id === wordId);
      setWord(foundWord);
    } catch (error) {
      console.error('Error loading word:', error);
      Alert.alert('Error', 'Could not load word details');
    } finally {
      setLoading(false);
    }
  };

  const speakWord = (text) => {
    Speech.speak(text, {
      language: 'zh-CN', // 中文（普通话）
      pitch: 1.0,
      rate: 0.1, // 极慢速播放，便于初学者
    });
  };

  const updateWordStatus = async (status) => {
    try {
      await wordsAPI.updateStatus(wordId, status);
      const updatedWord = { ...word, status };
      setWord(updatedWord);
      Alert.alert('Success', `Word marked as ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Could not update word status');
    }
  };

  const deleteWord = async () => {
    Alert.alert(
      'Delete Word',
      'Are you sure you want to delete this word?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await wordsAPI.delete(wordId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Could not delete word');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  if (!word) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Word not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* 状态标签 */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles[`status_${word.status}`]]}>
            <Text style={styles.statusText}>{word.status}</Text>
          </View>
        </View>

        {/* 主要内容 */}
        <View style={styles.mainContent}>
          {word.pinyin && (
            <View style={styles.pinyinWithSpeaker}>
              <Text style={styles.pinyin}>{word.pinyin}</Text>
              <TouchableOpacity 
                onPress={() => speakWord(word.word)}
                activeOpacity={0.6}
                style={styles.speakerButton}
              >
                <Text style={styles.speakerIcon}>🔊</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.wordText}>{word.word}</Text>
          {word.translation && (
            <Text style={styles.translation}>{word.translation}</Text>
          )}
          <Text style={styles.tapHint}>Tap 🔊 to hear pronunciation</Text>
        </View>

        {/* 定义 */}
        {word.definition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Definition</Text>
            <Text style={styles.definition}>{word.definition}</Text>
          </View>
        )}

        {/* 例句 */}
        {word.examples && word.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Examples</Text>
            {word.examples.map((example, index) => (
              <View key={index} style={styles.exampleItem}>
                <Text style={styles.exampleBullet}>•</Text>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 状态更新按钮 */}
        <View style={styles.statusActions}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                word.status === 'unknown' && styles.statusBtnActive,
              ]}
              onPress={() => updateWordStatus('unknown')}
            >
              <Text style={[
                styles.statusBtnText,
                word.status === 'unknown' && styles.statusBtnTextActive,
              ]}>📖 Learning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                word.status === 'known' && styles.statusBtnActive,
              ]}
              onPress={() => updateWordStatus('known')}
            >
              <Text style={[
                styles.statusBtnText,
                word.status === 'known' && styles.statusBtnTextActive,
              ]}>✓ Known</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 删除按钮 */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteWord}
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete Word</Text>
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
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    padding: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  status_unknown: {
    backgroundColor: '#FFE4E1',
  },
  status_known: {
    backgroundColor: '#E0F8E0',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  mainContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinyinWithSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pinyin: {
    fontSize: 32,
    color: '#4A90E2',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  speakerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  speakerIcon: {
    fontSize: 28,
  },
  wordText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  translation: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  definition: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  exampleItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  exampleBullet: {
    fontSize: 16,
    color: '#4A90E2',
    marginRight: 8,
  },
  exampleText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  statusActions: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  statusBtnActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  statusBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

