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
import * as ImageManipulator from 'expo-image-manipulator';
import { wordsAPI, ocrAPI } from '../services/api';

export default function CameraScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [extractedWords, setExtractedWords] = useState([]);
  const [knownWords, setKnownWords] = useState([]);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photos to select images');
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
      Alert.alert('Permission Needed', 'Please allow access to your camera to take photos');
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

  const compressImage = async (imageUri) => {
    try {
      console.log('🗜️  Compressing image...');
      
      // 压缩图片：调整大小并降低质量
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 1024 } } // 宽度调整为1024px，高度自动按比例
        ],
        { 
          compress: 0.7, // 压缩质量70%
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      
      console.log('✅ Image compressed');
      return manipResult.uri;
    } catch (error) {
      console.warn('⚠️  Image compression failed, using original:', error.message);
      return imageUri;
    }
  };

  const extractTextFromImage = async (imageUri) => {
    setLoading(true);
    try {
      // 先压缩图片
      const compressedUri = await compressImage(imageUri);
      
      console.log('📸 Converting compressed image to base64...');
      
      // 将压缩后的图片转换为base64
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      console.log('🔍 Calling OCR API...');
      
      // 调用后端OCR API
      const ocrResponse = await ocrAPI.extractText(base64);
      
      const { newWords, knownWords, stats } = ocrResponse.data;
      
      setExtractedWords(newWords);
      setKnownWords(knownWords);
      
      console.log(`✅ OCR: ${newWords.length} new words, ${knownWords.length} already known`);
      
      Alert.alert(
        'Text Extracted! 📖',
        `Found ${stats.totalExtracted} Chinese words:\n` +
        `• ${newWords.length} new words to learn\n` +
        `• ${knownWords.length} words you already know`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('OCR error:', error);
      Alert.alert('Oops!', 'Could not extract text from the image. Please try another image.');
    } finally {
      setLoading(false);
    }
  };

  const addWordsToList = async () => {
    if (extractedWords.length === 0) {
      Alert.alert('No Words Yet', 'Please scan or select an image first to extract words');
      return;
    }

    setLoading(true);
    try {
      // extractedWords 现在是对象数组 [{word, pinyin}]
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
      Alert.alert('Oops!', 'Could not add the words to your list. Please try again.');
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
              New Words to Learn ({extractedWords.length})
            </Text>
            <Text style={styles.wordsSubtitle}>
              These words are not in your vocabulary yet
            </Text>
            <View style={styles.wordsList}>
              {extractedWords.map((item, index) => (
                <View key={index} style={styles.wordChipNew}>
                  <Text style={styles.wordChipText}>{item.word}</Text>
                  <Text style={styles.wordChipPinyin}>{item.pinyin}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={addWordsToList}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>
                ➕ Add {extractedWords.length} New Words
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {knownWords.length > 0 && (
          <View style={styles.wordsContainer}>
            <Text style={styles.knownWordsTitle}>
              Already Known ({knownWords.length})
            </Text>
            <Text style={styles.wordsSubtitle}>
              You've already learned these words
            </Text>
            <View style={styles.wordsList}>
              {knownWords.map((item, index) => (
                <View key={index} style={styles.wordChipKnown}>
                  <Text style={styles.wordChipTextKnown}>✓ {item.word}</Text>
                  <Text style={styles.wordChipPinyinKnown}>{item.pinyin}</Text>
                </View>
              ))}
            </View>
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
    marginBottom: 8,
  },
  knownWordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#50C878',
    marginBottom: 8,
  },
  wordsSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  wordsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  wordChipNew: {
    backgroundColor: '#FFE4E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  wordChipKnown: {
    backgroundColor: '#E0F8E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#50C878',
  },
  wordChipText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  wordChipPinyin: {
    color: '#FF6B6B',
    fontSize: 11,
    marginTop: 2,
  },
  wordChipTextKnown: {
    color: '#50C878',
    fontSize: 14,
    fontWeight: '500',
  },
  wordChipPinyinKnown: {
    color: '#50C878',
    fontSize: 10,
    marginTop: 2,
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

