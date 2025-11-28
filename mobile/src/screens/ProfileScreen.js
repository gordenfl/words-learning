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
  TouchableOpacity,
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
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { usersAPI, authAPI } from "../services/api";
import ChildrenTheme from "../theme/childrenTheme";
import { useThemeContext } from "../context/ThemeContext";
import { useScrollDragHandler } from "../utils/touchHandler";

export default function ProfileScreen({ navigation }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentThemeName, currentTheme, setTheme, themeVariants } =
    useThemeContext();
  // 使用动态主题而不是静态的 ChildrenTheme
  const dynamicTheme = currentTheme;
  // 创建动态样式
  const styles = createStyles(dynamicTheme);
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
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { scrollHandlers, createPressHandler } = useScrollDragHandler();

  useEffect(() => {
    loadProfile();

    // 监听屏幕焦点，当返回时重新加载数据
    const unsubscribe = navigation.addListener("focus", () => {
      loadProfile();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        const response = await authAPI.getProfile();
        const fullUser = response.data.user;
        setDisplayName(fullUser.profile?.displayName || "");
        setBio(fullUser.profile?.bio || "");

        // 确保 avatar 有正确的格式（如果是 base64 字符串，添加前缀）
        if (fullUser.profile?.avatar) {
          let avatar = fullUser.profile.avatar;
          // 如果 avatar 是纯 base64 字符串（没有 data: 前缀），添加前缀
          if (!avatar.startsWith("data:") && !avatar.startsWith("http")) {
            avatar = `data:image/jpeg;base64,${avatar}`;
          }
          fullUser.profile.avatar = avatar;
        }

        // 更新本地存储
        await AsyncStorage.setItem("user", JSON.stringify(fullUser));
        setUser(fullUser);
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await usersAPI.updateProfile(displayName, null, bio);
      Alert.alert("Success", "Profile updated successfully");

      // Update local storage
      const updatedUser = { ...user, profile: { displayName, bio } };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleCancelPasswordChange = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleConfirmPasswordChange = async () => {
    // 检查用户是否通过 OAuth 登录（Google/Facebook/Apple）
    const isOAuthUser =
      user?.authProvider === "google" ||
      user?.authProvider === "facebook" ||
      user?.authProvider === "apple";

    // 对于 OAuth 用户首次设置密码，不需要当前密码
    // 对于邮箱登录用户或已有密码的用户，需要当前密码
    const requiresCurrentPassword = !isOAuthUser;

    // 验证输入
    if (requiresCurrentPassword && !currentPassword) {
      Alert.alert("Error", "Please enter your current password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in new password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      // 如果是 OAuth 用户首次设置密码，不发送 oldPassword（或发送 null）
      const oldPasswordToSend = requiresCurrentPassword
        ? currentPassword
        : null;
      await authAPI.changePassword(oldPasswordToSend, newPassword);
      Alert.alert(
        "Success",
        isOAuthUser
          ? "Password set successfully"
          : "Password changed successfully"
      );
      handleCancelPasswordChange();
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("user");
          navigation.replace("Login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await usersAPI.deleteAccount();
              await AsyncStorage.clear();
              navigation.replace("Login");
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };

  const handleAvatarPress = () => {
    Alert.alert("Change Avatar", "Choose how to update your avatar", [
      {
        text: "Take Photo",
        onPress: () => takePhoto(),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImage(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow camera access to take photos"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow photo access to select images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadAvatar = async (imageUri) => {
    setUploadingAvatar(true);
    try {
      // 压缩图片
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 400 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      // 使用 base64 数据（ImageManipulator 返回的 base64 已经包含前缀）
      const base64 = manipulatedImage.base64;

      // 上传到服务器（只发送 base64 字符串，不包含前缀）
      await usersAPI.updateProfile(displayName, base64, bio);

      // 更新本地状态（包含完整的数据 URI）
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          avatar: `data:image/jpeg;base64,${base64}`,
        },
      };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Error", "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
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
    <View
      style={[
        styles.container,
        { backgroundColor: dynamicTheme.colors.background },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={dynamicTheme.colors.primary}
      />
      <View
        style={[
          styles.header,
          {
            paddingTop: (insets.top + 10) / 2,
            backgroundColor: dynamicTheme.colors.primary,
          },
        ]}
      ></View>

      <ScrollView style={styles.scrollContent} {...scrollHandlers}>
        <View style={styles.content}>
          {/* Profile Header Card */}
          <Card style={styles.profileCard} mode="elevated" elevation={2}>
            <Card.Content style={styles.profileCardContent}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  onPress={createPressHandler(handleAvatarPress)}
                  disabled={uploadingAvatar}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    {user?.profile?.avatar ? (
                      <Image
                        source={{ uri: user.profile.avatar }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {user?.username?.charAt(0).toUpperCase() || "👤"}
                      </Text>
                    )}
                    {uploadingAvatar && (
                      <View style={styles.avatarOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={dynamicTheme.colors.textInverse}
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.userInfo}>
                  <Text variant="headlineSmall" style={styles.username}>
                    {user?.username || "User"}
                  </Text>
                  <Text variant="bodyMedium" style={styles.email}>
                    {user?.email || ""}
                  </Text>
                </View>
                <IconButton
                  icon="delete-outline"
                  size={24}
                  iconColor={dynamicTheme.colors.error}
                  onPress={createPressHandler(handleDeleteAccount)}
                  style={styles.deleteIconButton}
                />
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
                onPress={createPressHandler(handleUpdateProfile)}
                loading={saving}
                disabled={saving}
                style={styles.updateButton}
                buttonColor={dynamicTheme.colors.primary}
                icon="content-save"
              >
                Update Profile
              </Button>
            </Card.Content>
          </Card>

          {/* Theme Selection Card */}
          <Card style={styles.settingsCard} mode="elevated" elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Theme • 主题
              </Text>
              <Text variant="bodySmall" style={styles.sectionHint}>
                Choose your favorite color theme
              </Text>
              <View style={styles.themeContainer}>
                {Object.values(themeVariants).map((themeVariant) => (
                  <Button
                    key={themeVariant.name}
                    mode={
                      currentThemeName === themeVariant.name
                        ? "contained"
                        : "outlined"
                    }
                    onPress={createPressHandler(() =>
                      setTheme(themeVariant.name)
                    )}
                    style={[
                      styles.themeButton,
                      currentThemeName === themeVariant.name && {
                        backgroundColor: themeVariant.colors.primary,
                      },
                    ]}
                    buttonColor={
                      currentThemeName === themeVariant.name
                        ? themeVariant.colors.primary
                        : undefined
                    }
                    textColor={
                      currentThemeName === themeVariant.name
                        ? themeVariant.colors.textInverse
                        : themeVariant.colors.primary
                    }
                    icon={
                      currentThemeName === themeVariant.name
                        ? "check-circle"
                        : "circle-outline"
                    }
                  >
                    {themeVariant.displayName}
                  </Button>
                ))}
              </View>
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
                onTouchEnd={createPressHandler(handleChangePassword)}
              >
                <View style={styles.settingItemLeft}>
                  <IconButton
                    icon="lock-reset"
                    size={24}
                    iconColor={dynamicTheme.colors.primary}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={styles.settingText}>
                    Change Password
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={dynamicTheme.colors.textLight}
                  style={styles.chevronIcon}
                />
              </Surface>

              <Divider style={styles.divider} />

              <Surface
                style={styles.settingItem}
                elevation={0}
                onTouchEnd={createPressHandler(handleLogout)}
              >
                <View style={styles.settingItemLeft}>
                  <IconButton
                    icon="logout"
                    size={24}
                    iconColor={dynamicTheme.colors.warning}
                    style={styles.settingIcon}
                  />
                  <Text variant="bodyLarge" style={styles.settingText}>
                    Logout
                  </Text>
                </View>
                <IconButton
                  icon="chevron-right"
                  size={24}
                  iconColor={dynamicTheme.colors.textLight}
                  style={styles.chevronIcon}
                />
              </Surface>
            </Card.Content>
          </Card>
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
                  iconColor={dynamicTheme.colors.text}
                  onPress={handleCancelPasswordChange}
                  style={styles.modalCloseButton}
                />
              </View>
            </Card.Content>

            <Card.Content style={styles.modalContent}>
              {/* 对于 OAuth 用户首次设置密码，当前密码字段可选 */}
              {user?.authProvider === "google" ||
              user?.authProvider === "facebook" ||
              user?.authProvider === "apple" ? (
                <Text style={styles.helperText}>
                  You're using{" "}
                  {user.authProvider === "google"
                    ? "Google"
                    : user.authProvider === "facebook"
                    ? "Facebook"
                    : "Apple"}{" "}
                  login. You can set a password without entering your current
                  password.
                </Text>
              ) : null}
              <TextInput
                label={
                  user?.authProvider === "google" ||
                  user?.authProvider === "facebook" ||
                  user?.authProvider === "apple"
                    ? "Current Password (Optional)"
                    : "Current Password"
                }
                value={currentPassword}
                onChangeText={setCurrentPassword}
                mode="outlined"
                secureTextEntry
                autoCapitalize="none"
                style={styles.modalInput}
                outlineColor={theme.colors.outline}
                activeOutlineColor={theme.colors.primary}
                left={<TextInput.Icon icon="lock" />}
                placeholder={
                  user?.authProvider === "google" ||
                  user?.authProvider === "facebook" ||
                  user?.authProvider === "apple"
                    ? "Leave empty if setting password for the first time"
                    : ""
                }
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
                textColor={dynamicTheme.colors.textLight}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmPasswordChange}
                loading={changingPassword}
                disabled={changingPassword}
                style={styles.modalConfirmButton}
                buttonColor={dynamicTheme.colors.primary}
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

// 注意：样式中的颜色需要在组件内部动态设置，因为 StyleSheet.create 是静态的
const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: ChildrenTheme.spacing.xl,
    },
    loaderText: {
      color: theme.colors.textLight,
      marginTop: ChildrenTheme.spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: ChildrenTheme.spacing.sm,
      backgroundColor: theme.colors.primary,
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
      color: theme.colors.textInverse,
      marginBottom: 4,
    },
    headerSubtitle: {
      ...ChildrenTheme.typography.body,
      color: theme.colors.textInverse,
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
    deleteIconButton: {
      margin: 0,
      marginLeft: "auto", // 将图标推到最右边
    },
    avatarContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      marginRight: ChildrenTheme.spacing.md,
      ...ChildrenTheme.shadows.medium,
      overflow: "hidden",
      position: "relative",
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: "bold",
      color: theme.colors.textInverse,
    },
    avatarOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 40,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      color: theme.colors.text,
      fontWeight: "bold",
      marginBottom: ChildrenTheme.spacing.xs,
    },
    email: {
      color: theme.colors.textLight,
    },
    formCard: {
      marginBottom: ChildrenTheme.spacing.md,
      borderRadius: ChildrenTheme.borderRadius.large,
    },
    sectionTitle: {
      color: theme.colors.text,
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
      color: theme.colors.text,
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
      backgroundColor: theme.colors.card,
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
      color: theme.colors.text,
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
      color: theme.colors.textLight,
      marginBottom: ChildrenTheme.spacing.sm,
      paddingHorizontal: ChildrenTheme.spacing.xs,
      fontStyle: "italic",
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
    themeContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: ChildrenTheme.spacing.sm,
      marginTop: ChildrenTheme.spacing.md,
    },
    themeButton: {
      flex: 1,
      minWidth: 100,
      marginBottom: ChildrenTheme.spacing.xs,
    },
  });
