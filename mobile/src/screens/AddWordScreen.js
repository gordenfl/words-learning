import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { wordsAPI } from '../services/api';

export default function AddWordScreen({ navigation }) {
  const [word, setWord] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddWord = async () => {
    if (!word.trim()) {
      Alert.alert('Error', 'Please enter a Chinese word');
      return;
    }

    setLoading(true);
    try {
      const examplesArray = examples
        .split('\n')
        .filter(ex => ex.trim())
        .map(ex => ex.trim());

      // Include pinyin and translation for Chinese learning
      const wordData = {
        word: word.trim(),
        pinyin: pinyin.trim(),
        translation: translation.trim(),
        definition: definition.trim(),
        examples: examplesArray
      };

      await wordsAPI.addWord(
        wordData.word, 
        wordData.definition, 
        wordData.examples
      );
      
      Alert.alert('Success', 'Chinese word added successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            setWord('');
            setPinyin('');
            setTranslation('');
            setDefinition('');
            setExamples('');
          },
        },
        {
          text: 'View Words',
          onPress: () => navigation.navigate('WordsList'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add word');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Add Chinese Word</Text>
          <Text style={styles.pageDesc}>
            Learn new Chinese vocabulary with pinyin and translation
          </Text>

          <Text style={styles.label}>Chinese Word (汉字) *</Text>
          <TextInput
            style={[styles.input, styles.chineseInput]}
            placeholder="e.g. 你好"
            value={word}
            onChangeText={setWord}
          />

          <Text style={styles.label}>Pinyin (拼音)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. nǐ hǎo"
            value={pinyin}
            onChangeText={setPinyin}
            autoCapitalize="none"
          />

          <Text style={styles.label}>English Translation *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. hello"
            value={translation}
            onChangeText={setTranslation}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add any notes about this word"
            value={definition}
            onChangeText={setDefinition}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Example Sentences (optional, one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. 你好，很高兴认识你"
            value={examples}
            onChangeText={setExamples}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleAddWord}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add Word</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pageDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  chineseInput: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

