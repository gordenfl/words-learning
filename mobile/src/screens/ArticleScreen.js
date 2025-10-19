import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Speech from 'expo-speech';
import { articlesAPI, wordsAPI } from '../services/api';

export default function ArticleScreen({ route, navigation }) {
  const [article, setArticle] = useState(route.params?.article);
  const [completedWords, setCompletedWords] = useState(new Set());
  const [isReading, setIsReading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const speakWord = (word) => {
    Speech.speak(word, {
      language: 'zh-CN',
      pitch: 1.0,
      rate: 0.1,
    });
  };

  const speakArticle = () => {
    if (isReading) {
      // 如果正在朗读，停止朗读
      Speech.stop();
      setIsReading(false);
    } else {
      // 开始朗读文章
      setIsReading(true);
      
      // 提取文章中的中文内容（去掉英文标题和鼓励语）
      const lines = article.content.split('\n');
      const chineseLines = lines.filter(line => {
        // 过滤掉英文行（标题和鼓励语）
        return line.trim() && /[\u4e00-\u9fa5]/.test(line);
      });
      const chineseContent = chineseLines.join(' '); // 用空格连接段落
      
      Speech.speak(chineseContent, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.3, // 比单词稍快一点
        onDone: () => setIsReading(false),
        onStopped: () => setIsReading(false),
        onError: () => setIsReading(false),
      });
    }
  };

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const markWordAsKnown = async (wordId, wordText) => {
    try {
      await wordsAPI.updateWordStatus(wordId, 'known');
      setCompletedWords(prev => new Set([...prev, wordId]));
      showToastMessage(`✓ Learned "${wordText}"`);
    } catch (error) {
      showToastMessage('❌ Update failed');
    }
  };

  const markArticleAsRead = async () => {
    try {
      await articlesAPI.markAsRead(article._id);
      navigation.navigate('Home');
    } catch (error) {
      console.error('Failed to mark article as read:', error);
      // 即使失败也返回首页
      navigation.navigate('Home');
    }
  };

  // 高亮显示目标单词的函数
  const highlightTargetWords = (content, targetWords) => {
    // 提取所有目标单词
    const wordTexts = targetWords.map(tw => tw.word?.word || tw.wordText);
    
    if (wordTexts.length === 0) {
      return <Text style={styles.articleText}>{content}</Text>;
    }

    // 将所有目标单词用正则匹配并分割文本
    const parts = [];
    let lastIndex = 0;
    
    // 为每个字符检查是否是目标单词
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      
      // 检查当前字符是否是目标单词
      if (wordTexts.includes(char)) {
        // 添加之前的普通文本
        if (i > lastIndex) {
          parts.push({
            text: content.substring(lastIndex, i),
            isTarget: false
          });
        }
        
        // 添加高亮的目标单词
        parts.push({
          text: char,
          isTarget: true
        });
        
        lastIndex = i + 1;
      }
    }
    
    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push({
        text: content.substring(lastIndex),
        isTarget: false
      });
    }

    return (
      <Text style={styles.articleText}>
        {parts.map((part, index) => (
          part.isTarget ? (
            <Text key={index} style={styles.highlightedWord}>
              {part.text}
            </Text>
          ) : (
            <Text key={index}>{part.text}</Text>
          )
        ))}
      </Text>
    );
  };

  const renderContent = () => {
    let content = article.content;
    const targetWords = article.targetWords || [];

    return (
      <View>
        {highlightTargetWords(content, targetWords)}
        
        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>Target Words:</Text>
          {targetWords.map((tw, index) => {
            const wordId = tw.word?._id || tw.word;
            const wordText = tw.word?.word || tw.wordText;
            const wordPinyin = tw.word?.pinyin || '';
            const isCompleted = completedWords.has(wordId);

            return (
              <View key={index} style={styles.wordCard}>
                <View style={styles.wordCardContent}>
                  <View style={styles.wordInfoArea}>
                    {wordPinyin && (
                      <View style={styles.pinyinWithSpeaker}>
                        <Text style={styles.pinyin}>{wordPinyin}</Text>
                        <TouchableOpacity 
                          onPress={() => speakWord(wordText)}
                          activeOpacity={0.6}
                          style={styles.speakerButton}
                        >
                          <Text style={styles.speakerIcon}>🔊</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <Text style={styles.wordText}>{wordText}</Text>
                  </View>
                  
                  <View style={styles.wordActions}>
                    {!isCompleted ? (
                      <TouchableOpacity
                        style={styles.markKnownBtn}
                        onPress={() => markWordAsKnown(wordId, wordText)}
                      >
                        <Text style={styles.markKnownText}>✓</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!article) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No article available</Text>
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
        {/* 标题和朗读按钮 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{article.title}</Text>
          <TouchableOpacity
            onPress={speakArticle}
            style={styles.readAloudBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.readAloudIcon}>
              {isReading ? '⏸' : '🔊'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Difficulty: {article.difficulty}
          </Text>
          <Text style={styles.metaText}>
            Words: {article.targetWords?.length || 0}
          </Text>
        </View>

        {renderContent()}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={markArticleAsRead}
        >
          <Text style={styles.completeButtonText}>
            Complete Article
          </Text>
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
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  readAloudBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  readAloudIcon: {
    fontSize: 24,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  articleText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 30,
  },
  highlightedWord: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  wordsSection: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wordCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordInfoArea: {
    flex: 1,
    marginRight: 15,
  },
  pinyinWithSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pinyin: {
    fontSize: 20,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  speakerButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  speakerIcon: {
    fontSize: 20,
  },
  wordText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markKnownBtn: {
    backgroundColor: '#50C878',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markKnownText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E0F8E0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: '#50C878',
    fontSize: 20,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#50C878',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
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

