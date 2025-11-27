import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
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
import * as FileSystem from "expo-file-system";
import ChildrenTheme from "../theme/childrenTheme";
import { useScrollDragHandler } from "../utils/touchHandler";
import { speechAPI } from "../services/api";

export default function CompoundPracticeScreen({ route, navigation }) {
  const theme = useTheme();
  const { word, compound } = route.params;
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  const [userInput, setUserInput] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPracticeCompound, setCurrentPracticeCompound] = useState(compound);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [recording, setRecording] = useState(null);
  const recordingRef = useRef(null);

  useEffect(() => {
    // 如果没有传入 compound，随机选择一个
    if (!compound && word.compounds && word.compounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * word.compounds.length);
      setCurrentPracticeCompound(word.compounds[randomIndex]);
    }

    // 请求录音权限
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error("Failed to request audio permissions:", error);
        Alert.alert(
          "需要麦克风权限",
          "Please grant microphone permission to use voice input.",
          [{ text: "确定 / OK" }]
        );
      }
    })();

    // 清理函数
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
      }
    };
  }, [compound, word]);

  // 播放组词
  const handlePlayCompound = () => {
    if (currentPracticeCompound) {
      Speech.speak(currentPracticeCompound.word, {
        language: "zh-CN",
        pitch: 1.0,
        rate: 0.3,
      });
    }
  };

  // 处理语音识别结果或文本输入
  const handleInputResult = (inputText) => {
    if (!currentPracticeCompound || !inputText) {
      return;
    }

    // 检查输入的文本是否包含主字符
    const mainChar = word.word;
    if (inputText.includes(mainChar)) {
      // 包含主字符，显示在横线上
      const chars = inputText.split("");
      // 只取前N个字符（N为目标组词长度）
      const maxLength = currentPracticeCompound.word.length;
      const displayChars = chars.slice(0, maxLength);
      setUserInput(displayChars);

      // 如果长度达到目标长度，验证是否正确
      if (displayChars.length === maxLength) {
        const userWord = displayChars.join("");
        if (userWord === currentPracticeCompound.word) {
          // 正确
          setTimeout(() => {
            setUserInput([]);
            setTextInputValue("");
            setShowTextInput(false);
            Alert.alert(
              "🎉 正确！Correct!",
              `你组词正确！\nYou got it right!`,
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
          // 不正确，但包含主字符，保留显示
          // 用户可以继续输入来修正
        }
      }
    } else {
      // 不包含主字符，播放错误提示
      Speech.speak("The word you formed is incorrect. Please try again.", {
        language: "en-US",
        pitch: 1.0,
        rate: 0.5,
      });
      setUserInput([]);
      setTextInputValue("");
    }
  };

  // 处理语音识别结果
  const handleSpeechResult = (recognizedText) => {
    handleInputResult(recognizedText);
  };

  // 处理文本输入提交
  const handleTextInputSubmit = () => {
    handleInputResult(textInputValue);
  };

  // 开始录音
  const startRecording = async () => {
    try {
      console.log("🎤 Starting recording...");
      setIsRecording(true);

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        {
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: ".m4a",
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
        }
      );

      setRecording(newRecording);
      recordingRef.current = newRecording;
      console.log("✅ Recording started");
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      setIsRecording(false);
      Alert.alert(
        "录音失败",
        "Failed to start recording. Please check microphone permissions.",
        [{ text: "确定 / OK" }]
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
      const audioBase64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 发送到后端进行识别
      console.log("📤 Sending audio to server for recognition...");
      const response = await speechAPI.recognizeAudio(audioBase64, "zh-CN");

      if (response.data.success && response.data.transcript) {
        console.log("✅ Speech recognized:", response.data.transcript);
        handleSpeechResult(response.data.transcript);
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
            text: "使用文本输入 / Use Text Input",
            onPress: () => {
              setShowTextInput(true);
            },
          },
          {
            text: "取消 / Cancel",
            style: "cancel",
          },
        ]
      );
    } finally {
      setIsProcessing(false);
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
          </Card.Content>
        </Card>

        {/* 下划线位置 */}
        {currentPracticeCompound && (
          <Card style={styles.underlineCard} mode="elevated" elevation={1}>
            <Card.Content>
              <View style={styles.underlineContainer}>
                {currentPracticeCompound.word.split("").map((_, index) => (
                  <View key={index} style={styles.underlineBox}>
                    <Text style={styles.underlineChar}>
                      {userInput[index] || ""}
                    </Text>
                    <View style={styles.underline} />
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* 播放按钮 */}
        <Card style={styles.actionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={createPressHandler(handlePlayCompound)}
              style={styles.playButton}
              buttonColor={ChildrenTheme.colors.primary}
              icon="volume-high"
            >
              Play Compound • 播放组词
            </Button>
          </Card.Content>
        </Card>

        {/* 语音输入按钮 */}
        <Card style={styles.speechCard} mode="elevated" elevation={1}>
          <Card.Content style={styles.speechCardContent}>
            <Text variant="bodyMedium" style={styles.speechInputTitle}>
              Hold to Speak • 按住说话
            </Text>
            <View style={styles.recordButtonContainer}>
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color={ChildrenTheme.colors.primary} />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive,
                  ]}
                  onPressIn={startRecording}
                  onPressOut={stopRecordingAndRecognize}
                  disabled={isProcessing}
                >
                  <Text style={styles.recordButtonText}>
                    {isRecording ? "Recording..." : "Hold to Speak"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 文本输入备选方案 */}
        <Card style={styles.textInputCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Button
              mode="outlined"
              onPress={createPressHandler(() => setShowTextInput(!showTextInput))}
              style={styles.toggleTextInputButton}
              icon={showTextInput ? "keyboard-off" : "keyboard"}
            >
              {showTextInput ? "隐藏文本输入" : "使用文本输入 / Use Text Input"}
            </Button>

            {showTextInput && (
              <View style={styles.textInputContainer}>
                <TextInput
                  label="输入组词 / Enter Compound"
                  value={textInputValue}
                  onChangeText={setTextInputValue}
                  mode="outlined"
                  style={styles.textInput}
                  autoFocus={true}
                  onSubmitEditing={handleTextInputSubmit}
                />
                <Button
                  mode="contained"
                  onPress={createPressHandler(handleTextInputSubmit)}
                  style={styles.submitTextButton}
                  buttonColor={ChildrenTheme.colors.primary}
                >
                  提交 / Submit
                </Button>
              </View>
            )}
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
  underlineCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  underlineContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ChildrenTheme.spacing.md,
    paddingVertical: ChildrenTheme.spacing.lg,
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
  underline: {
    width: 50,
    height: 2,
    backgroundColor: ChildrenTheme.colors.text,
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
  textInputCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  toggleTextInputButton: {
    marginBottom: ChildrenTheme.spacing.sm,
  },
  textInputContainer: {
    marginTop: ChildrenTheme.spacing.md,
  },
  textInput: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  submitTextButton: {
    marginTop: ChildrenTheme.spacing.xs,
  },
});

