import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  useTheme,
  Surface,
  Snackbar,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import * as Speech from "expo-speech";
import { wordsAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";

export default function WordDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { wordId } = route.params;
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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
      const foundWord = response.data.words.find((w) => w._id === wordId);
      setWord(foundWord);

      // 检查是否需要自动生成组词和例句（只在完全没有数据时才生成）
      const hasCompounds =
        foundWord.compounds && foundWord.compounds.length > 0;
      const hasExamples = foundWord.examples && foundWord.examples.length > 0;

      if (!hasCompounds || !hasExamples) {
        // 自动生成（只在缺失数据时）
        setTimeout(() => {
          generateDetails(false); // false = 不强制更新
        }, 500); // 延迟500ms开始生成，让界面先显示出来
      }
    } catch (error) {
      console.log("Error loading word:", error);
      Alert.alert("Error", "Could not load word details");
    } finally {
      setLoading(false);
    }
  };

  const speakWord = (text) => {
    Speech.speak(text, {
      language: "zh-CN", // 中文（普通话）
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
      const wordsListRoute = routes.find((r) => r.name === "WordsList");
      if (wordsListRoute) {
        navigation.navigate("WordsList", {
          ...wordsListRoute.params,
          wordUpdated: { wordId, newStatus: status },
        });
      }

      const statusLabel =
        status === "known" ? "✓ Marked as Known" : "📖 Marked as Learning";
      showToastMessage(statusLabel);
    } catch (error) {
      showToastMessage("❌ Update failed");
    }
  };

  const generateDetails = async (force = false, updateType = "both") => {
    // 设置对应的加载状态
    if (updateType === "compounds") {
      setGeneratingCompounds(true);
    } else if (updateType === "examples") {
      setGeneratingExamples(true);
    } else {
      setGeneratingDetails(true);
    }

    try {
      const response = await wordsAPI.generateDetails(
        wordId,
        force,
        updateType
      );
      setWord(response.data.word);
      // 成功后显示提示
      if (force) {
        const message =
          updateType === "compounds"
            ? "✅ Compounds updated"
            : updateType === "examples"
            ? "✅ Examples updated"
            : "✅ Updated successfully";
        showToastMessage(message);
      } else {
        // 自动生成时不显示提示，直接更新界面
      }
    } catch (error) {
      console.log("Error generating details:", error);
      const errorMessage = force
        ? "❌ Failed to update"
        : "❌ Failed to generate";
      showToastMessage(errorMessage);
    } finally {
      if (updateType === "compounds") {
        setGeneratingCompounds(false);
      } else if (updateType === "examples") {
        setGeneratingExamples(false);
      } else {
        setGeneratingDetails(false);
      }
    }
  };

  const deleteWord = async () => {
    Alert.alert("Delete Word", "Are you sure you want to delete this word?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await wordsAPI.delete(wordId);

            // 通知列表页面删除这个单词
            const routes = navigation.getState().routes;
            const wordsListRoute = routes.find((r) => r.name === "WordsList");
            if (wordsListRoute) {
              navigation.navigate("WordsList", {
                ...wordsListRoute.params,
                wordUpdated: { wordId, deleted: true },
              });
            } else {
              navigation.goBack();
            }
          } catch (error) {
            Alert.alert("Error", "Could not delete word");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loaderText}>
          Loading word...
        </Text>
      </View>
    );
  }

  if (!word) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="titleLarge" style={styles.errorText}>
          Word not found
        </Text>
      </View>
    );
  }

  const statusColor =
    word.status === "known"
      ? ChildrenTheme.colors.success
      : word.status === "learning"
      ? ChildrenTheme.colors.warning
      : ChildrenTheme.colors.error;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Snackbar
        visible={showToast}
        onDismiss={() => setShowToast(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {toastMessage}
      </Snackbar>

      <View style={styles.content}>
        {/* 状态标签 */}
        <View style={styles.statusContainer}>
          <Chip
            icon={
              word.status === "known" ? "check-circle" : "book-open-variant"
            }
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  word.status === "known"
                    ? ChildrenTheme.colors.success + "20"
                    : word.status === "learning"
                    ? ChildrenTheme.colors.warning + "20"
                    : ChildrenTheme.colors.error + "20",
              },
            ]}
            textStyle={[styles.statusChipText, { color: statusColor }]}
          >
            {word.status === "known"
              ? "Mastered"
              : word.status === "learning"
              ? "Learning"
              : "To Learn"}
          </Chip>
        </View>

        {/* 主要内容 */}
        <Card style={styles.mainCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.mainContent}>
            {word.pinyin && (
              <View style={styles.pinyinWithSpeaker}>
                <Text
                  variant="titleLarge"
                  style={[styles.pinyin, { color: theme.colors.primary }]}
                >
                  {word.pinyin}
                </Text>
                <IconButton
                  icon="volume-high"
                  size={24}
                  iconColor={theme.colors.primary}
                  onPress={() => speakWord(word.word)}
                  style={styles.speakerButton}
                />
              </View>
            )}
            <IconButton
              icon="gesture-tap"
              size={20}
              iconColor={ChildrenTheme.colors.textLight}
              onPress={() => setShowStrokeOrder(true)}
              style={styles.strokeHintButton}
            />
            <Text style={styles.wordText}>{word.word}</Text>
            {word.translation && (
              <Text variant="titleMedium" style={styles.translation}>
                {word.translation}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.tapHint}>
              Tap 🔊 to hear • Tap 字 to see strokes
            </Text>
          </Card.Content>
        </Card>

        {/* 组词模块 */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                📚 Word Compounds
              </Text>
              {word.compounds && word.compounds.length > 0 && (
                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={theme.colors.primary}
                  onPress={() => generateDetails(true, "compounds")}
                  disabled={generatingCompounds}
                />
              )}
            </View>
            {(generatingDetails || generatingCompounds) &&
            (!word.compounds || word.compounds.length === 0) ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text variant="bodySmall" style={styles.generatingText}>
                  Generating compounds...
                </Text>
              </View>
            ) : word.compounds && word.compounds.length > 0 ? (
              <>
                {word.compounds.map((compound, index) => (
                  <Surface
                    key={index}
                    style={styles.compoundItem}
                    elevation={0}
                    onTouchEnd={() => speakWord(compound.word)}
                  >
                    <View style={styles.compoundLeft}>
                      <Text variant="titleMedium" style={styles.compoundWord}>
                        {compound.word}
                      </Text>
                      {compound.pinyin && (
                        <Text variant="bodySmall" style={styles.compoundPinyin}>
                          {compound.pinyin}
                        </Text>
                      )}
                    </View>
                    {compound.meaning && (
                      <Text variant="bodyMedium" style={styles.compoundMeaning}>
                        {compound.meaning}
                      </Text>
                    )}
                  </Surface>
                ))}
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No compounds yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* 例句模块 */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                💬 Example Sentences
              </Text>
              {word.examples && word.examples.length > 0 && (
                <IconButton
                  icon="refresh"
                  size={20}
                  iconColor={theme.colors.primary}
                  onPress={() => generateDetails(true, "examples")}
                  disabled={generatingExamples}
                />
              )}
            </View>
            {(generatingDetails || generatingExamples) &&
            (!word.examples || word.examples.length === 0) ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
                <Text variant="bodySmall" style={styles.generatingText}>
                  Generating examples...
                </Text>
              </View>
            ) : word.examples && word.examples.length > 0 ? (
              <>
                {word.examples.map((example, index) => {
                  const sentenceText =
                    typeof example === "string" ? example : example.chinese;

                  return (
                    <Surface
                      key={index}
                      style={styles.exampleItem}
                      elevation={0}
                      onTouchEnd={() => speakWord(sentenceText)}
                    >
                      {typeof example === "string" ? (
                        <Text variant="bodyLarge" style={styles.exampleText}>
                          {example}
                        </Text>
                      ) : (
                        <>
                          <Text
                            variant="bodyLarge"
                            style={styles.exampleChinese}
                          >
                            {example.chinese}
                          </Text>
                          {example.pinyin && (
                            <Text
                              variant="bodySmall"
                              style={styles.examplePinyin}
                            >
                              {example.pinyin}
                            </Text>
                          )}
                          {example.english && (
                            <Text
                              variant="bodyMedium"
                              style={styles.exampleEnglish}
                            >
                              {example.english}
                            </Text>
                          )}
                        </>
                      )}
                    </Surface>
                  );
                })}
              </>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No examples yet
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* 定义 */}
        {word.definition && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Definition
              </Text>
              <Text variant="bodyLarge" style={styles.definition}>
                {word.definition}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* 状态更新按钮 */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.statusActionsTitle}>
              Update Status
            </Text>
            <View style={styles.statusButtons}>
              <Button
                mode={word.status === "unknown" ? "contained" : "outlined"}
                onPress={() => updateWordStatus("unknown")}
                style={styles.statusBtn}
                buttonColor={ChildrenTheme.colors.warning}
                textColor={
                  word.status === "unknown"
                    ? "#fff"
                    : ChildrenTheme.colors.warning
                }
                icon="book-open-variant"
              >
                Learning
              </Button>
              <Button
                mode={word.status === "known" ? "contained" : "outlined"}
                onPress={() => updateWordStatus("known")}
                style={styles.statusBtn}
                buttonColor={ChildrenTheme.colors.success}
                textColor={
                  word.status === "known"
                    ? "#fff"
                    : ChildrenTheme.colors.success
                }
                icon="check-circle"
              >
                Known
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 删除按钮 */}
        <Button
          mode="contained"
          onPress={deleteWord}
          style={styles.deleteButton}
          buttonColor={ChildrenTheme.colors.error}
          icon="delete"
        >
          Delete Word
        </Button>
      </View>

      {/* 笔顺动画 Modal */}
      <Modal
        visible={showStrokeOrder}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStrokeOrder(false)}
      >
        <View style={styles.strokeModalOverlay}>
          <Card style={styles.strokeModalContent} mode="elevated" elevation={8}>
            <Card.Content style={styles.strokeModalHeaderContent}>
              <View style={styles.strokeModalHeader}>
                <Text variant="headlineSmall" style={styles.strokeModalTitle}>
                  Stroke Order • 笔顺
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={ChildrenTheme.colors.text}
                  onPress={() => setShowStrokeOrder(false)}
                  style={styles.strokeModalClose}
                />
              </View>
            </Card.Content>

            <Card.Content style={styles.strokeWebViewContent}>
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
                          background: #F5F5F5;
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
                          border-radius: 20px;
                          background: #FF6B9D;
                          color: white;
                          font-weight: 600;
                          cursor: pointer;
                          box-shadow: 0 4px 8px rgba(255, 107, 157, 0.3);
                          transition: all 0.2s;
                          flex: 1;
                          min-width: 140px;
                          max-width: 200px;
                        }
                        button:active {
                          transform: scale(0.96);
                          box-shadow: 0 2px 4px rgba(255, 107, 157, 0.2);
                        }
                        button:hover {
                          background: #FF5A8A;
                        }
                        .info {
                          text-align: center;
                          color: #999;
                          margin-top: 18px;
                          font-size: 15px;
                          padding: 0 20px;
                        }
                        #status {
                          color: #FF6B9D;
                          font-size: 14px;
                          margin-top: 10px;
                          min-height: 20px;
                          font-weight: 500;
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
                  `,
                  }}
                  style={styles.strokeWebView}
                  originWhitelist={["*"]}
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
                      <ActivityIndicator
                        size="large"
                        color={theme.colors.primary}
                      />
                      <Text
                        variant="bodyMedium"
                        style={styles.strokeLoadingText}
                      >
                        Loading stroke order...
                      </Text>
                    </View>
                  )}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn("WebView error: ", nativeEvent);
                  }}
                />
              </View>
            </Card.Content>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loaderText: {
    color: ChildrenTheme.colors.textLight,
    marginTop: ChildrenTheme.spacing.md,
  },
  errorText: {
    color: ChildrenTheme.colors.textLight,
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: ChildrenTheme.spacing.md,
  },
  statusChip: {
    alignSelf: "flex-end",
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  mainContent: {
    padding: ChildrenTheme.spacing.lg,
    alignItems: "center",
  },
  pinyinWithSpeaker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  pinyin: {
    fontStyle: "italic",
    marginRight: ChildrenTheme.spacing.xs,
  },
  speakerButton: {
    margin: 0,
    padding: 0,
  },
  strokeHintButton: {
    margin: 0,
    padding: 0,
    position: "absolute",
    top: ChildrenTheme.spacing.sm,
    right: ChildrenTheme.spacing.sm,
  },
  wordText: {
    fontSize: 80,
    fontWeight: "bold",
    color: ChildrenTheme.colors.text,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.sm,
    lineHeight: 88,
  },
  translation: {
    color: ChildrenTheme.colors.text,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  tapHint: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
    marginTop: ChildrenTheme.spacing.xs,
  },
  generatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: ChildrenTheme.spacing.md,
    gap: ChildrenTheme.spacing.sm,
  },
  generatingText: {
    color: ChildrenTheme.colors.textLight,
    fontStyle: "italic",
  },
  emptyText: {
    color: ChildrenTheme.colors.textLight,
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  sectionTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  compoundItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.small,
    backgroundColor: ChildrenTheme.colors.background,
  },
  compoundLeft: {
    flex: 1,
    marginRight: ChildrenTheme.spacing.sm,
  },
  compoundWord: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: 2,
  },
  compoundPinyin: {
    color: ChildrenTheme.colors.primary,
    fontStyle: "italic",
  },
  compoundMeaning: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "right",
    maxWidth: "40%",
  },
  exampleItem: {
    paddingVertical: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.small,
    backgroundColor: ChildrenTheme.colors.background,
  },
  exampleChinese: {
    color: ChildrenTheme.colors.text,
    fontWeight: "500",
    marginBottom: 4,
  },
  examplePinyin: {
    color: ChildrenTheme.colors.primary,
    fontStyle: "italic",
    marginBottom: 4,
  },
  exampleEnglish: {
    color: ChildrenTheme.colors.textLight,
  },
  exampleText: {
    color: ChildrenTheme.colors.text,
  },
  definition: {
    color: ChildrenTheme.colors.text,
    lineHeight: 24,
    marginTop: ChildrenTheme.spacing.xs,
  },
  statusActionsTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.md,
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: ChildrenTheme.spacing.sm,
  },
  statusBtn: {
    flex: 1,
  },
  deleteButton: {
    marginBottom: ChildrenTheme.spacing.lg,
  },
  snackbar: {
    marginBottom: ChildrenTheme.spacing.xl,
  },
  strokeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.lg,
  },
  strokeModalContent: {
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    overflow: "hidden",
  },
  strokeModalHeaderContent: {
    padding: ChildrenTheme.spacing.md,
    paddingBottom: ChildrenTheme.spacing.sm,
  },
  strokeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  strokeModalTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  strokeModalClose: {
    margin: 0,
  },
  strokeWebViewContent: {
    padding: 0,
  },
  strokeWebViewContainer: {
    height: 550,
    width: "100%",
    backgroundColor: ChildrenTheme.colors.card,
  },
  strokeWebView: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.card,
  },
  strokeLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ChildrenTheme.colors.card,
  },
  strokeLoadingText: {
    marginTop: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.textLight,
  },
});
