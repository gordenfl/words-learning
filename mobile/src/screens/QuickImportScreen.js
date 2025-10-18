import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { wordsAPI } from '../services/api';

const SAMPLE_WORDS = {
  beginner: [
    { word: '你好', pinyin: 'nǐ hǎo', translation: 'hello' },
    { word: '谢谢', pinyin: 'xièxie', translation: 'thank you' },
    { word: '再见', pinyin: 'zàijiàn', translation: 'goodbye' },
    { word: '是', pinyin: 'shì', translation: 'yes, is' },
    { word: '不', pinyin: 'bù', translation: 'no, not' },
    { word: '我', pinyin: 'wǒ', translation: 'I, me' },
    { word: '你', pinyin: 'nǐ', translation: 'you' },
    { word: '好', pinyin: 'hǎo', translation: 'good' },
    { word: '很', pinyin: 'hěn', translation: 'very' },
    { word: '的', pinyin: 'de', translation: 'of, particle' },
  ],
  intermediate: [
    { word: '学习', pinyin: 'xuéxí', translation: 'study, learn' },
    { word: '中文', pinyin: 'zhōngwén', translation: 'Chinese language' },
    { word: '朋友', pinyin: 'péngyou', translation: 'friend' },
    { word: '工作', pinyin: 'gōngzuò', translation: 'work, job' },
    { word: '生活', pinyin: 'shēnghuó', translation: 'life' },
    { word: '快乐', pinyin: 'kuàilè', translation: 'happy' },
    { word: '美丽', pinyin: 'měilì', translation: 'beautiful' },
    { word: '时间', pinyin: 'shíjiān', translation: 'time' },
    { word: '地方', pinyin: 'dìfang', translation: 'place' },
    { word: '东西', pinyin: 'dōngxi', translation: 'thing' },
  ],
  advanced: [
    { word: '教育', pinyin: 'jiàoyù', translation: 'education' },
    { word: '文化', pinyin: 'wénhuà', translation: 'culture' },
    { word: '哲学', pinyin: 'zhéxué', translation: 'philosophy' },
    { word: '经济', pinyin: 'jīngjì', translation: 'economy' },
    { word: '政治', pinyin: 'zhèngzhì', translation: 'politics' },
    { word: '社会', pinyin: 'shèhuì', translation: 'society' },
    { word: '历史', pinyin: 'lìshǐ', translation: 'history' },
    { word: '科学', pinyin: 'kēxué', translation: 'science' },
    { word: '技术', pinyin: 'jìshù', translation: 'technology' },
    { word: '发展', pinyin: 'fāzhǎn', translation: 'development' },
  ],
};

export default function QuickImportScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [imported, setImported] = useState({
    beginner: false,
    intermediate: false,
    advanced: false,
  });

  const importWords = async (level) => {
    setLoading(true);
    try {
      const words = SAMPLE_WORDS[level].map(w => w.word);
      const response = await wordsAPI.addWords(words);
      
      setImported({ ...imported, [level]: true });
      
      Alert.alert(
        'Success!',
        `Added ${response.data.added.length} new Chinese words!\n${response.data.skipped.length} words already existed.`,
        [
          {
            text: 'View Words',
            onPress: () => navigation.navigate('WordsList'),
          },
          { text: 'Continue', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to import words');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Quick Import Chinese Words</Text>
        <Text style={styles.description}>
          Import sample Chinese vocabulary to get started quickly. Each set contains 10 common words.
        </Text>

        {/* Beginner Words */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>📖</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Beginner Level (初级)</Text>
              <Text style={styles.levelDesc}>
                Basic greetings and common words
              </Text>
            </View>
          </View>

          <View style={styles.wordPreview}>
            {SAMPLE_WORDS.beginner.slice(0, 5).map((w, i) => (
              <View key={i} style={styles.previewItem}>
                <Text style={styles.previewWord}>{w.word}</Text>
                <Text style={styles.previewPinyin}>{w.pinyin}</Text>
                <Text style={styles.previewTranslation}>{w.translation}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>...and 5 more</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.importButton,
              imported.beginner && styles.importedButton
            ]}
            onPress={() => importWords('beginner')}
            disabled={loading || imported.beginner}
          >
            <Text style={styles.importButtonText}>
              {imported.beginner ? '✓ Imported' : 'Import Beginner Words'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Intermediate Words */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>📚</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Intermediate Level (中级)</Text>
              <Text style={styles.levelDesc}>
                Everyday vocabulary and expressions
              </Text>
            </View>
          </View>

          <View style={styles.wordPreview}>
            {SAMPLE_WORDS.intermediate.slice(0, 5).map((w, i) => (
              <View key={i} style={styles.previewItem}>
                <Text style={styles.previewWord}>{w.word}</Text>
                <Text style={styles.previewPinyin}>{w.pinyin}</Text>
                <Text style={styles.previewTranslation}>{w.translation}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>...and 5 more</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.importButton,
              imported.intermediate && styles.importedButton
            ]}
            onPress={() => importWords('intermediate')}
            disabled={loading || imported.intermediate}
          >
            <Text style={styles.importButtonText}>
              {imported.intermediate ? '✓ Imported' : 'Import Intermediate Words'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Advanced Words */}
        <View style={styles.levelSection}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelIcon}>🎓</Text>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Advanced Level (高级)</Text>
              <Text style={styles.levelDesc}>
                Complex vocabulary for advanced learners
              </Text>
            </View>
          </View>

          <View style={styles.wordPreview}>
            {SAMPLE_WORDS.advanced.slice(0, 5).map((w, i) => (
              <View key={i} style={styles.previewItem}>
                <Text style={styles.previewWord}>{w.word}</Text>
                <Text style={styles.previewPinyin}>{w.pinyin}</Text>
                <Text style={styles.previewTranslation}>{w.translation}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>...and 5 more</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.importButton,
              imported.advanced && styles.importedButton
            ]}
            onPress={() => importWords('advanced')}
            disabled={loading || imported.advanced}
          >
            <Text style={styles.importButtonText}>
              {imported.advanced ? '✓ Imported' : 'Import Advanced Words'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Importing words...</Text>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    lineHeight: 20,
  },
  levelSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: 13,
    color: '#666',
  },
  wordPreview: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  previewWord: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 60,
  },
  previewPinyin: {
    fontSize: 13,
    color: '#4A90E2',
    fontStyle: 'italic',
    width: 80,
  },
  previewTranslation: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  importButton: {
    backgroundColor: '#4A90E2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  importedButton: {
    backgroundColor: '#50C878',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
});

