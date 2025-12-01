import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  useTheme,
  TextInput,
} from "react-native-paper";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";
import { speechAPI } from "../services/api";

export default function CompoundPracticeScreen({ route, navigation }) {
  const theme = useTheme();
  const { word, compound } = route.params;
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  // 自由组词练习的状态
  const targetCount = 3; // 固定需要完成3个组词
  const [completedWords, setCompletedWords] = useState([]); // 已完成的组词数组 [{ word: "木头", chars: ["木", "头"] }]
  const [currentUserInput, setCurrentUserInput] = useState(""); // 当前用户输入的词
  const [recordingForIndex, setRecordingForIndex] = useState(null); // 正在为哪个位置录音（null表示使用全局录音按钮）

  // 存储键
  const compoundStorageKey = `compoundPractice_${word._id}`;
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [recording, setRecording] = useState(null);
  const recordingRef = useRef(null);

  // 保存已完成的组词到本地存储
  const saveCompletedWords = async (words) => {
    try {
      const wordsToSave = words.map(w => ({
        word: w.word,
        chars: w.chars,
        completedAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(compoundStorageKey, JSON.stringify(wordsToSave));
      console.log(`✅ Saved ${wordsToSave.length} compound words for word ${word._id}`);
    } catch (error) {
      console.error("❌ Error saving compound words:", error);
    }
  };

  // 加载已保存的组词
  const loadCompletedWords = async () => {
    try {
      const saved = await AsyncStorage.getItem(compoundStorageKey);
      if (saved) {
        const words = JSON.parse(saved);
        // 只保留词语和字符信息，忽略时间戳（用于显示）
        const wordsData = words.map(w => ({
          word: w.word,
          chars: w.chars || w.word.split(""),
        }));
        setCompletedWords(wordsData);
        console.log(`📝 Loaded ${wordsData.length} saved compound words`);
      }
    } catch (error) {
      console.error("❌ Error loading compound words:", error);
    }
  };

  useEffect(() => {
    // 加载已保存的组词
    loadCompletedWords();

    // 预检查权限（不强制请求，等用户点击按钮时再请求）
    (async () => {
      try {
        const { status } = await Audio.getPermissionsAsync();
        if (status === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (error) {
        console.error("Failed to check audio permissions:", error);
      }
    })();

    // 清理函数
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [compound, word]);

  // 播放提示音（说明需要组词）
  const handlePlayHint = () => {
    Speech.speak(`请说出一个包含"${word.word}"的词`, {
      language: "zh-CN",
      pitch: 1.0,
      rate: 0.5,
    });
  };

  // 处理语音识别结果或文本输入
  const handleInputResult = async (inputText) => {
    if (!inputText) {
      return;
    }

    // 去除空格和标点，只保留中文字符
    const cleanedText = inputText.replace(/[\s\.,!?;:，。！？；：]/g, "");
    
    // 显示当前输入（在验证前显示）
    setCurrentUserInput(cleanedText);
    
    if (cleanedText.length < 2) {
      Speech.speak("请说出一个完整的词", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setCurrentUserInput("");
      setTextInputValue("");
      return;
    }

    // 检查是否已经完成过这个词
    if (completedWords.some(cw => cw.word === cleanedText)) {
      Speech.speak("这个词已经完成过了，请说另一个词", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setCurrentUserInput("");
      setTextInputValue("");
      return;
    }

    // 简单验证：检查是否包含主字符，长度2-4个字
    const mainChar = word.word;
    const containsMainChar = cleanedText.includes(mainChar);
    const isValidLength = cleanedText.length >= 2 && cleanedText.length <= 4;

    if (containsMainChar && isValidLength) {
      // 验证通过，添加到已完成列表
      const chars = cleanedText.split("");
      const newCompletedWords = [...completedWords, { word: cleanedText, chars }];
      setCompletedWords(newCompletedWords);
      // 保存到本地存储
      await saveCompletedWords(newCompletedWords);
      setCurrentUserInput("");
      setTextInputValue("");

      // 检查是否达到目标数量
      if (newCompletedWords.length >= targetCount) {
        // 所有组词都完成
        setTimeout(() => {
          Alert.alert(
            "🎉 恭喜！Congratulations!",
            `你已经完成了所有组词练习！\nAll compound practice completed!`,
            [
              {
                text: "确认 / OK",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }, 500);
      } else {
        // 还有未完成的组词，播放成功提示
        Speech.speak("很好！继续", {
          language: "zh-CN",
          pitch: 1.0,
          rate: 0.5,
        });
      }
    } else {
      // 验证失败
      let reason = "";
      if (!containsMainChar) {
        reason = "这个词必须包含主字符";
      } else if (!isValidLength) {
        reason = "词的长度应该在2-4个字之间";
      }
      Speech.speak(reason || "这个词不正确，请重新说", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setCurrentUserInput("");
      setTextInputValue("");
    }
  };

  // 处理语音识别结果
  const handleSpeechResult = async (recognizedText) => {
    await handleInputResult(recognizedText);
  };

  // 处理文本输入提交
  const handleTextInputSubmit = async () => {
    await handleInputResult(textInputValue);
  };

  // 处理麦克风按钮点击（针对特定位置的组词）
  const handleMicPress = async (targetIndex) => {
    setRecordingForIndex(targetIndex);
    await startRecording();
  };

  // 处理特定位置的组词结果
  const handleInputResultForIndex = async (inputText, targetIndex) => {
    if (!inputText) {
      return;
    }

    // 去除空格和标点，只保留中文字符
    const cleanedText = inputText.replace(/[\s\.,!?;:，。！？；：]/g, "");
    
    if (cleanedText.length < 2) {
      Speech.speak("请说出一个完整的词", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setRecordingForIndex(null);
      return;
    }

    // 检查是否已经完成过这个词
    if (completedWords.some(cw => cw.word === cleanedText)) {
      Speech.speak("这个词已经完成过了，请说另一个词", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setRecordingForIndex(null);
      return;
    }

    // 简单验证：检查是否包含主字符，长度2-4个字
    const mainChar = word.word;
    const containsMainChar = cleanedText.includes(mainChar);
    const isValidLength = cleanedText.length >= 2 && cleanedText.length <= 4;

    if (containsMainChar && isValidLength) {
      // 验证通过，添加到已完成列表的指定位置
      const chars = cleanedText.split("");
      const newCompletedWords = [...completedWords];
      
      // 如果目标位置已有词，替换它；否则插入到对应位置
      if (targetIndex < newCompletedWords.length) {
        newCompletedWords[targetIndex] = { word: cleanedText, chars };
      } else {
        // 确保数组长度足够
        while (newCompletedWords.length < targetIndex) {
          newCompletedWords.push(null);
        }
        newCompletedWords[targetIndex] = { word: cleanedText, chars };
      }
      
      // 移除 null 值并保持顺序
      const filteredWords = newCompletedWords.filter(w => w !== null);
      setCompletedWords(filteredWords);
      // 保存到本地存储
      await saveCompletedWords(filteredWords);
      setCurrentUserInput("");
      setTextInputValue("");
      setRecordingForIndex(null);
      
      // 检查是否达到目标数量
      if (filteredWords.length >= targetCount) {
        // 所有组词都完成
        setTimeout(() => {
          Alert.alert(
            "🎉 恭喜！Congratulations!",
            `你已经完成了所有组词练习！\nAll compound practice completed!`,
            [
              {
                text: "确认 / OK",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }, 500);
      } else {
        // 还有未完成的组词，播放成功提示
        Speech.speak("很好！继续", {
          language: "zh-CN",
          pitch: 1.0,
          rate: 0.5,
        });
      }

      // 检查是否达到目标数量
      if (filteredWords.length >= targetCount) {
        // 所有组词都完成
        setTimeout(() => {
          Alert.alert(
            "🎉 恭喜！Congratulations!",
            `你已经完成了所有组词练习！\nAll compound practice completed!`,
            [
              {
                text: "确认 / OK",
                onPress: () => {
                  navigation.goBack();
                },
              },
            ]
          );
        }, 500);
      } else {
        // 还有未完成的组词，播放成功提示
        Speech.speak("很好！继续", {
          language: "zh-CN",
          pitch: 1.0,
          rate: 0.5,
        });
      }
    } else {
      // 验证失败
      let reason = "";
      if (!containsMainChar) {
        reason = "这个词必须包含主字符";
      } else if (!isValidLength) {
        reason = "词的长度应该在2-4个字之间";
      }
      Speech.speak(reason || "这个词不正确，请重新说", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setRecordingForIndex(null);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");
      
      // 先清理之前的录音对象（如果存在）
      if (recordingRef.current) {
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording) {
            await recordingRef.current.stopAndUnloadAsync();
          } else if (status.canRecord) {
            await recordingRef.current.unloadAsync();
          }
        } catch (e) {
          console.log("清理之前的录音对象:", e.message);
        }
        recordingRef.current = null;
        setRecording(null);
      }
      
      // 检查并请求权限
      const { status } = await Audio.requestPermissionsAsync();
      console.log("📋 Permission status:", status);
      
      if (status !== 'granted') {
        Alert.alert(
          "需要麦克风权限",
          "Please grant microphone permission in Settings to use voice input.",
          [
            {
              text: "去设置 / Go to Settings",
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
            {
              text: "取消 / Cancel",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // 设置音频模式（必须在准备录音之前）
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // 使用预设选项（更可靠）
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      // 创建新的录音对象
      const newRecording = new Audio.Recording();
      
      console.log("📝 Preparing to record...");
      // 准备录音
      await newRecording.prepareToRecordAsync(recordingOptions);
      console.log("✅ Recording prepared");
      
      // 开始录音
      await newRecording.startAsync();
      console.log("✅ Recording started");

      setIsRecording(true);
      setRecording(newRecording);
      recordingRef.current = newRecording;
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      console.error("❌ Error details:", JSON.stringify(error, null, 2));
      setIsRecording(false);
      
      let errorMessage = "Failed to start recording. ";
      if (error.message?.includes('permission')) {
        errorMessage += "Please check microphone permissions in Settings.";
      } else if (error.message?.includes('prepared')) {
        errorMessage += "Recording setup failed. Please try again.";
      } else {
        errorMessage += error.message || "Unknown error.";
      }
      
      Alert.alert(
        "录音失败",
        errorMessage,
        [
          {
            text: "去设置 / Go to Settings",
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
          { text: "确定 / OK" },
        ]
      );
    }
  };

  // 停止录音并识别
  const stopRecordingAndRecognize = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }

      console.log("🛑 Stopping recording...");
      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      console.log("📁 Recording saved to:", uri);

      // 读取音频文件并转换为 base64
      // 使用 fetch 和 FileReader 的方式（更可靠）
      const fetchResponse = await fetch(uri);
      const blob = await fetchResponse.blob();
      const audioBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // 移除 data:audio/m4a;base64, 前缀，只保留 base64 字符串
          const base64String = reader.result.split(',')[1] || reader.result;
          resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 发送到后端进行识别
      console.log("📤 Sending audio to server for recognition...");
      const response = await speechAPI.recognizeAudio(audioBase64, "zh-CN");

      if (response.data.success && response.data.transcript) {
        console.log("✅ Speech recognized:", response.data.transcript);
        // 如果正在为特定位置录音，使用特定处理函数；否则使用通用处理函数
        if (recordingForIndex !== null) {
          await handleInputResultForIndex(response.data.transcript, recordingForIndex);
        } else {
          // 处理输入结果（handleInputResult内部会设置currentUserInput）
          await handleInputResult(response.data.transcript);
        }
      } else {
        throw new Error(response.data.message || "No transcript received");
      }

      // 清理录音文件
      await FileSystem.deleteAsync(uri, { idempotent: true });
      setRecording(null);
      recordingRef.current = null;
    } catch (error) {
      console.error("❌ Speech recognition error:", error);
      Alert.alert(
        "识别失败",
        error.response?.data?.message || error.message || "Speech recognition failed. Please try again.",
        [
          {
            text: "确定 / OK",
            style: "default",
          },
        ]
      );
    } finally {
      setIsProcessing(false);
      setRecordingForIndex(null);
      if (recordingRef.current) {
        recordingRef.current = null;
      }
    }
  };

  return (
    <ScrollView
      {...scrollHandlers}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.content}>
        {/* 主字符 */}
        <Card style={styles.mainCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.mainCharContainer}>
            <Text style={styles.mainCharText}>{word.word}</Text>
            <Text variant="bodySmall" style={styles.progressText}>
              {completedWords.length} / {targetCount} 完成
            </Text>
          </Card.Content>
        </Card>

        {/* 已完成的组词 */}
        {completedWords.map((completedWord, index) => (
          <Card 
            key={index} 
            style={[styles.underlineCard, styles.completedCard]} 
            mode="elevated" 
            elevation={1}
          >
            <Card.Content>
              <Text variant="bodySmall" style={styles.compoundLabel}>
                ✓ 组词 {index + 1} / {targetCount}
              </Text>
              <View style={styles.underlineContainerWithMic}>
                <View style={styles.underlineContainer}>
                  {completedWord.chars.map((char, charIndex) => (
                    <View key={charIndex} style={styles.underlineBox}>
                      <Text style={[styles.underlineChar, styles.completedChar]}>
                        {char}
                      </Text>
                      <View style={[styles.underline, styles.completedUnderline]} />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPressIn={createPressHandler(async () => {
                    // 已完成的词可以重新录音（替换）
                    await handleMicPress(index);
                  })}
                  onPressOut={createPressHandler(() => {
                    if (recordingForIndex === index && isRecording) {
                      stopRecordingAndRecognize();
                    }
                  })}
                  disabled={isProcessing || isRecording}
                  style={styles.micButtonTouchable}
                >
                  <IconButton
                    icon="microphone"
                    size={24}
                    iconColor={recordingForIndex === index && isRecording ? ChildrenTheme.colors.error : ChildrenTheme.colors.primary}
                    style={styles.micButton}
                    disabled={true}
                  />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        ))}

        {/* 当前输入区域（如果有输入但未完成） */}
        {currentUserInput && currentUserInput.length > 0 && (
          <Card 
            style={[styles.underlineCard, styles.currentCard]} 
            mode="elevated" 
            elevation={1}
          >
            <Card.Content>
              <Text variant="bodySmall" style={styles.compoundLabel}>
                组词 {completedWords.length + 1} / {targetCount} (输入中)
              </Text>
              <View style={styles.underlineContainerWithMic}>
                <View style={styles.underlineContainer}>
                  {currentUserInput.split("").map((char, charIndex) => (
                    <View key={charIndex} style={styles.underlineBox}>
                      <Text style={styles.underlineChar}>
                        {char}
                      </Text>
                      <View style={styles.underline} />
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPressIn={createPressHandler(async () => {
                    await handleMicPress(completedWords.length);
                  })}
                  onPressOut={createPressHandler(() => {
                    if (recordingForIndex === completedWords.length && isRecording) {
                      stopRecordingAndRecognize();
                    }
                  })}
                  disabled={isProcessing || isRecording}
                  style={styles.micButtonTouchable}
                >
                  <IconButton
                    icon="microphone"
                    size={24}
                    iconColor={recordingForIndex === completedWords.length && isRecording ? ChildrenTheme.colors.error : ChildrenTheme.colors.primary}
                    style={styles.micButton}
                    disabled={true}
                  />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 空位提示（显示还需要完成多少个） */}
        {Array.from({ length: Math.max(0, targetCount - completedWords.length - (currentUserInput ? 1 : 0)) }).map((_, index) => {
          const emptyIndex = completedWords.length + (currentUserInput ? 1 : 0) + index;
          // 显示横线（假设2-4个字，显示4个横线以覆盖大多数情况）
          const estimatedCharCount = 4;
          return (
            <Card 
              key={`empty-${index}`} 
              style={styles.underlineCard} 
              mode="elevated" 
              elevation={1}
            >
              <Card.Content>
                <Text variant="bodySmall" style={styles.compoundLabel}>
                  组词 {emptyIndex + 1} / {targetCount}
                </Text>
                <View style={styles.underlineContainerWithMic}>
                  <View style={styles.underlineContainer}>
                    {Array.from({ length: estimatedCharCount }).map((_, charIndex) => (
                      <View key={charIndex} style={styles.underlineBox}>
                        <View style={styles.emptyUnderline} />
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPressIn={createPressHandler(async () => {
                      await handleMicPress(emptyIndex);
                    })}
                    onPressOut={createPressHandler(() => {
                      if (recordingForIndex === emptyIndex && isRecording) {
                        stopRecordingAndRecognize();
                      }
                    })}
                    disabled={isProcessing || isRecording}
                    style={styles.micButtonTouchable}
                  >
                    <IconButton
                      icon="microphone"
                      size={24}
                      iconColor={recordingForIndex === emptyIndex && isRecording ? ChildrenTheme.colors.error : ChildrenTheme.colors.primary}
                      style={styles.micButton}
                      disabled={true}
                    />
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          );
        })}

        {/* 播放按钮 */}
        <Card style={styles.actionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={createPressHandler(handlePlayHint)}
              style={styles.playButton}
              buttonColor={ChildrenTheme.colors.primary}
              icon="volume-high"
            >
              播放提示 • Play Hint
            </Button>
          </Card.Content>
        </Card>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  mainCharContainer: {
    alignItems: "center",
    paddingVertical: ChildrenTheme.spacing.xl,
  },
  mainCharText: {
    fontSize: 64,
    fontWeight: "bold",
    color: ChildrenTheme.colors.text,
  },
  progressText: {
    marginTop: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.textLight,
    fontSize: 14,
  },
  underlineCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  completedCard: {
    backgroundColor: ChildrenTheme.colors.success + "10",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.success,
  },
  currentCard: {
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.primary,
  },
  compoundLabel: {
    marginBottom: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.text,
    fontWeight: "500",
  },
  underlineContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ChildrenTheme.spacing.md,
    paddingVertical: ChildrenTheme.spacing.lg,
    flex: 1,
  },
  underlineContainerWithMic: {
    flexDirection: "row",
    alignItems: "center",
    gap: ChildrenTheme.spacing.sm,
  },
  underlineBox: {
    alignItems: "center",
    width: 60,
  },
  underlineChar: {
    fontSize: 32,
    fontWeight: "bold",
    color: ChildrenTheme.colors.primary,
    marginBottom: ChildrenTheme.spacing.xs,
    minHeight: 40,
    textAlign: "center",
  },
  completedChar: {
    color: ChildrenTheme.colors.success,
    fontWeight: "bold",
  },
  underline: {
    width: 50,
    height: 2,
    backgroundColor: ChildrenTheme.colors.text,
  },
  completedUnderline: {
    backgroundColor: ChildrenTheme.colors.success,
    height: 3,
  },
  emptyUnderline: {
    width: 50,
    height: 2,
    backgroundColor: ChildrenTheme.colors.textLight,
    marginTop: 40, // 与有字符时的位置对齐
  },
  micButton: {
    margin: 0,
  },
  micButtonTouchable: {
    marginLeft: ChildrenTheme.spacing.sm,
  },
  actionCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  playButton: {
    marginVertical: ChildrenTheme.spacing.xs,
  },
  speechCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  speechInputTitle: {
    textAlign: "center",
    marginBottom: ChildrenTheme.spacing.md,
    color: ChildrenTheme.colors.text,
  },
  speechCardContent: {
    alignItems: "center",
    padding: ChildrenTheme.spacing.md,
  },
  recordButtonContainer: {
    marginTop: ChildrenTheme.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ChildrenTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  recordButtonActive: {
    backgroundColor: "#f44336",
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  processingText: {
    marginTop: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.text,
    fontSize: 14,
  },
});

