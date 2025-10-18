import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { wordsAPI } from '../services/api';

export default function CameraScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [extractedWords, setExtractedWords] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      extractTextFromImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need permission to access your camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      extractTextFromImage(result.assets[0].uri);
    }
  };

  const extractTextFromImage = async (imageUri) => {
    setLoading(true);
    try {
      // In production, this would call Google Cloud Vision API
      // For now, simulate text extraction
      
      // Simulated extracted words
      const mockWords = [
        'challenge', 'opportunity', 'innovation', 'perspective', 
        'resilience', 'collaboration', 'strategy', 'excellence'
      ];
      
      setExtractedWords(mockWords);
      
      Alert.alert(
        'Text Extracted',
        `Found ${mockWords.length} words. Review and add them to your list.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to extract text from image');
    } finally {
      setLoading(false);
    }
  };

  const addWordsToList = async () => {
    if (extractedWords.length === 0) {
      Alert.alert('No Words', 'Please scan an image first');
      return;
    }

    setLoading(true);
    try {
      const response = await wordsAPI.addWords(extractedWords, image);
      
      Alert.alert(
        'Success',
        `Added ${response.data.added.length} new words. ${response.data.skipped.length} words were already in your list.`,
        [
          {
            text: 'View Words',
            onPress: () => navigation.navigate('WordsList'),
          },
        ]
      );
      
      setImage(null);
      setExtractedWords([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add words');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Scan Text from Book</Text>
        <Text style={styles.description}>
          Take a photo or select an image to extract words automatically
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePhoto}>
            <Text style={styles.buttonText}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Extracting text...</Text>
          </View>
        )}

        {extractedWords.length > 0 && (
          <View style={styles.wordsContainer}>
            <Text style={styles.wordsTitle}>
              Extracted Words ({extractedWords.length})
            </Text>
            <View style={styles.wordsList}>
              {extractedWords.map((word, index) => (
                <View key={index} style={styles.wordChip}>
                  <Text style={styles.wordChipText}>{word}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addWordsToList}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                Add {extractedWords.length} Words to List
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  wordsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  wordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  wordChipText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#50C878',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

