import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import {
  Card,
  Surface,
  useTheme,
  IconButton,
  Text as PaperText,
  Button,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImageManipulator from "expo-image-manipulator";
import { ocrAPI, wordsAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import cnchar from "cnchar";
import { useScrollDragHandler } from "../utils/touchHandler";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 获取汉字的笔画数
const getStrokeCount = (char) => {
  try {
    if (!char || typeof char !== "string" || char.length === 0) {
      return 999; // 默认值，排到最后
    }
    const strokeCount = cnchar.stroke(char);
    return typeof strokeCount === "number" ? strokeCount : 999;
  } catch (error) {
    if (__DEV__) {
      console.warn(`Failed to get stroke count for "${char}":`, error);
    }
    return 999;
  }
};

export default function ImageViewScreen({ route, navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState(route.params?.imageUri);
  const [extractedWords, setExtractedWords] = useState([]);
  const [knownWords, setKnownWords] = useState([]);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [selectedWords, setSelectedWords] = useState([]);
  const [addingWords, setAddingWords] = useState(false);
  const [animatingWords, setAnimatingWords] = useState(false);
  const [wordAnimations, setWordAnimations] = useState({});
  const [wordLayouts, setWordLayouts] = useState({});
  const [animationPlayed, setAnimationPlayed] = useState(false);
  const imageLayoutRef = useRef(null);
  const imageContainerRef = useRef(null);
  const wordsListRef = useRef(null);
  const wordRefs = useRef({});
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  useEffect(() => {
    // 如果从路由参数获取到图片，设置它
    if (route.params?.imageUri && !imageUri) {
      setImageUri(route.params.imageUri);
    }
  }, [route.params?.imageUri]);

  // 当图片加载后，自动触发 OCR
  useEffect(() => {
    if (imageUri && !processingOCR && !ocrCompleted) {
      // 延迟一点时间，确保图片已经显示
      const timer = setTimeout(() => {
        handleImagePress();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [imageUri, processingOCR, ocrCompleted, handleImagePress]);

  const compressImage = async (imageUri) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.warn("Image compression failed:", error);
      return imageUri;
    }
  };

  const handleImagePress = useCallback(async () => {
    if (!imageUri || processingOCR || ocrCompleted) {
      return;
    }

    setProcessingOCR(true);
    setExtractedWords([]);
    setKnownWords([]);
    setOcrCompleted(false);
    setAnimationPlayed(false);
    setWordAnimations({});
    setWordLayouts({});
    wordRefs.current = {};

    try {
      // 压缩图片
      const compressedUri = await compressImage(imageUri);

      // 转换为 base64
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 调用 OCR API
      const ocrResponse = await ocrAPI.extractText(base64);
      const { newWords, knownWords: known } = ocrResponse.data;

      if (__DEV__) {
        console.log("OCR result:", {
          newWords: newWords?.length || 0,
          knownWords: known?.length || 0,
        });
      }

      // 规范化文字列表
      const normalizedNewWords = (newWords || []).map((item, index) => {
        if (typeof item === "string") {
          return { word: item, pinyin: "", id: `word-${index}` };
        }
        return {
          word: item.word || item.character || item.text || item.value || "",
          pinyin: item.pinyin || "",
          id: `word-${index}`,
        };
      });

      const normalizedKnownWords = (known || []).map((item, index) => {
        if (typeof item === "string") {
          return { word: item, pinyin: "", id: `known-${index}` };
        }
        return {
          word: item.word || item.character || item.text || item.value || "",
          pinyin: item.pinyin || "",
          id: `known-${index}`,
        };
      });

      // 按笔画数排序（从简单到复杂）
      const sortedNewWords = [...normalizedNewWords].sort((a, b) => {
        const strokeA = getStrokeCount(a.word);
        const strokeB = getStrokeCount(b.word);
        return strokeA - strokeB;
      });

      const sortedKnownWords = [...normalizedKnownWords].sort((a, b) => {
        const strokeA = getStrokeCount(a.word);
        const strokeB = getStrokeCount(b.word);
        return strokeA - strokeB;
      });

      setExtractedWords(sortedNewWords);
      setKnownWords(sortedKnownWords);
      setSelectedWords([]); // 重置选中状态
      setOcrCompleted(true);

      if (normalizedNewWords.length === 0 && normalizedKnownWords.length === 0) {
        Alert.alert("No Words Found", "No Chinese characters detected in the image.");
      } else if (normalizedNewWords.length === 0 && normalizedKnownWords.length > 0) {
        Alert.alert(
          "All Words Known 🎉",
          `All ${normalizedKnownWords.length} characters detected are already in your vocabulary list.`
        );
      }
    } catch (error) {
      console.error("OCR error:", error);
      setOcrCompleted(true);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to extract text from image. Please try again."
      );
    } finally {
      setProcessingOCR(false);
    }
  }, [imageUri, processingOCR, ocrCompleted]);

  // 获取图片位置（用于动画起始位置）- 使用绝对坐标
  const handleImageLayout = () => {
    if (imageContainerRef.current) {
      imageContainerRef.current.measureInWindow((winX, winY, winWidth, winHeight) => {
        imageLayoutRef.current = {
          x: winX,
          y: winY,
          width: winWidth,
          height: winHeight,
        };
      });
    }
  };

  // 获取每个字在列表中的位置 - 使用绝对坐标
  const handleWordLayout = (wordId) => {
    const wordRef = wordRefs.current[wordId];
    if (wordRef) {
      wordRef.measureInWindow((winX, winY, winWidth, winHeight) => {
        setWordLayouts((prev) => ({
          ...prev,
          [wordId]: {
            x: winX,
            y: winY,
            width: winWidth,
            height: winHeight,
          },
        }));
      });
    }
  };

  // 启动飞行动画
  const startWordAnimations = useCallback((newWords, knownWords) => {
    if (animationPlayed) {
      if (__DEV__) {
        console.warn("Animation already played, skipping animation");
      }
      return;
    }

    // 重新测量照片位置，确保使用最新的坐标
    if (!imageContainerRef.current) {
      if (__DEV__) {
        console.warn("Image container ref not ready, skipping animation");
      }
      return;
    }

    // 重新测量照片位置
    imageContainerRef.current.measureInWindow((winX, winY, winWidth, winHeight) => {
      const imageLayout = {
        x: winX,
        y: winY,
        width: winWidth,
        height: winHeight,
      };
      
      // 更新 ref
      imageLayoutRef.current = imageLayout;

      setAnimatingWords(true);
      setAnimationPlayed(true);
      const allWords = [...newWords, ...knownWords];
      const animations = {};

      // 计算起始位置（照片的位置 - 照片的中心）
      const startX = imageLayout.x + imageLayout.width / 2;
      const startY = imageLayout.y + imageLayout.height / 2;

      allWords.forEach((item, index) => {
      const animX = new Animated.Value(0);
      const animY = new Animated.Value(0);
      const animOpacity = new Animated.Value(0);
      const animScale = new Animated.Value(0.5);

      animations[item.id] = {
        translateX: animX,
        translateY: animY,
        opacity: animOpacity,
        scale: animScale,
      };

      // 延迟启动每个字的动画（按笔画顺序）
      setTimeout(() => {
        // 获取目标位置（如果已测量）
        const targetLayout = wordLayouts[item.id];
        if (targetLayout) {
          const targetX = targetLayout.x + targetLayout.width / 2;
          const targetY = targetLayout.y + targetLayout.height / 2;

          // 设置起始位置
          animX.setValue(startX - targetX);
          animY.setValue(startY - targetY);
          animOpacity.setValue(1);
          animScale.setValue(0.5);

          // 启动动画
          Animated.parallel([
            Animated.timing(animX, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animY, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animOpacity, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.spring(animScale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // 如果布局未准备好，使用简单的淡入动画
          animOpacity.setValue(0);
          animScale.setValue(0.5);
          Animated.parallel([
            Animated.timing(animOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(animScale, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, index * 100); // 每个字延迟100ms
      });

      setWordAnimations(animations);

      // 动画完成后
      setTimeout(() => {
        setAnimatingWords(false);
      }, allWords.length * 100 + 1000);
    });
  }, [wordLayouts, animationPlayed]);

  // 当布局更新时，启动动画（只播放一次）
  useEffect(() => {
    if (ocrCompleted && extractedWords.length > 0 && Object.keys(wordLayouts).length > 0 && !animatingWords && !animationPlayed) {
      const allWords = [...extractedWords, ...knownWords];
      const allLayoutsReady = allWords.every(item => wordLayouts[item.id]);
      
      if (allLayoutsReady && imageLayoutRef.current) {
        // 延迟一点确保所有布局都已测量
        setTimeout(() => {
          startWordAnimations(extractedWords, knownWords);
        }, 200);
      }
    }
  }, [wordLayouts, ocrCompleted, extractedWords, knownWords, animatingWords, animationPlayed, startWordAnimations]);

  const toggleWordSelection = (word) => {
    if (selectedWords.includes(word)) {
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      setSelectedWords([...selectedWords, word]);
    }
  };

  const handleAddWords = async () => {
    if (selectedWords.length === 0) {
      Alert.alert("No Words Selected", "Please select at least one word to add");
      return;
    }

    setAddingWords(true);
    try {
      const response = await wordsAPI.addWords(selectedWords, imageUri);
      
      // 添加成功后，直接返回主界面
      Alert.alert(
        "Success! ✨",
        `Added ${response.data.added?.length || selectedWords.length} new words to your list!`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Home");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Add words error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to add words. Please try again."
      );
    } finally {
      setAddingWords(false);
    }
  };

  if (!imageUri) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: ChildrenTheme.colors.background },
        ]}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={ChildrenTheme.colors.primary}
        />
        <View
          style={[
            styles.header,
            {
              paddingTop: (insets.top + 10) / 2,
              backgroundColor: ChildrenTheme.colors.primary,
            },
          ]}
        >
          <IconButton
            icon="arrow-left"
            iconColor={ChildrenTheme.colors.textInverse}
            size={24}
            onPress={() => navigation.goBack()}
          />
        </View>
        <View style={styles.loadingContainer}>
          <Text variant="bodyLarge" style={styles.errorText}>
            No image available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: ChildrenTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={ChildrenTheme.colors.primary}
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 2,
            backgroundColor: ChildrenTheme.colors.primary,
          },
        ]}
      >
        <IconButton
          icon="arrow-left"
          iconColor={ChildrenTheme.colors.textInverse}
          size={24}
          onPress={() => navigation.goBack()}
        />
        <PaperText variant="titleLarge" style={styles.headerTitle}>
          Photo Preview
        </PaperText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView 
        style={styles.scrollContent}
        {...scrollHandlers}
      >
        <View style={styles.content}>
          {/* 照片区域 */}
          <View 
            ref={imageContainerRef}
            style={styles.imageContainer} 
            onLayout={handleImageLayout}
          >
            <Surface style={styles.imageSurface} elevation={2}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              {processingOCR && (
                <View style={styles.imageOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={ChildrenTheme.colors.primary}
                  />
                  <PaperText variant="bodyMedium" style={styles.overlayText}>
                    Extracting text...
                  </PaperText>
                </View>
              )}
            </Surface>
          </View>

          {/* 处理进度显示 */}
          {processingOCR && (
            <Card style={styles.progressCard} mode="elevated" elevation={2}>
              <Card.Content style={styles.progressContent}>
                <ActivityIndicator
                  size="large"
                  color={ChildrenTheme.colors.primary}
                  style={styles.progressIndicator}
                />
                <PaperText variant="titleMedium" style={styles.progressTitle}>
                  Analyzing Image...
                </PaperText>
                <PaperText variant="bodyMedium" style={styles.progressText}>
                  Extracting Chinese characters from the image
                </PaperText>
              </Card.Content>
            </Card>
          )}

          {/* 新词列表 */}
          {ocrCompleted && extractedWords.length > 0 && (
            <Card style={styles.wordsCard} mode="elevated" elevation={2}>
              <Card.Content>
                <PaperText variant="titleMedium" style={styles.wordsTitle}>
                  Extracted Words ({extractedWords.length})
                </PaperText>
                <PaperText variant="bodySmall" style={styles.wordsHint}>
                  Tap to select words you want to learn ({selectedWords.length} selected)
                </PaperText>
                <View style={styles.wordsList} ref={wordsListRef}>
                  {extractedWords.map((item) => {
                    const isSelected = selectedWords.includes(item.word);
                    const anim = wordAnimations[item.id];
                    const animatedStyle = anim
                      ? {
                          transform: [
                            { translateX: anim.translateX },
                            { translateY: anim.translateY },
                            { scale: anim.scale },
                          ],
                          opacity: anim.opacity,
                        }
                      : { opacity: 0 };

                    return (
                      <Animated.View
                        ref={(ref) => {
                          if (ref) {
                            wordRefs.current[item.id] = ref;
                            // 延迟测量，确保 ref 已设置
                            setTimeout(() => handleWordLayout(item.id), 50);
                          }
                        }}
                        key={item.id}
                        style={animatedStyle}
                      >
                        <TouchableOpacity
                          onPress={createPressHandler(() => toggleWordSelection(item.word))}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.wordChip,
                              isSelected ? styles.wordChipSelected : styles.wordChipUnselected,
                            ]}
                          >
                            {item.pinyin && (
                              <Text
                                style={[
                                  styles.wordPinyin,
                                  isSelected && styles.wordPinyinSelected,
                                ]}
                              >
                                {item.pinyin}
                              </Text>
                            )}
                            <Text
                              style={[
                                styles.wordText,
                                isSelected && styles.wordTextSelected,
                              ]}
                            >
                              {item.word}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* 已学过的词列表 */}
          {ocrCompleted && knownWords.length > 0 && (
            <Card style={styles.wordsCard} mode="elevated" elevation={2}>
              <Card.Content>
                <PaperText variant="titleMedium" style={styles.knownWordsTitle}>
                  ✓ Already Learned ({knownWords.length})
                </PaperText>
                <View style={styles.wordsList}>
                  {knownWords.map((item) => {
                    const anim = wordAnimations[item.id];
                    const animatedStyle = anim
                      ? {
                          transform: [
                            { translateX: anim.translateX },
                            { translateY: anim.translateY },
                            { scale: anim.scale },
                          ],
                          opacity: anim.opacity,
                        }
                      : { opacity: 0 };

                    return (
                      <Animated.View
                        ref={(ref) => {
                          if (ref) {
                            wordRefs.current[item.id] = ref;
                            // 延迟测量，确保 ref 已设置
                            setTimeout(() => handleWordLayout(item.id), 50);
                          }
                        }}
                        key={item.id}
                        style={animatedStyle}
                      >
                        <View style={styles.wordChipKnown}>
                          {item.pinyin && (
                            <Text style={styles.wordPinyinKnown}>
                              {item.pinyin}
                            </Text>
                          )}
                          <Text style={styles.wordTextKnown}>✓ {item.word}</Text>
                        </View>
                      </Animated.View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Add To My List 按钮 */}
          {ocrCompleted && selectedWords.length > 0 && (
            <Card style={styles.actionCard} mode="elevated" elevation={2}>
              <Card.Content>
                <Button
                  mode="contained"
                  onPress={handleAddWords}
                  disabled={addingWords}
                  loading={addingWords}
                  style={styles.addButton}
                  buttonColor={ChildrenTheme.colors.primary}
                  icon="plus"
                >
                  {addingWords
                    ? "Adding..."
                    : `Add ${selectedWords.length} Word${selectedWords.length > 1 ? "s" : ""} To My List`}
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ChildrenTheme.spacing.xs,
    paddingBottom: ChildrenTheme.spacing.sm,
    ...ChildrenTheme.shadows.medium,
  },
  headerTitle: {
    flex: 1,
    color: ChildrenTheme.colors.textInverse,
    fontWeight: "bold",
    textAlign: "center",
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: ChildrenTheme.colors.textLight,
  },
  imageContainer: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  imageSurface: {
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.large,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    marginTop: ChildrenTheme.spacing.md,
    color: "#fff",
  },
  progressCard: {
    marginBottom: ChildrenTheme.spacing.md,
    backgroundColor: ChildrenTheme.colors.card,
  },
  progressContent: {
    alignItems: "center",
    paddingVertical: ChildrenTheme.spacing.lg,
  },
  progressIndicator: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  progressTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  progressText: {
    color: ChildrenTheme.colors.textLight,
    textAlign: "center",
  },
  wordsCard: {
    marginBottom: ChildrenTheme.spacing.md,
    backgroundColor: ChildrenTheme.colors.card,
  },
  wordsTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  knownWordsTitle: {
    color: ChildrenTheme.colors.success,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.sm,
  },
  wordsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: ChildrenTheme.spacing.xs,
  },
  wordChip: {
    paddingHorizontal: ChildrenTheme.spacing.sm,
    paddingVertical: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.medium,
    margin: ChildrenTheme.spacing.xs,
    alignItems: "center",
    borderWidth: 2,
    minWidth: 60,
  },
  wordChipUnselected: {
    backgroundColor: ChildrenTheme.colors.background,
    borderColor: "#CCCCCC",
  },
  wordChipSelected: {
    backgroundColor: ChildrenTheme.colors.primary + "20",
    borderColor: ChildrenTheme.colors.primary,
  },
  wordChipKnown: {
    backgroundColor: ChildrenTheme.colors.success + "20",
    paddingHorizontal: ChildrenTheme.spacing.sm,
    paddingVertical: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.medium,
    margin: ChildrenTheme.spacing.xs,
    alignItems: "center",
    borderWidth: 2,
    borderColor: ChildrenTheme.colors.success,
    minWidth: 60,
  },
  wordPinyin: {
    fontSize: 11,
    color: "#999999",
    marginBottom: 2,
  },
  wordPinyinSelected: {
    color: ChildrenTheme.colors.primary,
  },
  wordText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#999999",
  },
  wordTextSelected: {
    color: ChildrenTheme.colors.text,
  },
  wordsHint: {
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.sm,
    fontStyle: "italic",
  },
  actionCard: {
    marginTop: ChildrenTheme.spacing.md,
    marginBottom: ChildrenTheme.spacing.md,
    backgroundColor: ChildrenTheme.colors.card,
  },
  addButton: {
    paddingVertical: ChildrenTheme.spacing.xs,
  },
  wordPinyinKnown: {
    fontSize: 11,
    color: ChildrenTheme.colors.success,
    marginBottom: 2,
    fontWeight: "500",
  },
  wordTextKnown: {
    fontSize: 18,
    fontWeight: "bold",
    color: ChildrenTheme.colors.success,
  },
});

