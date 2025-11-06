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
      console.log('Failed to mark article as read:', error);
      // 即使失败也返回首页
      navigation.navigate('Home');
    }
  };

  // 高亮显示目标单词的函数
  const highlightTargetWords = (content, targetWords) => {
    // 提取所有目标单词（按长度从长到短排序，优先匹配长词）
    const wordTexts = targetWords.map(tw => tw.word?.word || tw.wordText).filter(Boolean);
    
    if (wordTexts.length === 0) {
      return <Text style={styles.articleText}>{content}</Text>;
    }

    // 按长度从长到短排序，优先匹配长词（避免短词覆盖长词的一部分）
    const sortedWords = [...wordTexts].sort((a, b) => b.length - a.length);

    // 使用正则表达式匹配所有目标单词
    const parts = [];
    let lastIndex = 0;
    
    // 创建正则表达式，匹配所有目标单词（使用|分隔）
    const escapedWords = sortedWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'g');
    
    // 找到所有匹配的位置
    const matches = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        word: match[0]
      });
    }
    
    // 按位置排序
    matches.sort((a, b) => a.index - b.index);
    
    // 处理重叠的匹配（取第一个匹配，跳过重叠的部分）
    const nonOverlappingMatches = [];
    let lastMatchEnd = 0;
    
    for (const match of matches) {
      if (match.index >= lastMatchEnd) {
        nonOverlappingMatches.push(match);
        lastMatchEnd = match.index + match.length;
      }
    }
    
    // 构建文本片段
    for (const match of nonOverlappingMatches) {
      // 添加匹配前的普通文本
      if (match.index > lastIndex) {
        parts.push({
          text: content.substring(lastIndex, match.index),
          isTarget: false
        });
      }
      
      // 添加高亮的目标单词
      parts.push({
        text: match.word,
        isTarget: true
      });
      
      lastIndex = match.index + match.length;
    }
    
    // 添加剩余的文本
    if (lastIndex < content.length) {
      parts.push({
        text: content.substring(lastIndex),
        isTarget: false
      });
    }

    // 如果没有匹配到任何单词，返回原始文本
    if (parts.length === 0) {
      return <Text style={styles.articleText}>{content}</Text>;
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

    // 提取所有目标单词的文本
    const targetWordTexts = targetWords.map(tw => tw.word?.word || tw.wordText).filter(Boolean);
    
    // 只显示在文章内容中实际出现的单词
    const wordsInContent = targetWords.filter(tw => {
      const wordText = tw.word?.word || tw.wordText;
      return wordText && content.includes(wordText);
    });

    return (
      <View>
        {highlightTargetWords(content, targetWords)}
        
        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>Target Words:</Text>
          {wordsInContent.map((tw, index) => {
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

