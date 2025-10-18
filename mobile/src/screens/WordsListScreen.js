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

export default function WordsListScreen({ navigation, route }) {
  const initialFilter = route.params?.filter || 'all';
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    // 监听路由参数变化
    if (route.params?.filter && route.params.filter !== filter) {
      setFilter(route.params.filter);
    }
  }, [route.params?.filter]);

  useEffect(() => {
    // 重置分页并重新加载
    setWords([]);
    setPage(1);
    setHasMore(true);
    loadWords(1, true);
  }, [filter]);

  const loadWords = async (pageNum = page, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;
    
    try {
      if (isRefresh) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const status = filter === 'all' ? undefined : filter;
      const response = await wordsAPI.getWords(status);
      const allWords = response.data.words;
      
      // 按创建时间倒序排列（最新的在前）
      const sortedWords = allWords.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // 分页：获取指定页的数据
      const start = (pageNum - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      const pageWords = sortedWords.slice(start, end);
      
      if (isRefresh) {
        setWords(pageWords);
      } else {
        setWords(prev => [...prev, ...pageWords]);
      }
      
      setHasMore(end < sortedWords.length);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading words:', error);
      if (isRefresh) {
        Alert.alert('Oops!', 'Could not load your words. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  const loadMoreWords = () => {
    if (!loadingMore && hasMore) {
      loadWords(page + 1, false);
    }
  };

  const updateWordStatus = async (wordId, newStatus) => {
    try {
      await wordsAPI.updateWordStatus(wordId, newStatus);
      
      // 本地更新状态，不重新加载列表（保持滚动位置）
      setWords(prevWords => 
        prevWords.map(word => 
          word._id === wordId ? { ...word, status: newStatus } : word
        )
      );
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
              
              // 本地删除单词，不重新加载列表（保持滚动位置）
              setWords(prevWords => prevWords.filter(word => word._id !== wordId));
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
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <TouchableOpacity 
          style={styles.wordInfo}
          onPress={() => navigation.navigate('WordDetail', { wordId: item._id })}
          activeOpacity={0.7}
        >
          {item.pinyin && (
            <Text style={styles.pinyin}>{item.pinyin}</Text>
          )}
          <Text style={styles.wordText}>{item.word}</Text>
          {item.translation && (
            <Text style={styles.translation}>{item.translation}</Text>
          )}
          {item.definition && (
            <Text style={styles.definition}>{item.definition}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          {item.status !== 'known' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.knownBtn]}
              onPress={() => updateWordStatus(item._id, 'known')}
            >
              <Text style={styles.actionBtnText}>✓</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'learning' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.learningBtn]}
              onPress={() => updateWordStatus(item._id, 'learning')}
            >
              <Text style={styles.actionBtnText}>📖</Text>
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
          onEndReached={loadMoreWords}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => 
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#4A90E2" />
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : hasMore ? null : (
              words.length > 0 && (
                <Text style={styles.footerText}>All words loaded</Text>
              )
            )
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          windowSize={10}
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
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordInfo: {
    flex: 1,
    marginRight: 15,
  },
  wordText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  pinyin: {
    fontSize: 20,
    color: '#4A90E2',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  translation: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    alignSelf: 'flex-start',
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
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  definition: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 6,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  footerLoader: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
    color: '#999',
  },
});

