import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  IconButton,
  useTheme,
  Surface,
  ActivityIndicator,
} from "react-native-paper";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";
import { useScrollDragHandler } from "../utils/touchHandler";

/**
 * WordContent - Renders a single word's detail content
 * This component is used inside VerticalSwipePager
 */
export default function WordContent({
  word,
  navigation,
  onDeleteWord,
  onGenerateDetails,
  onCompoundPracticeClick,
  onSentencePracticeClick,
  generatingDetails = false,
  generatingCompounds = false,
  generatingExamples = false,
  showStrokeOrder,
  onShowStrokeOrder,
  styles,
}) {
  const theme = useTheme();
  const { currentTheme } = useThemeContext();
  const dynamicTheme = currentTheme;
  const { createPressHandler, scrollHandlers } = useScrollDragHandler();

  const [isWritingCompleted, setIsWritingCompleted] = useState(false);
  const [isCompoundPracticeCompleted, setIsCompoundPracticeCompleted] =
    useState(false);
  const [isSentencePracticeCompleted, setIsSentencePracticeCompleted] =
    useState(false);

  // Check practice statuses
  useEffect(() => {
    if (!word?._id) return;

    const checkStatuses = async () => {
      // Check Writing
      const completedKey = `writingCompleted_${word._id}`;
      const progressKey = `writingProgress_${word._id}`;
      try {
        const writingCompleted = await AsyncStorage.getItem(completedKey);
        if (writingCompleted === "true") {
          setIsWritingCompleted(true);
        } else {
          const savedProgress = await AsyncStorage.getItem(progressKey);
          if (savedProgress) {
            const indices = JSON.parse(savedProgress);
            setIsWritingCompleted(indices.length >= 10);
          }
        }
      } catch (error) {
        console.error("Error checking writing status:", error);
      }

      // Check Compound Practice
      const compoundKey = `compoundPractice_${word._id}`;
      try {
        const saved = await AsyncStorage.getItem(compoundKey);
        if (saved) {
          const words = JSON.parse(saved);
          setIsCompoundPracticeCompleted(words.length >= 3);
        }
      } catch (error) {
        console.error("Error checking compound practice:", error);
      }

      // Check Sentence Practice
      const sentenceKey = `sentencePractice_${word._id}`;
      try {
        const saved = await AsyncStorage.getItem(sentenceKey);
        if (saved) {
          const sentences = JSON.parse(saved);
          setIsSentencePracticeCompleted(sentences.length >= 3);
        }
      } catch (error) {
        console.error("Error checking sentence practice:", error);
      }
    };

    checkStatuses();
  }, [word?._id]);

  if (!word) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const speakWord = (text) => {
    Speech.speak(text, {
      language: "zh-CN",
      pitch: 1.0,
      rate: 0.1,
    });
  };

  const statusColor =
    word.status === "known"
      ? dynamicTheme.colors.success
      : word.status === "learning"
      ? dynamicTheme.colors.warning
      : dynamicTheme.colors.error;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      {...scrollHandlers}
    >
      <View style={styles.content}>
        {/* Status Chip */}
        <View style={styles.statusContainer}>
          <Chip
            icon={word.status === "known" ? "check-circle" : "book-open-variant"}
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  word.status === "known"
                    ? dynamicTheme.colors.success + "20"
                    : word.status === "learning"
                    ? dynamicTheme.colors.warning + "20"
                    : dynamicTheme.colors.error + "20",
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

        {/* Main Content */}
        <Card style={styles.mainCard} mode="elevated" elevation={2}>
          <Card.Content style={styles.mainContent}>
            {word.pinyin && (
              <Text
                variant="titleLarge"
                style={[styles.pinyin, { color: theme.colors.primary }]}
              >
                {word.pinyin}
              </Text>
            )}
            <View style={styles.wordWithSpeaker}>
              <Text style={styles.wordText}>{word.word}</Text>
              <IconButton
                icon="volume-high"
                size={28}
                iconColor={theme.colors.primary}
                onPress={createPressHandler(() => speakWord(word.word))}
                style={styles.speakerButton}
              />
            </View>
            <IconButton
              icon="gesture-tap"
              size={20}
              iconColor={ChildrenTheme.colors.textLight}
              onPress={createPressHandler(() => onShowStrokeOrder?.(word))}
              style={styles.strokeHintButton}
            />
            {word.translation && (
              <Text variant="titleMedium" style={styles.translation}>
                {word.translation}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.tapHint}>
              Tap 🔊 to hear • Tap 字 to see strokes
            </Text>
            {/* Delete Button */}
            <View style={styles.deleteButtonContainer}>
              <IconButton
                icon="delete-outline"
                size={24}
                iconColor={dynamicTheme.colors.error}
                onPress={createPressHandler(() => onDeleteWord?.(word))}
                style={styles.deleteButton}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Writing Button */}
        <Card style={styles.sectionCard} mode="elevated" elevation={1}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={createPressHandler(() =>
                navigation.navigate("WordWriting", { word })
              )}
              style={styles.writingButton}
              buttonColor={ChildrenTheme.colors.primary}
              icon={isWritingCompleted ? "check-circle" : "pencil"}
            >
              {isWritingCompleted && "✓ "}Writing • 书写练习
            </Button>
          </Card.Content>
        </Card>

        {/* Word Compounds */}
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
                  onPress={createPressHandler(() =>
                    onGenerateDetails?.(true, "compounds")
                  )}
                  disabled={generatingCompounds}
                />
              )}
            </View>
            {(generatingDetails || generatingCompounds) &&
            (!word.compounds || word.compounds.length === 0) ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            ) : word.compounds && word.compounds.length > 0 ? (
              <>
                {word.compounds.map((compound, index) => (
                  <Surface
                    key={index}
                    style={styles.compoundItem}
                    elevation={0}
                    onTouchEnd={createPressHandler(() =>
                      speakWord(compound.word)
                    )}
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

        {/* Compound Practice Button */}
        {word.compounds && word.compounds.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={createPressHandler(() =>
                  onCompoundPracticeClick?.(word)
                )}
                style={styles.compoundPracticeButton}
                buttonColor={ChildrenTheme.colors.secondary}
                icon={isCompoundPracticeCompleted ? "check-circle" : "puzzle"}
              >
                {isCompoundPracticeCompleted && "✓ "}Compound Practice • 组词练习
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Example Sentences */}
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
                  onPress={createPressHandler(() =>
                    onGenerateDetails?.(true, "examples")
                  )}
                  disabled={generatingExamples}
                />
              )}
            </View>
            {(generatingDetails || generatingExamples) &&
            (!word.examples || word.examples.length === 0) ? (
              <View style={styles.generatingContainer}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
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
                      onTouchEnd={createPressHandler(() =>
                        speakWord(sentenceText)
                      )}
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

        {/* Sentence Practice Button */}
        {word.examples && word.examples.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={createPressHandler(() =>
                  onSentencePracticeClick?.(word)
                )}
                style={styles.sentencePracticeButton}
                buttonColor={ChildrenTheme.colors.accent}
                icon={
                  isSentencePracticeCompleted ? "check-circle" : "message-text"
                }
              >
                {isSentencePracticeCompleted && "✓ "}Sentence Practice • 造句练习
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Definition */}
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
      </View>
    </ScrollView>
  );
}

