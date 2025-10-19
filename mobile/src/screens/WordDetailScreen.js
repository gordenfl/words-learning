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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generatingDetails, setGeneratingDetails] = useState(false);

  useEffect(() => {
    loadWordDetail();
  }, []);

  const loadWordDetail = async () => {
    try {
      // 获取单词列表，找到对应的单词
      const response = await wordsAPI.getAll();
      const foundWord = response.data.words.find(w => w._id === wordId);
      setWord(foundWord);
      
      // 检查是否需要自动生成组词和例句
      if ((!foundWord.compounds || foundWord.compounds.length === 0) ||
          (!foundWord.examples || foundWord.examples.length === 0)) {
        // 自动生成
        setTimeout(() => {
          generateDetails();
        }, 500); // 延迟500ms开始生成，让界面先显示出来
      }
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

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const updateWordStatus = async (status) => {
    try {
      await wordsAPI.updateStatus(wordId, status);
      const updatedWord = { ...word, status };
      setWord(updatedWord);
      
      // 通知列表页面更新（不刷新整个列表，只更新这个单词）
      const routes = navigation.getState().routes;
      const wordsListRoute = routes.find(r => r.name === 'WordsList');
      if (wordsListRoute) {
        navigation.navigate('WordsList', {
          ...wordsListRoute.params,
          wordUpdated: { wordId, newStatus: status }
        });
      }
      
      const statusLabel = status === 'known' ? '✓ Marked as Known' : '📖 Marked as Learning';
      showToastMessage(statusLabel);
    } catch (error) {
      showToastMessage('❌ Update failed');
    }
  };

  const generateDetails = async () => {
    setGeneratingDetails(true);
    try {
      const response = await wordsAPI.generateDetails(wordId);
      setWord(response.data.word);
      // 成功后不显示提示，直接更新界面
    } catch (error) {
      console.error('Error generating details:', error);
      showToastMessage('❌ Failed to generate');
    } finally {
      setGeneratingDetails(false);
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
              
              // 通知列表页面删除这个单词
              const routes = navigation.getState().routes;
              const wordsListRoute = routes.find(r => r.name === 'WordsList');
              if (wordsListRoute) {
                navigation.navigate('WordsList', {
                  ...wordsListRoute.params,
                  wordUpdated: { wordId, deleted: true }
                });
              } else {
                navigation.goBack();
              }
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
      {/* Toast 提示 */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        {/* 状态标签 */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, styles[`status_${word.status}`]]}>
            <Text style={styles.statusText}>{word.status}</Text>
          </View>
        </View>

        {/* 主要内容 - 只显示大字 */}
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

        {/* 组词模块 - 独立卡片 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Word Compounds</Text>
          {generatingDetails && (!word.compounds || word.compounds.length === 0) ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator color="#4A90E2" size="small" />
              <Text style={styles.generatingText}>Generating compounds...</Text>
            </View>
          ) : word.compounds && word.compounds.length > 0 ? (
            <>
              {word.compounds.map((compound, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.compoundItemInline}
                  onPress={() => speakWord(compound.word)}
                  activeOpacity={0.6}
                >
                  <View style={styles.compoundLeftInline}>
                    <Text style={styles.compoundWordInline}>{compound.word}</Text>
                    {compound.pinyin && (
                      <Text style={styles.compoundPinyinInline}>{compound.pinyin}</Text>
                    )}
                  </View>
                  {compound.meaning && (
                    <Text style={styles.compoundMeaningInline}>{compound.meaning}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <Text style={styles.emptyText}>No compounds yet</Text>
          )}
        </View>

        {/* 例句模块 - 独立卡片 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Example Sentences</Text>
          {generatingDetails && (!word.examples || word.examples.length === 0) ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator color="#4A90E2" size="small" />
              <Text style={styles.generatingText}>Generating examples...</Text>
            </View>
          ) : word.examples && word.examples.length > 0 ? (
            <>
              {word.examples.map((example, index) => {
                // 兼容旧格式（字符串）和新格式（对象）
                const sentenceText = typeof example === 'string' ? example : example.chinese;
                
                return (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.exampleItemInline}
                    onPress={() => speakWord(sentenceText)}
                    activeOpacity={0.6}
                  >
                    {typeof example === 'string' ? (
                      <Text style={styles.exampleText}>{example}</Text>
                    ) : (
                      <>
                        <Text style={styles.exampleChineseInline}>{example.chinese}</Text>
                        {example.pinyin && (
                          <Text style={styles.examplePinyinInline}>{example.pinyin}</Text>
                        )}
                        {example.english && (
                          <Text style={styles.exampleEnglishInline}>{example.english}</Text>
                        )}
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </>
          ) : (
            <Text style={styles.emptyText}>No examples yet</Text>
          )}
        </View>

        {/* 定义 */}
        {word.definition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Definition</Text>
            <Text style={styles.definition}>{word.definition}</Text>
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
    marginBottom: 20,
    alignItems: 'center',
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
    alignSelf: 'center',
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
    alignSelf: 'center',
  },
  translation: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    alignSelf: 'center',
  },
  tapHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  generatingText: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  compoundItemInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  compoundLeftInline: {
    flex: 1,
    marginRight: 10,
  },
  compoundWordInline: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  compoundPinyinInline: {
    fontSize: 13,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  compoundMeaningInline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    maxWidth: '40%',
  },
  exampleItemInline: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  exampleChineseInline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    lineHeight: 24,
    marginBottom: 4,
  },
  examplePinyinInline: {
    fontSize: 13,
    color: '#4A90E2',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 4,
  },
  exampleEnglishInline: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
  compoundItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compoundLeft: {
    flex: 1,
  },
  compoundWord: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  compoundPinyin: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  compoundMeaning: {
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    flex: 1,
    textAlign: 'right',
  },
  exampleItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exampleContent: {
    flex: 1,
  },
  exampleChinese: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    lineHeight: 26,
    marginBottom: 6,
  },
  examplePinyin: {
    fontSize: 14,
    color: '#4A90E2',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  exampleEnglish: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
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
  generateButton: {
    backgroundColor: '#50C878',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#50C878',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

