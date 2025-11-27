import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  IconButton,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";
import { wordsAPI } from "../services/api";
import { Snackbar } from "react-native-paper";

// 生成10个练习汉字（都是同一个主字符，用于反复练习）
const generatePracticeCharacters = (mainCharacter, count = 10) => {
  // 所有练习字符都是同一个主字符
  return Array(count).fill(mainCharacter);
};

export default function WordWritingScreen({ route, navigation }) {
  const theme = useTheme();
  const { word } = route.params;
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  // 生成练习字符（都是同一个主字符）
  const [practiceChars] = useState(() =>
    generatePracticeCharacters(word.word, 10)
  );

  // 记录已完成的字符索引（红色实体）
  const [completedIndices, setCompletedIndices] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(true);

  // 当前正在练习的字符索引
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(null);
  const [showWritingModal, setShowWritingModal] = useState(false);

  // Toast 消息
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // 存储键，基于单词ID
  const progressStorageKey = `writingProgress_${word._id}`;

  // 加载保存的进度
  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const savedProgress = await AsyncStorage.getItem(progressStorageKey);
      if (savedProgress) {
        const indices = JSON.parse(savedProgress);
        // 确保索引在有效范围内
        const validIndices = indices.filter(
          (idx) => idx >= 0 && idx < practiceChars.length
        );
        setCompletedIndices(new Set(validIndices));
      }
    } catch (error) {
      console.error("Error loading writing progress:", error);
    } finally {
      setLoadingProgress(false);
    }
  };

  // 保存进度到本地存储
  const saveProgress = async (indices) => {
    try {
      const indicesArray = Array.from(indices);
      await AsyncStorage.setItem(
        progressStorageKey,
        JSON.stringify(indicesArray)
      );
    } catch (error) {
      console.error("Error saving writing progress:", error);
    }
  };

  // 清除进度（当所有练习完成且状态已更新为 known 时）
  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(progressStorageKey);
    } catch (error) {
      console.error("Error clearing writing progress:", error);
    }
  };

  const handleCharPress = (index) => {
    // 如果已经完成，不处理
    if (completedIndices.has(index)) {
      return;
    }

    // 打开书写练习界面
    setCurrentPracticeIndex(index);
    setShowWritingModal(true);
  };

  const handleWritingComplete = async () => {
    if (currentPracticeIndex !== null) {
      // 标记为已完成
      const newCompletedIndices = new Set([
        ...completedIndices,
        currentPracticeIndex,
      ]);
      setCompletedIndices(newCompletedIndices);

      // 保存进度到本地存储
      await saveProgress(newCompletedIndices);

      // 关闭书写界面
      setShowWritingModal(false);
      setCurrentPracticeIndex(null);

      // 检查是否完成了所有10个练习
      if (newCompletedIndices.size === practiceChars.length) {
        // 所有练习完成，更新单词状态为 "known"
        try {
          await wordsAPI.updateStatus(word._id, "known");

          // 清除本地进度（因为已经完成并更新状态）
          await clearProgress();

          // 通知 WordDetailScreen 更新状态（通过 navigation params）
          navigation.setParams({ wordStatusUpdated: true });

          // 显示恭喜确认框
          Alert.alert(
            "🎉 恭喜！Congratulations!",
            `你已经完成了 "${word.word}" 的所有书写练习！\n\nThe word has been marked as "Known".`,
            [
              {
                text: "确认 / OK",
                onPress: () => {
                  // 返回 Word Details 界面
                  navigation.goBack();
                },
              },
            ],
            { cancelable: false }
          );
        } catch (error) {
          console.error("Error updating word status:", error);
          Alert.alert(
            "错误 / Error",
            "更新单词状态失败 / Failed to update word status",
            [
              {
                text: "确认 / OK",
                onPress: () => {
                  // 即使更新失败，也返回 Word Details 界面
                  navigation.goBack();
                },
              },
            ]
          );
        }
      }
    }
  };

  const getCharStyle = (index) => {
    if (completedIndices.has(index)) {
      // 红色实体
      return {
        backgroundColor: ChildrenTheme.colors.error,
        color: "#FFFFFF",
        opacity: 1,
      };
    } else {
      // 灰色
      return {
        backgroundColor: ChildrenTheme.colors.background,
        color: ChildrenTheme.colors.textLight,
        opacity: 0.5,
      };
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        {...scrollHandlers}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
          {/* 主字符（黑色实体） */}
          <Card style={styles.mainCard} mode="elevated" elevation={2}>
            <Card.Content style={styles.mainContent}>
              <Text style={styles.mainCharacter}>{word.word}</Text>
              <Text variant="bodySmall" style={styles.mainHint}>
                Main Character
              </Text>
            </Card.Content>
          </Card>

          {/* 练习字符网格 */}
          <Card style={styles.practiceCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Practice Characters • 练习汉字
              </Text>
              <Text variant="bodySmall" style={styles.sectionHint}>
                Tap gray characters to practice writing
              </Text>

              <View style={styles.charGrid}>
                {practiceChars.map((char, index) => {
                  const charStyle = getCharStyle(index);
                  const isCompleted = completedIndices.has(index);

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.charButton,
                        {
                          backgroundColor: charStyle.backgroundColor,
                          opacity: charStyle.opacity,
                        },
                      ]}
                      onPress={createPressHandler(() => handleCharPress(index))}
                      disabled={isCompleted}
                    >
                      <Text
                        style={[styles.charText, { color: charStyle.color }]}
                      >
                        {char}
                      </Text>
                      {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text variant="bodySmall" style={styles.progressText}>
                Progress: {completedIndices.size} / {practiceChars.length}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* 书写练习 Modal */}
        <Modal
          visible={showWritingModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowWritingModal(false);
            setCurrentPracticeChar(null);
          }}
        >
          <View style={styles.writingModalOverlay}>
            <Card
              style={styles.writingModalContent}
              mode="elevated"
              elevation={8}
            >
              <Card.Content style={styles.writingModalHeaderContent}>
                <View style={styles.writingModalHeader}>
                  <Text
                    variant="headlineSmall"
                    style={styles.writingModalTitle}
                  >
                    Writing Practice • 书写练习
                  </Text>
                  <IconButton
                    icon="close"
                    size={24}
                    iconColor={ChildrenTheme.colors.text}
                    onPress={createPressHandler(() => {
                      setShowWritingModal(false);
                      setCurrentPracticeChar(null);
                    })}
                    style={styles.writingModalClose}
                  />
                </View>
                <Text variant="bodyMedium" style={styles.practiceCharTitle}>
                  Practice: {word.word}
                </Text>
              </Card.Content>

              <Card.Content style={styles.writingWebViewContent}>
                <View style={styles.writingWebViewContainer}>
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
                      <div class="info">Trace the character to practice writing</div>
                      <div id="status"></div>
                      
                      <script>
                        let writer = null;
                        let quizActive = false;
                        
                        function setStatus(msg) {
                          const statusEl = document.getElementById('status');
                          if (statusEl) {
                            statusEl.textContent = msg;
                          }
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
                              strokeAnimationSpeed: 0.5,
                              delayBetweenStrokes: 600,
                              strokeColor: '#333',
                              radicalColor: '#4A90E2',
                              outlineColor: '#DDD',
                              drawingColor: '#4A90E2',
                              drawingWidth: 6,
                              showCharacter: false  // 不显示字符，只显示轮廓
                            });
                            
                            setStatus('Ready! Start writing...');
                            
                            // 自动开始练习模式
                            setTimeout(() => {
                              if (writer) {
                                startPractice();
                              }
                            }, 500);
                          } catch (error) {
                            setStatus('Error: ' + error.message);
                            console.log('Init error:', error);
                          }
                        }
                        
                        function startPractice() {
                          quizActive = true;
                          setStatus('Practice mode active. Trace the character...');
                          
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
                              // 通知 React Native 完成
                              if (window.ReactNativeWebView) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'writingComplete'
                                }));
                              }
                            }
                          });
                        }
                        
                        // 加载 HanziWriter 库
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
                    style={styles.writingWebView}
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
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.type === "writingComplete") {
                          handleWritingComplete();
                        }
                      } catch (error) {
                        console.error("Error parsing message:", error);
                      }
                    }}
                    renderLoading={() => (
                      <View style={styles.writingLoadingContainer}>
                        <ActivityIndicator
                          size="large"
                          color={theme.colors.primary}
                        />
                        <Text
                          variant="bodyMedium"
                          style={styles.writingLoadingText}
                        >
                          Loading writing practice...
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

        {/* Toast 消息 */}
        <Snackbar
          visible={showToast}
          onDismiss={() => setShowToast(false)}
          duration={3000}
          style={styles.snackbar}
        >
          {toastMessage}
        </Snackbar>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  contentContainer: {
    padding: ChildrenTheme.spacing.md,
  },
  content: {
    flex: 1,
  },
  mainCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  mainContent: {
    padding: ChildrenTheme.spacing.lg,
    alignItems: "center",
  },
  mainCharacter: {
    fontSize: 100,
    fontWeight: "bold",
    color: ChildrenTheme.colors.text,
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  mainHint: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
  },
  practiceCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  sectionTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  sectionHint: {
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.md,
  },
  charGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.md,
  },
  charButton: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: ChildrenTheme.borderRadius.medium,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.border,
    position: "relative",
  },
  charText: {
    fontSize: 32,
    fontWeight: "bold",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    right: 4,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  progressText: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
    marginTop: ChildrenTheme.spacing.sm,
  },
  writingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.lg,
  },
  writingModalContent: {
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    width: "100%",
    maxWidth: 500,
    maxHeight: "85%",
    overflow: "hidden",
  },
  writingModalHeaderContent: {
    padding: ChildrenTheme.spacing.md,
    paddingBottom: ChildrenTheme.spacing.sm,
  },
  writingModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  writingModalTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  writingModalClose: {
    margin: 0,
  },
  practiceCharTitle: {
    color: ChildrenTheme.colors.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  writingWebViewContent: {
    padding: 0,
  },
  writingWebViewContainer: {
    height: 550,
    width: "100%",
    backgroundColor: ChildrenTheme.colors.card,
  },
  writingWebView: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.card,
  },
  writingLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ChildrenTheme.colors.card,
  },
  writingLoadingText: {
    marginTop: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.textLight,
  },
  snackbar: {
    marginBottom: ChildrenTheme.spacing.xl,
  },
});
