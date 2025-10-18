import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { wordsAPI } from '../services/api';

export default function WordsListScreen({ navigation }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWords();
  }, [filter]);

  const loadWords = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const response = await wordsAPI.getWords(status);
      setWords(response.data.words);
    } catch (error) {
      console.error('Error loading words:', error);
      Alert.alert('Oops!', 'Could not load your words. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateWordStatus = async (wordId, newStatus) => {
    try {
      await wordsAPI.updateWordStatus(wordId, newStatus);
      loadWords();
    } catch (error) {
      Alert.alert('Oops!', 'Could not update the word status. Please try again.');
    }
  };

  const deleteWord = async (wordId) => {
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
              await wordsAPI.deleteWord(wordId);
              loadWords();
            } catch (error) {
              Alert.alert('Oops!', 'Could not delete the word. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderWord = ({ item }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <View style={styles.wordInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          {item.pinyin && (
            <Text style={styles.pinyin}>{item.pinyin}</Text>
          )}
          {item.translation && (
            <Text style={styles.translation}>{item.translation}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      {item.definition && (
        <Text style={styles.definition}>{item.definition}</Text>
      )}

      <View style={styles.actions}>
        {item.status !== 'known' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.knownBtn]}
            onPress={() => updateWordStatus(item._id, 'known')}
          >
            <Text style={styles.actionBtnText}>✓ Known</Text>
          </TouchableOpacity>
        )}
        {item.status !== 'learning' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.learningBtn]}
            onPress={() => updateWordStatus(item._id, 'learning')}
          >
            <Text style={styles.actionBtnText}>📖 Learning</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => deleteWord(item._id)}
        >
          <Text style={styles.actionBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'unknown' && styles.filterBtnActive]}
          onPress={() => setFilter('unknown')}
        >
          <Text style={[styles.filterText, filter === 'unknown' && styles.filterTextActive]}>
            Unknown
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'learning' && styles.filterBtnActive]}
          onPress={() => setFilter('learning')}
        >
          <Text style={[styles.filterText, filter === 'learning' && styles.filterTextActive]}>
            Learning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'known' && styles.filterBtnActive]}
          onPress={() => setFilter('known')}
        >
          <Text style={[styles.filterText, filter === 'known' && styles.filterTextActive]}>
            Known
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4A90E2" style={styles.loader} />
      ) : (
        <FlatList
          data={words}
          renderItem={renderWord}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
  },
  filterBtn: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    color: '#666',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: 50,
  },
  list: {
    padding: 15,
  },
  wordCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  wordInfo: {
    flex: 1,
    marginRight: 10,
  },
  wordText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  pinyin: {
    fontSize: 14,
    color: '#4A90E2',
    marginTop: 2,
    fontStyle: 'italic',
  },
  translation: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  status_unknown: {
    backgroundColor: '#FFE4E1',
  },
  status_learning: {
    backgroundColor: '#FFF4E0',
  },
  status_known: {
    backgroundColor: '#E0F8E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  definition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginRight: 8,
  },
  knownBtn: {
    backgroundColor: '#50C878',
  },
  learningBtn: {
    backgroundColor: '#FFD700',
  },
  deleteBtn: {
    backgroundColor: '#FF6347',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

