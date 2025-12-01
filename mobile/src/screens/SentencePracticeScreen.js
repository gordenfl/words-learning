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
} from "react-native-paper";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";
import { speechAPI } from "../services/api";

export default function SentencePracticeScreen({ route, navigation }) {
  const theme = useTheme();
  const { word } = route.params;
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  const targetSentenceCount = 3; // 需要完成3个句子
  const [completedSentences, setCompletedSentences] = useState([]); // 已完成的句子数组 [{ sentence: "我在学习中文", index: 0 }]
  const [currentUserInput, setCurrentUserInput] = useState(""); // 当前用户输入的句子
  const [recordingForIndex, setRecordingForIndex] = useState(null); // 正在为哪个句子录音

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recording, setRecording] = useState(null);
  const recordingRef = useRef(null);

  // 存储键
  const sentenceStorageKey = `sentencePractice_${word._id}`;

  // 获取词语列表（用于显示）
  const compounds = word.compounds || [];
  const displayCompounds = compounds.slice(0, 5); // 最多显示5个词语

  useEffect(() => {
    // 加载已保存的句子
    loadCompletedSentences();

    // 预检查权限
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

    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [word]);

  // 保存已完成的句子到本地存储
  const saveCompletedSentences = async (sentences) => {
    try {
      const sentencesToSave = sentences.map(s => ({
        sentence: s.sentence,
        index: s.index,
        completedAt: new Date().toISOString(),
      }));
      await AsyncStorage.setItem(sentenceStorageKey, JSON.stringify(sentencesToSave));
      console.log(`✅ Saved ${sentencesToSave.length} sentences for word ${word._id}`);
    } catch (error) {
      console.error("❌ Error saving sentences:", error);
    }
  };

  // 加载已保存的句子
  const loadCompletedSentences = async () => {
    try {
      const saved = await AsyncStorage.getItem(sentenceStorageKey);
      if (saved) {
        const sentences = JSON.parse(saved);
        setCompletedSentences(sentences);
        console.log(`📝 Loaded ${sentences.length} saved sentences`);
      }
    } catch (error) {
      console.error("❌ Error loading sentences:", error);
    }
  };

  // 处理语音识别结果
  const handleInputResult = async (inputText, sentenceIndex) => {
    if (!inputText) {
      return;
    }

    // 去除空格和标点，只保留中文字符
    const cleanedText = inputText.replace(/[\s\.,!?;:，。！？；：]/g, "");
    
    // 检查输入的句子是否包含主字符
    const mainChar = word.word;
    const containsMainChar = cleanedText.includes(mainChar);

    if (containsMainChar) {
      // 验证通过，添加到已完成列表
      const newCompletedSentences = [...completedSentences, { 
        sentence: cleanedText, 
        index: sentenceIndex 
      }];
      setCompletedSentences(newCompletedSentences);
      // 保存到本地存储
      await saveCompletedSentences(newCompletedSentences);
      setCurrentUserInput("");
      setRecordingForIndex(null);

      // 检查是否达到目标数量
      if (newCompletedSentences.length >= targetSentenceCount) {
        // 所有句子都完成
        setTimeout(() => {
          Alert.alert(
            "🎉 恭喜！Congratulations!",
            `你已经完成了所有造句练习！\nAll sentence practice completed!`,
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
        // 还有未完成的句子，播放成功提示
        Speech.speak("很好！继续", {
          language: "zh-CN",
          pitch: 1.0,
          rate: 0.5,
        });
      }
    } else {
      // 验证失败
      Speech.speak("这个句子必须包含主字符，请重新说", {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.5,
      });
      setCurrentUserInput("");
      setRecordingForIndex(null);
    }
  };

  // 处理麦克风按钮点击
  const handleMicPress = async (sentenceIndex) => {
    setRecordingForIndex(sentenceIndex);
    await startRecording();
  };

  // 开始录音
  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");
      
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

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;
      const newRecording = new Audio.Recording();
      
      console.log("📝 Preparing to record...");
      await newRecording.prepareToRecordAsync(recordingOptions);
      console.log("✅ Recording prepared");
      
      await newRecording.startAsync();
      console.log("✅ Recording started");

      setIsRecording(true);
      setRecording(newRecording);
      recordingRef.current = newRecording;
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
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
      const fetchResponse = await fetch(uri);
      const blob = await fetchResponse.blob();
      const audioBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
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
        // 显示当前输入
        setCurrentUserInput(response.data.transcript);
        // 处理输入结果
        if (recordingForIndex !== null) {
          await handleInputResult(response.data.transcript, recordingForIndex);
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
              {completedSentences.length} / {targetSentenceCount} 完成
            </Text>
          </Card.Content>
        </Card>

        {/* 词语列表 */}
        {displayCompounds.length > 0 && (
          <Card style={styles.compoundsCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.compoundsTitle}>
                相关词语 / Related Words
              </Text>
              <View style={styles.compoundsContainer}>
                {displayCompounds.map((compound, index) => (
                  <View key={index} style={styles.compoundChip}>
                    <Text style={styles.compoundText}>
                      {typeof compound === 'string' ? compound : compound.word}
                    </Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 三个句子练习区域 */}
        {Array.from({ length: targetSentenceCount }).map((_, index) => {
          const completedSentence = completedSentences.find(s => s.index === index);
          const isCurrent = recordingForIndex === index;
          const isCompleted = !!completedSentence;
          
          return (
            <Card 
              key={index} 
              style={[
                styles.sentenceCard,
                isCompleted && styles.completedCard,
                isCurrent && styles.currentCard
              ]} 
              mode="elevated" 
              elevation={1}
            >
              <Card.Content>
                <Text variant="bodySmall" style={styles.sentenceLabel}>
                  {isCompleted ? "✓ " : ""}句子 {index + 1} / {targetSentenceCount}
                  {isCurrent && " (录音中)"}
                </Text>
                <View style={styles.sentenceContainer}>
                  <View style={styles.sentenceTextContainer}>
                    {isCompleted ? (
                      <Text style={[styles.sentenceText, styles.completedText]}>
                        {completedSentence.sentence}
                      </Text>
                    ) : (
                      <Text style={styles.sentencePlaceholder}>
                        请说出一个包含"{word.word}"的句子
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPressIn={createPressHandler(async () => {
                      await handleMicPress(index);
                    })}
                    onPressOut={createPressHandler(() => {
                      if (recordingForIndex === index && isRecording) {
                        stopRecordingAndRecognize();
                      }
                    })}
                    disabled={isProcessing || isRecording || isCompleted}
                    style={styles.micButtonTouchable}
                  >
                    <IconButton
                      icon="microphone"
                      size={24}
                      iconColor={
                        isCompleted 
                          ? ChildrenTheme.colors.success 
                          : (recordingForIndex === index && isRecording 
                              ? ChildrenTheme.colors.error 
                              : ChildrenTheme.colors.primary)
                      }
                      style={styles.micButton}
                      disabled={true}
                    />
                  </TouchableOpacity>
                </View>
                {isProcessing && recordingForIndex === index && (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="small" color={ChildrenTheme.colors.primary} />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        })}
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
  compoundsCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  compoundsTitle: {
    marginBottom: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.text,
    fontWeight: "500",
  },
  compoundsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ChildrenTheme.spacing.sm,
  },
  compoundChip: {
    backgroundColor: ChildrenTheme.colors.primary + "20",
    paddingHorizontal: ChildrenTheme.spacing.md,
    paddingVertical: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.medium,
  },
  compoundText: {
    fontSize: 16,
    color: ChildrenTheme.colors.primary,
    fontWeight: "500",
  },
  sentenceCard: {
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
  sentenceLabel: {
    marginBottom: ChildrenTheme.spacing.sm,
    color: ChildrenTheme.colors.text,
    fontWeight: "500",
  },
  sentenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: ChildrenTheme.spacing.sm,
  },
  sentenceTextContainer: {
    flex: 1,
    minHeight: 50,
    justifyContent: "center",
  },
  sentenceText: {
    fontSize: 18,
    color: ChildrenTheme.colors.text,
    lineHeight: 28,
  },
  completedText: {
    color: ChildrenTheme.colors.success,
    fontWeight: "bold",
  },
  sentencePlaceholder: {
    fontSize: 16,
    color: ChildrenTheme.colors.textLight,
    fontStyle: "italic",
  },
  micButton: {
    margin: 0,
  },
  micButtonTouchable: {
    marginLeft: ChildrenTheme.spacing.sm,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ChildrenTheme.spacing.sm,
    gap: ChildrenTheme.spacing.xs,
  },
  processingText: {
    fontSize: 14,
    color: ChildrenTheme.colors.textLight,
  },
});

