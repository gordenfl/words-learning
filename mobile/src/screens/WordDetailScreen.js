import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import { wordsAPI } from '../services/api';

export default function WordDetailScreen({ route, navigation }) {
  const { wordId } = route.params;
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [generatingDetails, setGeneratingDetails] = useState(false);
  const [generatingCompounds, setGeneratingCompounds] = useState(false);
  const [generatingExamples, setGeneratingExamples] = useState(false);
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);

  useEffect(() => {
    loadWordDetail();
  }, []);

  const loadWordDetail = async () => {
    try {
      // 获取单词列表，找到对应的单词
      const response = await wordsAPI.getAll();
      const foundWord = response.data.words.find(w => w._id === wordId);
      setWord(foundWord);
      
      // 检查是否需要自动生成组词和例句（只在完全没有数据时才生成）
      const hasCompounds = foundWord.compounds && foundWord.compounds.length > 0;
      const hasExamples = foundWord.examples && foundWord.examples.length > 0;
      
      if (!hasCompounds || !hasExamples) {
        // 自动生成（只在缺失数据时）
        setTimeout(() => {
          generateDetails(false); // false = 不强制更新
        }, 500); // 延迟500ms开始生成，让界面先显示出来
      }
    } catch (error) {
      console.log('Error loading word:', error);
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

  const generateDetails = async (force = false, updateType = 'both') => {
    // 设置对应的加载状态
    if (updateType === 'compounds') {
      setGeneratingCompounds(true);
    } else if (updateType === 'examples') {
      setGeneratingExamples(true);
    } else {
      setGeneratingDetails(true);
    }

    try {
      const response = await wordsAPI.generateDetails(wordId, force, updateType);
      setWord(response.data.word);
      // 成功后显示提示
      if (force) {
        const message = updateType === 'compounds' ? '✅ Compounds updated' :
                        updateType === 'examples' ? '✅ Examples updated' :
                        '✅ Updated successfully';
        showToastMessage(message);
      } else {
        // 自动生成时不显示提示，直接更新界面
      }
    } catch (error) {
      console.log('Error generating details:', error);
      const errorMessage = force ? '❌ Failed to update' : '❌ Failed to generate';
      showToastMessage(errorMessage);
    } finally {
      if (updateType === 'compounds') {
        setGeneratingCompounds(false);
      } else if (updateType === 'examples') {
        setGeneratingExamples(false);
      } else {
        setGeneratingDetails(false);
      }
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
          <TouchableOpacity 
            onPress={() => setShowStrokeOrder(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.wordText}>{word.word}</Text>
          </TouchableOpacity>
          {word.translation && (
            <Text style={styles.translation}>{word.translation}</Text>
          )}
          <Text style={styles.tapHint}>Tap 🔊 to hear • Tap 字 to see strokes</Text>
        </View>

        {/* 组词模块 - 独立卡片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📚 Word Compounds</Text>
            {(word.compounds && word.compounds.length > 0) && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => generateDetails(true, 'compounds')}
                disabled={generatingCompounds}
              >
                <Text style={styles.updateButtonText}>
                  {generatingCompounds ? '⏳' : 'Update'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {(generatingDetails || generatingCompounds) && (!word.compounds || word.compounds.length === 0) ? (
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💬 Example Sentences</Text>
            {(word.examples && word.examples.length > 0) && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={() => generateDetails(true, 'examples')}
                disabled={generatingExamples}
              >
                <Text style={styles.updateButtonText}>
                  {generatingExamples ? '⏳' : 'Update'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {(generatingDetails || generatingExamples) && (!word.examples || word.examples.length === 0) ? (
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
          <Text style={styles.statusActionsTitle}>Update Status</Text>
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

      {/* 笔顺动画 Modal */}
      <Modal
        visible={showStrokeOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStrokeOrder(false)}
      >
        <View style={styles.strokeModalOverlay}>
          <View style={styles.strokeModalContent}>
            <View style={styles.strokeModalHeader}>
              <Text style={styles.strokeModalTitle}>Stroke Order • 笔顺</Text>
              <TouchableOpacity 
                onPress={() => setShowStrokeOrder(false)}
                style={styles.strokeModalClose}
              >
                <Text style={styles.strokeModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.strokeWebViewContainer}>
              <WebView
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                      <style>
                        * {
                          -webkit-tap-highlight-color: transparent;
                          -webkit-touch-callout: none;
                          -webkit-user-select: none;
                          user-select: none;
                        }
                        body {
                          margin: 0;
                          padding: 20px;
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          min-height: 100vh;
                          background: #fff;
                          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                          overflow-x: hidden;
                        }
                        #character-target {
                          margin: 20px auto;
                          display: block;
                        }
                        .controls {
                          display: flex;
                          gap: 12px;
                          margin-top: 25px;
                          flex-wrap: wrap;
                          justify-content: center;
                          width: 100%;
                          padding: 0 20px;
                          box-sizing: border-box;
                        }
                        button {
                          padding: 14px 28px;
                          font-size: 17px;
                          border: none;
                          border-radius: 10px;
                          background: #4A90E2;
                          color: white;
                          font-weight: 600;
                          cursor: pointer;
                          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
                          transition: all 0.2s;
                          flex: 1;
                          min-width: 140px;
                          max-width: 200px;
                        }
                        button:active {
                          transform: scale(0.96);
                          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                        button:hover {
                          background: #3A7BC8;
                        }
                        .info {
                          text-align: center;
                          color: #666;
                          margin-top: 18px;
                          font-size: 15px;
                          padding: 0 20px;
                        }
                        #status {
                          color: #4A90E2;
                          font-size: 14px;
                          margin-top: 10px;
                          min-height: 20px;
                        }
                      </style>
                    </head>
                    <body>
                      <svg id="character-target" width="280" height="280"></svg>
                      <div class="controls">
                        <button id="animateBtn" ontouchstart="handleAnimate(event)" onclick="handleAnimate(event)">▶️ Animate</button>
                        <button id="practiceBtn" ontouchstart="handlePractice(event)" onclick="handlePractice(event)">✏️ Practice</button>
                      </div>
                      <div class="info">Tap buttons to animate or practice</div>
                      <div id="status"></div>
                      
                      <script>
                        let writer = null;
                        let isAnimating = false;
                        let scriptLoaded = false;
                        
                        function setStatus(msg) {
                          const statusEl = document.getElementById('status');
                          if (statusEl) {
                            statusEl.textContent = msg;
                          }
                        }
                        
                        let loopCount = 0;
                        let maxLoops = 3; // 循环 3 次
                        let quizActive = false;
                        let animationTimer = null; // 保存 setTimeout 的 ID
                        
                        function handleAnimate(event) {
                          if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                          }
                          setStatus('Animate button clicked!');
                          animate();
                        }
                        
                        function handlePractice(event) {
                          if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                          }
                          setStatus('Practice button clicked!');
                          practice();
                        }
                        
                        function animate() {
                          setStatus('Animate: checking states...');
                          
                          if (!writer) {
                            setStatus('Writer not ready');
                            return;
                          }
                          
                          // 如果正在播放动画，忽略点击（无效）
                          if (isAnimating) {
                            setStatus('Animation already running');
                            return;
                          }
                          
                          // 如果正在练习模式，先取消并清空
                          if (quizActive) {
                            setStatus('Cancelling quiz...');
                            try {
                              writer.cancelQuiz();
                              quizActive = false;
                              setStatus('Switching to animation...');
                            } catch (e) {
                              setStatus('Cancel quiz error: ' + e.message);
                              quizActive = false;
                            }
                            
                            // 延迟一下再开始动画，确保练习模式完全清空
                            setTimeout(() => {
                              setStatus('Starting animation after quiz...');
                              if (!quizActive && !isAnimating) {
                                startAnimation();
                              } else {
                                setStatus('Cannot start: quiz=' + quizActive + ', anim=' + isAnimating);
                              }
                            }, 200);
                            return;
                          }
                          
                          // 直接开始动画
                          setStatus('Starting animation directly...');
                          startAnimation();
                        }
                        
                        function startAnimation() {
                          // 重置循环计数并开始动画
                          loopCount = 0;
                          isAnimating = true;
                          animateLoop();
                        }
                        
                        function stopAnimation() {
                          // 停止动画循环
                          isAnimating = false;
                          loopCount = 0;
                          if (animationTimer) {
                            clearTimeout(animationTimer);
                            animationTimer = null;
                          }
                        }
                        
                        function animateLoop() {
                          // 检查是否应该继续
                          if (!isAnimating) {
                            return;
                          }
                          
                          if (loopCount >= maxLoops) {
                            isAnimating = false;
                            loopCount = 0;
                            setStatus('Animation complete!');
                            setTimeout(() => setStatus('Tap Animate to replay'), 2000);
                            return;
                          }
                          
                          setStatus('Playing animation... (Loop ' + (loopCount + 1) + '/' + maxLoops + ')');
                          
                          writer.animateCharacter({
                            onComplete: function() {
                              // 再次检查是否应该继续
                              if (!isAnimating) {
                                return;
                              }
                              
                              loopCount++;
                              if (loopCount < maxLoops) {
                                animationTimer = setTimeout(animateLoop, 800);
                              } else {
                                isAnimating = false;
                                loopCount = 0;
                                setStatus('Animation complete!');
                                setTimeout(() => setStatus('Tap Animate to replay'), 2000);
                              }
                            }
                          });
                        }
                        
                        function practice() {
                          if (!writer) {
                            setStatus('Writer not ready');
                            return;
                          }
                          
                          // 如果正在动画中，完全停止动画
                          if (isAnimating) {
                            stopAnimation();
                            setStatus('Stopping animation...');
                            // 延迟后启动练习模式
                            setTimeout(() => {
                              startPractice();
                            }, 150);
                            return;
                          }
                          
                          // 如果已经在练习模式，清空内容并重新开始
                          if (quizActive) {
                            writer.cancelQuiz();
                            // 延迟一下再重启，确保清空完成
                            setTimeout(() => {
                              startPractice();
                            }, 100);
                            return;
                          }
                          
                          // 启动练习模式
                          startPractice();
                        }
                        
                        function startPractice() {
                          quizActive = true;
                          setStatus('Starting practice mode...');
                          
                          writer.quiz({
                            onMistake: function(strokeData) {
                              setStatus('Try again! ❌');
                            },
                            onCorrectStroke: function(strokeData) {
                              setStatus('Good! ✓ Stroke ' + (strokeData.strokeNum + 1));
                            },
                            onComplete: function() {
                              quizActive = false;
                              setStatus('Perfect! 完成！🎉');
                              setTimeout(() => setStatus('Tap Practice to try again'), 3000);
                            }
                          });
                        }
                        
                        function initWriter() {
                          try {
                            setStatus('Initializing...');
                            
                            if (typeof HanziWriter === 'undefined') {
                              setStatus('Loading library...');
                              setTimeout(initWriter, 500);
                              return;
                            }
                            
                            writer = HanziWriter.create('character-target', '${word.word}', {
                              width: 280,
                              height: 280,
                              padding: 15,
                              showOutline: true,
                              strokeAnimationSpeed: 0.5, // 减慢速度（原来 1.2，越小越慢）
                              delayBetweenStrokes: 600,   // 增加笔画间隔（原来 200ms，现在 600ms）
                              delayBetweenLoops: 1000,    // 循环之间的延迟
                              strokeColor: '#333',
                              radicalColor: '#4A90E2',
                              outlineColor: '#DDD',
                              drawingColor: '#4A90E2',
                              drawingWidth: 6,
                              showCharacter: true
                            });
                            
                            setStatus('Ready!');
                            
                            // 自动播放一次
                            setTimeout(() => {
                              if (writer) {
                                animate();
                              }
                            }, 500);
                          } catch (error) {
                            setStatus('Error: ' + error.message);
                            console.log('Init error:', error);
                          }
                        }
                        
                        // 加载 HanziWriter 库（尝试多个 CDN 源）
                        (function() {
                          setStatus('Loading HanziWriter...');
                          
                          const cdnSources = [
                            'https://unpkg.com/hanzi-writer@3.5.0/dist/hanzi-writer.min.js',
                            'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5.0/dist/hanzi-writer.min.js',
                            'https://unpkg.com/hanzi-writer@latest/dist/hanzi-writer.min.js',
                            'https://cdn.jsdelivr.net/npm/hanzi-writer@latest/dist/hanzi-writer.min.js'
                          ];
                          
                          let currentIndex = 0;
                          
                          function tryLoadScript() {
                            if (currentIndex >= cdnSources.length) {
                              setStatus('All CDN sources failed. Network issue?');
                              return;
                            }
                            
                            const source = cdnSources[currentIndex];
                            setStatus('Trying CDN ' + (currentIndex + 1) + '...');
                            
                            const script = document.createElement('script');
                            script.src = source;
                            script.timeout = 5000;
                            
                            const timeout = setTimeout(() => {
                              setStatus('Timeout, trying next...');
                              script.remove();
                              currentIndex++;
                              tryLoadScript();
                            }, 5000);
                            
                            script.onload = function() {
                              clearTimeout(timeout);
                              scriptLoaded = true;
                              setStatus('Library loaded from CDN ' + (currentIndex + 1) + '!');
                              setTimeout(initWriter, 200);
                            };
                            
                            script.onerror = function() {
                              clearTimeout(timeout);
                              setStatus('CDN ' + (currentIndex + 1) + ' failed, trying next...');
                              currentIndex++;
                              setTimeout(tryLoadScript, 500);
                            };
                            
                            document.head.appendChild(script);
                          }
                          
                          tryLoadScript();
                        })();
                      </script>
                    </body>
                    </html>
                  `
                }}
                style={styles.strokeWebView}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={false}
                scrollEnabled={false}
                bounces={false}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                mixedContentMode="always"
                renderLoading={() => (
                  <View style={styles.strokeLoadingContainer}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={styles.strokeLoadingText}>Loading stroke order...</Text>
                  </View>
                )}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('WebView error: ', nativeEvent);
                }}
              />
            </View>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
  statusActionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
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
  strokeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  strokeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  strokeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  strokeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  strokeModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  strokeModalCloseText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  strokeWebViewContainer: {
    height: 550,
    width: '100%',
  },
  strokeWebView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  strokeLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  strokeLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4A90E2',
  },
});

