import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Surface,
  useTheme,
  IconButton,
  Divider,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usersAPI, authAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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
      console.log('Error loading profile:', error);
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
    setShowPasswordModal(true);
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleConfirmPasswordChange = async () => {
    // 检查用户是否通过 OAuth 登录（Google/Facebook）
    const isOAuthUser = user?.authProvider === 'google' || user?.authProvider === 'facebook';
    
    // 对于 OAuth 用户首次设置密码，不需要当前密码
    // 对于邮箱登录用户或已有密码的用户，需要当前密码
    const requiresCurrentPassword = !isOAuthUser;

    // 验证输入
    if (requiresCurrentPassword && !currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in new password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      // 如果是 OAuth 用户首次设置密码，不发送 oldPassword（或发送 null）
      const oldPasswordToSend = requiresCurrentPassword ? currentPassword : null;
      await authAPI.changePassword(oldPasswordToSend, newPassword);
      Alert.alert('Success', isOAuthUser ? 'Password set successfully' : 'Password changed successfully');
      handleCancelPasswordChange();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('user');
            navigation.replace('Login');
          },
        },
      ]
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
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyMedium" style={styles.loaderText}>
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: ChildrenTheme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={ChildrenTheme.colors.primary} />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 2,
            backgroundColor: ChildrenTheme.colors.primary,
          },
        ]}
      >
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.content}>
          {/* Profile Header Card */}
          <Card style={styles.profileCard} mode="elevated" elevation={2}>
            <Card.Content style={styles.profileCardContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.username?.charAt(0).toUpperCase() || "👤"}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text variant="headlineSmall" style={styles.username}>
                    {user?.username || "User"}
                  </Text>
                  <Text variant="bodyMedium" style={styles.email}>
                    {user?.email || ""}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Profile Form Card */}
          <Card style={styles.formCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Edit Profile
              </Text>

              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                contentStyle={styles.inputContent}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="account" />}
              />

              <TextInput
                label="Bio"
                value={bio}
                onChangeText={setBio}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
                contentStyle={styles.textAreaContent}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="text" />}
              />

              <Button
                mode="contained"
                onPress={handleUpdateProfile}
                loading={saving}
                disabled={saving}
                style={styles.updateButton}
                buttonColor={ChildrenTheme.colors.primary}
                icon="content-save"
              >
                Update Profile
              </Button>
            </Card.Content>
          </Card>

          {/* Account Settings Card */}
          <Card style={styles.settingsCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Account Settings
              </Text>

              <Surface
                style={styles.settingItem}
                elevation={0}
                onTouchEnd={handleChangePassword}
              >
                <View style={styles.settingItemLeft}>
                  <IconButton
                    icon="lock-reset"
                    size={24}
                    iconColor={ChildrenTheme.colors.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={styles.settingText}>
                    Change Password
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={ChildrenTheme.colors.textLight}
                  style={styles.chevronIcon}
                />
              </Surface>

              <Divider style={styles.divider} />

              <Surface
                style={styles.settingItem}
                elevation={0}
                onTouchEnd={handleLogout}
              >
                <View style={styles.settingItemLeft}>
                  <IconButton
                    icon="logout"
                    size={24}
                    iconColor={ChildrenTheme.colors.warning}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={styles.settingText}>
                    Logout
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={ChildrenTheme.colors.textLight}
                  style={styles.chevronIcon}
                />
              </Surface>
            </Card.Content>
          </Card>

          {/* Delete Account Button */}
          <Button
            mode="contained"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            buttonColor={ChildrenTheme.colors.error}
            icon="delete"
          >
            Delete Account
          </Button>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelPasswordChange}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard} mode="elevated" elevation={8}>
            <Card.Content style={styles.modalHeaderContent}>
              <View style={styles.modalHeader}>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  Change Password
                </Text>
                <IconButton
                  icon="close"
                  size={24}
                  iconColor={ChildrenTheme.colors.text}
                  onPress={handleCancelPasswordChange}
                  style={styles.modalCloseButton}
                />
              </View>
            </Card.Content>

            <Card.Content style={styles.modalContent}>
              {/* 对于 OAuth 用户首次设置密码，当前密码字段可选 */}
              {(user?.authProvider === 'google' || user?.authProvider === 'facebook') ? (
                <Text style={styles.helperText}>
                  You're using {user.authProvider === 'google' ? 'Google' : 'Facebook'} login. 
                  You can set a password without entering your current password.
                </Text>
              ) : null}
              <TextInput
                label={user?.authProvider === 'google' || user?.authProvider === 'facebook' 
                  ? "Current Password (Optional)" 
                  : "Current Password"}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock" />}
                placeholder={user?.authProvider === 'google' || user?.authProvider === 'facebook' 
                  ? "Leave empty if setting password for the first time" 
                  : ""}
              />

              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-outline" />}
              />

              <TextInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock-check" />}
              />
            </Card.Content>

            <Card.Actions style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={handleCancelPasswordChange}
                disabled={changingPassword}
                style={styles.modalCancelButton}
                textColor={ChildrenTheme.colors.textLight}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmPasswordChange}
                loading={changingPassword}
                disabled={changingPassword}
                style={styles.modalConfirmButton}
                buttonColor={ChildrenTheme.colors.primary}
                icon="check"
              >
                Change
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ChildrenTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.xl,
  },
  loaderText: {
    color: ChildrenTheme.colors.textLight,
    marginTop: ChildrenTheme.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: ChildrenTheme.spacing.sm,
    backgroundColor: ChildrenTheme.colors.primary,
    ...ChildrenTheme.shadows.medium,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 60,
    height: 60,
    marginRight: ChildrenTheme.spacing.sm,
    borderRadius: ChildrenTheme.borderRadius.medium,
    overflow: "hidden",
  },
  headerTitle: {
    ...ChildrenTheme.typography.h3,
    color: ChildrenTheme.colors.textInverse,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...ChildrenTheme.typography.body,
    color: ChildrenTheme.colors.textInverse,
    opacity: 0.9,
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: ChildrenTheme.spacing.md,
  },
  profileCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  profileCardContent: {
    padding: ChildrenTheme.spacing.lg,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ChildrenTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: ChildrenTheme.spacing.md,
    ...ChildrenTheme.shadows.medium,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "bold",
    color: ChildrenTheme.colors.textInverse,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.xs,
  },
  email: {
    color: ChildrenTheme.colors.textLight,
  },
  formCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  sectionTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    marginBottom: ChildrenTheme.spacing.md,
  },
  input: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  inputContent: {
    fontSize: ChildrenTheme.typography.body.fontSize,
  },
  textAreaContent: {
    fontSize: ChildrenTheme.typography.body.fontSize,
    minHeight: 80,
  },
  updateButton: {
    marginTop: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.medium,
  },
  settingsCard: {
    marginBottom: ChildrenTheme.spacing.md,
    borderRadius: ChildrenTheme.borderRadius.large,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.xs,
    borderRadius: ChildrenTheme.borderRadius.small,
    marginBottom: ChildrenTheme.spacing.xs,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    margin: 0,
    padding: 0,
  },
  settingText: {
    color: ChildrenTheme.colors.text,
    marginLeft: ChildrenTheme.spacing.xs,
  },
  chevronIcon: {
    margin: 0,
    padding: 0,
  },
  divider: {
    marginVertical: ChildrenTheme.spacing.xs,
  },
  deleteButton: {
    marginTop: ChildrenTheme.spacing.sm,
    marginBottom: ChildrenTheme.spacing.lg,
    borderRadius: ChildrenTheme.borderRadius.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: ChildrenTheme.spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: ChildrenTheme.colors.card,
    borderRadius: ChildrenTheme.borderRadius.xlarge,
    overflow: "hidden",
  },
  modalHeaderContent: {
    padding: ChildrenTheme.spacing.md,
    paddingBottom: ChildrenTheme.spacing.sm,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: ChildrenTheme.colors.text,
    fontWeight: "bold",
    flex: 1,
  },
  modalCloseButton: {
    margin: 0,
  },
  modalContent: {
    padding: ChildrenTheme.spacing.md,
  },
  modalInput: {
    marginBottom: ChildrenTheme.spacing.md,
  },
  helperText: {
    fontSize: 12,
    color: ChildrenTheme.colors.textLight,
    marginBottom: ChildrenTheme.spacing.sm,
    paddingHorizontal: ChildrenTheme.spacing.xs,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: "row",
    padding: ChildrenTheme.spacing.md,
    gap: ChildrenTheme.spacing.sm,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalConfirmButton: {
    flex: 1,
  },
});

