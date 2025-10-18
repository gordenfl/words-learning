import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersAPI, authAPI } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        
        const response = await authAPI.getProfile();
        const fullUser = response.data.user;
        setDisplayName(fullUser.profile?.displayName || '');
        setBio(fullUser.profile?.bio || '');
        setUser(fullUser);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(displayName, null, bio);
      Alert.alert('Success', 'Profile updated successfully');
      
      // Update local storage
      const updatedUser = { ...user, profile: { displayName, bio } };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      'Enter your current password',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Next',
          onPress: (currentPassword) => {
            Alert.prompt(
              'Change Password',
              'Enter new password',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Change',
                  onPress: async (newPassword) => {
                    try {
                      await authAPI.changePassword(currentPassword, newPassword);
                      Alert.alert('Success', 'Password changed successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to change password');
                    }
                  },
                },
              ],
              'secure-text'
            );
          },
        },
      ],
      'secure-text'
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersAPI.deleteAccount();
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter display name"
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdateProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity
            style={styles.settingButton}
            onPress={handleChangePassword}
          >
            <Text style={styles.settingButtonText}>Change Password</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.settingButtonText, styles.dangerText]}>
              Delete Account
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.achievements}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {user?.achievements?.length > 0 ? (
            user.achievements.map((achievement, index) => (
              <View key={index} style={styles.achievementCard}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDesc}>{achievement.description}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No achievements yet. Keep learning!</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
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
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingButtonText: {
    fontSize: 16,
    color: '#333',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF3B30',
  },
  achievements: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  achievementCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginTop: 10,
  },
});

