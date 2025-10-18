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
  const [definition, setDefinition] = useState('');
  const [examples, setExamples] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddWord = async () => {
    if (!word.trim()) {
      Alert.alert('Error', 'Please enter a word');
      return;
    }

    setLoading(true);
    try {
      const examplesArray = examples
        .split('\n')
        .filter(ex => ex.trim())
        .map(ex => ex.trim());

      await wordsAPI.addWord(word.trim(), definition.trim(), examplesArray);
      
      Alert.alert('Success', 'Word added successfully!', [
        {
          text: 'Add Another',
          onPress: () => {
            setWord('');
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
          <Text style={styles.label}>Word *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter word"
            value={word}
            onChangeText={setWord}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Definition (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter definition"
            value={definition}
            onChangeText={setDefinition}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Examples (optional, one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter example sentences"
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
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

