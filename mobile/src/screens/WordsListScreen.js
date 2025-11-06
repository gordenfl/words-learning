import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import * as Speech from 'expo-speech';
import { wordsAPI } from '../services/api';

export default function WordsListScreen({ navigation, route }) {
  const initialFilter = route.params?.filter || 'all';
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [removingWordIds, setRemovingWordIds] = useState(new Set());
  const PAGE_SIZE = 50;
  
  // 为每个单词存储动画值
  const fadeAnims = useRef({});

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

  useEffect(() => {
    // 监听从详情页返回的更新
    const unsubscribe = navigation.addListener('focus', () => {
      // 检查是否有单词更新（通过 route params 传递）
      if (route.params?.wordUpdated) {
        const { wordId, newStatus, deleted } = route.params.wordUpdated;
        
        if (deleted) {
          // 标记为正在移除
          setRemovingWordIds(prev => new Set([...prev, wordId]));
          
          // 初始化动画值（如果不存在）
          if (!fadeAnims.current[wordId]) {
            fadeAnims.current[wordId] = new Animated.Value(1);
          }
          
          // 淡出动画
          Animated.timing(fadeAnims.current[wordId], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setWords(prevWords => prevWords.filter(word => word._id !== wordId));
            setRemovingWordIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(wordId);
              return newSet;
            });
            delete fadeAnims.current[wordId];
          });
        } else if (newStatus) {
          // 检查新状态是否符合当前过滤条件
          const shouldRemove = 
            (filter === 'unknown' && newStatus !== 'unknown') ||
            (filter === 'known' && newStatus !== 'known');
          
          if (shouldRemove) {
            // 标记为正在移除
            setRemovingWordIds(prev => new Set([...prev, wordId]));
            
            // 初始化动画值（如果不存在）
            if (!fadeAnims.current[wordId]) {
              fadeAnims.current[wordId] = new Animated.Value(1);
            }
            
            // 淡出动画
            Animated.timing(fadeAnims.current[wordId], {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setWords(prevWords => prevWords.filter(word => word._id !== wordId));
              setRemovingWordIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(wordId);
                return newSet;
              });
              delete fadeAnims.current[wordId];
            });
          } else {
            // 如果符合过滤条件，更新状态
            setWords(prevWords => 
              prevWords.map(word => 
                word._id === wordId ? { ...word, status: newStatus } : word
              )
            );
          }
        }
        
        // 清除参数
        navigation.setParams({ wordUpdated: undefined });
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.wordUpdated, filter]);

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
      console.log('Error loading words:', error);
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

  const speakWord = (word) => {
    Speech.speak(word, {
      language: 'zh-CN', // 中文（普通话）
      pitch: 1.0,
      rate: 0.1, // 极慢速播放，便于初学者
    });
  };

  const updateWordStatus = async (wordId, newStatus) => {
    try {
      await wordsAPI.updateWordStatus(wordId, newStatus);
      
      // 检查新状态是否符合当前过滤条件
      const shouldRemove = 
        (filter === 'unknown' && newStatus !== 'unknown') ||
        (filter === 'known' && newStatus !== 'known');
      
      if (shouldRemove) {
        // 标记为正在移除
        setRemovingWordIds(prev => new Set([...prev, wordId]));
        
        // 初始化动画值（如果不存在）
        if (!fadeAnims.current[wordId]) {
          fadeAnims.current[wordId] = new Animated.Value(1);
        }
        
        // 淡出动画
        Animated.timing(fadeAnims.current[wordId], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // 动画结束后从列表中移除
          setWords(prevWords => prevWords.filter(word => word._id !== wordId));
          setRemovingWordIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(wordId);
            return newSet;
          });
          delete fadeAnims.current[wordId];
        });
      } else {
        // 如果符合过滤条件，更新状态
        setWords(prevWords => 
          prevWords.map(word => 
            word._id === wordId ? { ...word, status: newStatus } : word
          )
        );
      }
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
              
              // 标记为正在移除
              setRemovingWordIds(prev => new Set([...prev, wordId]));
              
              // 初始化动画值（如果不存在）
              if (!fadeAnims.current[wordId]) {
                fadeAnims.current[wordId] = new Animated.Value(1);
              }
              
              // 淡出动画
              Animated.timing(fadeAnims.current[wordId], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start(() => {
                // 动画结束后从列表中移除
                setWords(prevWords => prevWords.filter(word => word._id !== wordId));
                setRemovingWordIds(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(wordId);
                  return newSet;
                });
                delete fadeAnims.current[wordId];
              });
            } catch (error) {
              Alert.alert('Oops!', 'Could not delete the word. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderWord = ({ item }) => {
    // 初始化动画值
    if (!fadeAnims.current[item._id]) {
      fadeAnims.current[item._id] = new Animated.Value(1);
    }
    
    const isRemoving = removingWordIds.has(item._id);
    
    return (
      <Animated.View style={{ opacity: fadeAnims.current[item._id] }}>
        <TouchableOpacity 
          style={styles.wordCard}
          onPress={() => navigation.navigate('WordDetail', { wordId: item._id })}
          activeOpacity={0.9}
          disabled={isRemoving}
        >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.wordInfo}>
          {item.pinyin && (
            <View style={styles.pinyinWithSpeaker}>
              <Text style={styles.pinyin}>{item.pinyin}</Text>
              <TouchableOpacity 
                onPress={() => speakWord(item.word)}
                activeOpacity={0.6}
                style={styles.speakerButton}
              >
                <Text style={styles.speakerIcon}>🔊</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.wordText}>{item.word}</Text>
          
          {item.translation && (
            <Text style={styles.translation}>{item.translation}</Text>
          )}
          {item.definition && (
            <Text style={styles.definition}>{item.definition}</Text>
          )}
        </View>

        <View style={styles.actions}>
          {item.status === 'unknown' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.knownBtn]}
              onPress={(e) => {
                updateWordStatus(item._id, 'known');
              }}
            >
              <Text style={styles.actionBtnText}>✓</Text>
            </TouchableOpacity>
          )}
          {item.status === 'known' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.unknownBtn, styles.learnAgainBtn]}
              onPress={(e) => {
                updateWordStatus(item._id, 'unknown');
              }}
            >
              <Text style={styles.learnAgainBtnText}>Learn Again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={(e) => {
              deleteWord(item._id);
            }}
          >
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

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
  unknownBtn: {
    backgroundColor: '#FFA500',
  },
  learnAgainBtn: {
    width: undefined,
    minWidth: 100,
    paddingHorizontal: 12,
  },
  deleteBtn: {
    backgroundColor: '#FF6347',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  learnAgainBtnText: {
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

