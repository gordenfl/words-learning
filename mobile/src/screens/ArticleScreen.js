import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { articlesAPI, wordsAPI } from '../services/api';

export default function ArticleScreen({ route, navigation }) {
  const [article, setArticle] = useState(route.params?.article);
  const [completedWords, setCompletedWords] = useState(new Set());

  const markWordAsKnown = async (wordId, wordText) => {
    try {
      await wordsAPI.updateWordStatus(wordId, 'known');
      setCompletedWords(prev => new Set([...prev, wordId]));
      Alert.alert('Great!', `You've learned "${wordText}"!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update word status');
    }
  };

  const markArticleAsRead = async () => {
    try {
      await articlesAPI.markAsRead(article._id);
      Alert.alert(
        'Article Completed!',
        'Great job! Keep learning more words.',
        [
          {
            text: 'Back to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to mark article as read');
    }
  };

  const renderContent = () => {
    let content = article.content;
    const targetWords = article.targetWords || [];

    return (
      <View>
        <Text style={styles.articleText}>{content}</Text>
        
        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>Target Words:</Text>
          {targetWords.map((tw, index) => {
            const wordId = tw.word?._id || tw.word;
            const wordText = tw.word?.word || tw.wordText;
            const isCompleted = completedWords.has(wordId);

            return (
              <View key={index} style={styles.wordItem}>
                <Text style={styles.wordItemText}>{wordText}</Text>
                {!isCompleted ? (
                  <TouchableOpacity
                    style={styles.markKnownBtn}
                    onPress={() => markWordAsKnown(wordId, wordText)}
                  >
                    <Text style={styles.markKnownText}>Mark as Known</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓ Known</Text>
                  </View>
                )}
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
      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  wordsSection: {
    backgroundColor: '#fff',
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
  wordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  wordItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  markKnownBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  markKnownText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: '#E0F8E0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  completedText: {
    color: '#50C878',
    fontSize: 14,
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
});

