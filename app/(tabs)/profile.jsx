import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { useGetAccountDetails, useUpdateAccount } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../context/ThemeContext";
import SafeScreen from "../../components/SafeScreen";

const ProfileScreen = ({ navigation }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    colors,
    isDarkMode,
    themeMode,
    setDarkMode,
    setLightMode,
    setSystemMode,
  } = useTheme();

  const {
    data: accountData,
    isLoading: detailsLoading,
    error: detailsError,
  } = useGetAccountDetails();

  const updateAccountMutation = useUpdateAccount();

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const [formData, setFormData] = useState({
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    occupation: "",
    monthlyIncome: "",
  });

  useEffect(() => {
    if (accountData?.account) {
      const a = accountData.account;

      setFormData({
        phoneNumber: a.contactInfo?.phoneNumber || "",
        address: a.contactInfo?.address || "",
        city: a.contactInfo?.city || "",
        state: a.contactInfo?.state || "",
        postalCode: a.contactInfo?.postalCode || "",
        occupation: a.employment?.occupation || "",
        monthlyIncome: a.employment?.monthlyIncome?.toString() || "",
      });
    }
  }, [accountData]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please grant permission to access your media library"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please grant permission to access your camera"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert("Update Profile Picture", "Choose an option", [
      {
        text: "Take Photo",
        onPress: takePhoto,
      },
      {
        text: "Choose from Gallery",
        onPress: pickImage,
      },
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
    ]);
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setEditError("");
  };

  const handleSaveChanges = async () => {
    if (formData.phoneNumber.length < 5) {
      return setEditError("Please enter a valid phone number");
    }
    if (formData.address.length < 5) {
      return setEditError("Address must be at least 5 characters");
    }

    try {
      await updateAccountMutation.mutateAsync(formData);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      setEditError(error.message || "Failed to update profile");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            const result = await logout();
            if (result.success) {
              Alert.alert("Success", "Logged out successfully", [
                {
                  text: "OK",
                  onPress: () => {
                    router.replace("(auth)");
                  },
                },
              ]);
            } else {
              Alert.alert("Error", result.message || "Logout failed");
              setIsLoggingOut(false);
            }
          } catch (error) {
            Alert.alert("Error", error.message || "Logout failed");
            setIsLoggingOut(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleThemeChange = (theme) => {
    if (theme === "light") {
      setLightMode();
    } else if (theme === "dark") {
      setDarkMode();
    } else if (theme === "system") {
      setSystemMode();
    }
    setShowThemeMenu(false);
  };

  const getCurrentTheme = () => {
    return themeMode; // "light", "dark", or "system"
  };

  if (detailsLoading) {
    return (
      <View
        style={{ backgroundColor: colors.background }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (detailsError) {
    return (
      <View
        style={{ backgroundColor: colors.background }}
        className="flex-1 justify-center items-center px-6"
      >
        <Text style={{ color: colors.error }} className="text-center mb-4">
          Error loading profile
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("(auth)")}
          style={{ backgroundColor: colors.primary }}
          className="px-6 py-3 rounded-xl"
        >
          <Text style={{ color: colors.background }} className="font-semibold">
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const account = accountData?.account;

  const InputField = ({ label, value, editable, field, keyboard }) => (
    <View className="mb-4">
      <Text
        style={{ color: colors.textTertiary }}
        className="text-xs font-semibold uppercase mb-2"
      >
        {label}
      </Text>
      {editable ? (
        <TextInput
          style={{
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
            color: colors.text,
          }}
          className="border rounded-xl px-3 py-2 text-base"
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChangeText={(v) => handleInputChange(field, v)}
          keyboardType={keyboard}
          placeholderTextColor={colors.textTertiary}
        />
      ) : (
        <Text style={{ color: colors.text }} className="text-base font-medium">
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  return (
    <SafeScreen>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        className="flex-1"
      >
        {/* ================= HERO HEADER ================= */}
        <LinearGradient
          colors={[
            colors.primary,
            colors.primary + "dd",
            colors.primary + "bb",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 64,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          {/* Theme Dropdown Button at Top Left */}
          <TouchableOpacity
            onPress={() => setShowThemeMenu(true)}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              alignSelf: "flex-start",
              margintop: 24,
            }}
            className="flex-row items-center gap-2 px-4 py-2 rounded-full mt-3"
          >
            <Ionicons
              name={
                getCurrentTheme() === "system"
                  ? "phone-portrait"
                  : getCurrentTheme() === "dark"
                    ? "moon"
                    : "sunny"
              }
              size={18}
              color="white"
            />
            <Text className="text-white font-semibold text-sm capitalize">
              {getCurrentTheme()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="white" />
          </TouchableOpacity>

          {/* Profile Picture with Camera Icon */}
          <View className="items-center mb-6">
            <TouchableOpacity
              onPress={showImagePickerOptions}
              className="relative"
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-28 h-28 rounded-full border-4 border-white shadow-lg"
                  style={{ aspectRatio: 1, resizeMode: "cover" }}
                />
              ) : (
                <View
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  className="w-28 h-28 rounded-full justify-center items-center border-4 border-white"
                >
                  <Text className="text-5xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}

              {/* Camera Icon Badge */}
              <View
                style={{ backgroundColor: colors.background }}
                className="absolute bottom-0 right-0 rounded-full p-3 shadow-md"
              >
                <Ionicons name="camera" size={18} color={colors.primary} />
              </View>
            </TouchableOpacity>

            <Text className="text-4xl font-bold text-white mt-5">
              {account?.personalInfo?.firstName || user?.username || "User"}{" "}
              {account?.personalInfo?.lastName || ""}
            </Text>
            <Text className="text-white text-md mt-1">{user?.email}</Text>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-2">
            <View
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="flex-1 rounded-2xl p-3"
            >
              <Text className="text-white text-xs font-semibold">Account</Text>
              <Text className="text-white font-bold text-sm mt-1">
                {account?.accountNumber?.slice(-4) || "••••"}
              </Text>
            </View>

            <View
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="flex-1 rounded-2xl p-3"
            >
              <Text className="text-white text-xs font-semibold">Status</Text>
              <Text className="text-white font-bold text-sm mt-1 capitalize">
                {account?.status || "Active"}
              </Text>
            </View>

            <View
              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              className="flex-1 rounded-2xl p-3"
            >
              <Text className="text-white text-xs font-semibold">Balance</Text>
              <Text className="text-white font-bold text-sm mt-1">
                {account?.currency} {account?.balance || "0"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ================= THEME DROPDOWN MODAL ================= */}
        <Modal
          visible={showThemeMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowThemeMenu(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowThemeMenu(false)}
            className="flex-1"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                position: "absolute",
                top: 110,
                left: 20,
              }}
              className="w-64 rounded-2xl border overflow-hidden shadow-lg"
            >
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderBottomColor: colors.border,
                }}
                className="px-5 py-4 border-b"
              >
                <Text
                  style={{ color: colors.primary }}
                  className="font-bold text-base"
                >
                  Choose Theme
                </Text>
              </View>

              {[
                { value: "light", icon: "sunny", label: "Light Mode" },
                { value: "dark", icon: "moon", label: "Dark Mode" },
                {
                  value: "system",
                  icon: "phone-portrait",
                  label: "System Default",
                },
              ].map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleThemeChange(option.value)}
                  style={{
                    backgroundColor:
                      getCurrentTheme() === option.value
                        ? colors.primaryLight
                        : "transparent",
                    borderBottomColor: colors.border,
                  }}
                  className={`flex-row items-center gap-3 px-5 py-4 ${
                    index < 2 ? "border-b" : ""
                  }`}
                >
                  <Ionicons
                    name={option.icon}
                    size={22}
                    color={
                      getCurrentTheme() === option.value
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={{
                      color:
                        getCurrentTheme() === option.value
                          ? colors.primary
                          : colors.text,
                    }}
                    className="font-semibold flex-1"
                  >
                    {option.label}
                  </Text>
                  {getCurrentTheme() === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ================= MAIN CONTENT ================= */}
        <View className="px-6 py-6">
          {editError ? (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              }}
              className="mb-4 p-4 rounded-xl border flex-row items-center gap-2"
            >
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={{ color: colors.error }} className="text-sm flex-1">
                {editError}
              </Text>
            </View>
          ) : null}

          {/* PERSONAL INFO */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="person" size={20} color={colors.primary} />
              <Text
                style={{ color: colors.text }}
                className="text-lg font-bold"
              >
                Personal Information
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="rounded-2xl p-5 border shadow-sm space-y-4"
            >
              <View
                style={{ borderColor: colors.separator }}
                className="flex-row justify-between items-center pb-3 "
              >
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-medium"
                >
                  First Name
                </Text>
                <Text style={{ color: colors.text }} className="font-semibold">
                  {account?.personalInfo?.firstName || "N/A"}
                </Text>
              </View>
              <View
                style={{ borderColor: colors.separator }}
                className="flex-row justify-between items-center pb-3 "
              >
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-medium"
                >
                  Last Name
                </Text>
                <Text style={{ color: colors.text }} className="font-semibold">
                  {account?.personalInfo?.lastName || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-medium"
                >
                  Date of Birth
                </Text>
                <Text style={{ color: colors.text }} className="font-semibold">
                  {account?.personalInfo?.dateOfBirth
                    ? new Date(
                        account.personalInfo.dateOfBirth
                      ).toLocaleDateString()
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* CONTACT INFO */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="call" size={20} color={colors.primary} />
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-bold"
                >
                  Contact Information
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={{
                  backgroundColor: isEditing
                    ? colors.errorLight
                    : colors.primaryLight,
                }}
                className="px-4 py-2 rounded-lg"
              >
                <Text
                  style={{
                    color: isEditing ? colors.error : colors.primary,
                  }}
                  className="font-semibold"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="rounded-2xl p-5 border shadow-sm"
            >
              <InputField
                label="Phone Number"
                value={formData.phoneNumber}
                editable={isEditing}
                field="phoneNumber"
                keyboard="phone-pad"
              />
              <InputField
                label="Address"
                value={formData.address}
                editable={isEditing}
                field="address"
              />
              <InputField
                label="City"
                value={formData.city}
                editable={isEditing}
                field="city"
              />
              <InputField
                label="State/Region"
                value={formData.state}
                editable={isEditing}
                field="state"
              />
              <InputField
                label="Postal Code"
                value={formData.postalCode}
                editable={isEditing}
                field="postalCode"
              />
            </View>
          </View>

          {/* IDENTIFICATION */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="document" size={20} color={colors.primary} />
              <Text
                style={{ color: colors.text }}
                className="text-lg font-bold"
              >
                Identification
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="rounded-2xl p-5 border shadow-sm space-y-4"
            >
              <View
                style={{ borderColor: colors.separator }}
                className="flex-row justify-between items-center pb-3 "
              >
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-medium"
                >
                  ID Type
                </Text>
                <Text style={{ color: colors.text }} className="font-semibold">
                  {account?.identification?.idType || "N/A"}
                </Text>
              </View>
              <View
                style={{ borderColor: colors.separator }}
                className="flex-row justify-between items-center pb-3 "
              >
                <Text
                  style={{ color: colors.textSecondary }}
                  className="font-medium"
                >
                  ID Number
                </Text>
                <Text style={{ color: colors.text }} className="font-semibold">
                  {account?.identification?.idNumber || "N/A"}
                </Text>
              </View>

              <View className="flex-row items-center gap-3 pt-2">
                <View
                  style={{
                    backgroundColor: account?.identification?.verified
                      ? colors.success
                      : colors.warning,
                  }}
                  className="w-3 h-3 rounded-full"
                />
                <Text style={{ color: colors.text }} className="font-medium">
                  {account?.identification?.verified
                    ? "✓ Verified"
                    : "⏳ Pending Verification"}
                </Text>
              </View>
            </View>
          </View>

          {/* EMPLOYMENT */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="briefcase" size={20} color={colors.primary} />
              <Text
                style={{ color: colors.text }}
                className="text-lg font-bold"
              >
                Employment Information
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="rounded-2xl p-5 border shadow-sm"
            >
              <InputField
                label="Occupation"
                value={formData.occupation}
                editable={isEditing}
                field="occupation"
              />
              <InputField
                label="Monthly Income"
                value={formData.monthlyIncome}
                editable={isEditing}
                field="monthlyIncome"
                keyboard="decimal-pad"
              />
            </View>
          </View>

          {/* ACCOUNT INFO */}
          <View
            style={{
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
            }}
            className="rounded-2xl p-5 border mb-6"
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={colors.primary}
              />
              <Text
                style={{ color: colors.primary }}
                className="text-sm font-bold"
              >
                Account Information
              </Text>
            </View>

            <View className="space-y-2">
              <Text style={{ color: colors.primary }} className="text-xs">
                Type:{" "}
                <Text className="font-bold capitalize">
                  {account?.accountType || "Standard"}
                </Text>
              </Text>

              <Text style={{ color: colors.primary }} className="text-xs">
                Verification:{" "}
                <Text className="font-bold capitalize">
                  {account?.verificationLevel || "Basic"}
                </Text>
              </Text>

              <Text style={{ color: colors.primary }} className="text-xs">
                Created:{" "}
                <Text className="font-bold">
                  {account?.createdAt
                    ? new Date(account.createdAt).toLocaleDateString()
                    : "N/A"}
                </Text>
              </Text>
            </View>
          </View>

          {/* SAVE BUTTON */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleSaveChanges}
              disabled={updateAccountMutation.isPending}
              style={{
                backgroundColor: updateAccountMutation.isPending
                  ? colors.inputBorder
                  : colors.primary,
              }}
              className="py-4 rounded-xl mb-6 flex-row justify-center items-center gap-2"
            >
              {updateAccountMutation.isPending && (
                <ActivityIndicator size="small" color={colors.background} />
              )}
              <Text
                style={{ color: colors.background }}
                className="font-bold text-center"
              >
                {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            style={{
              backgroundColor: isLoggingOut
                ? colors.error + "80"
                : colors.error,
            }}
            className="py-6 rounded-full mb-6 flex-row justify-center items-center gap-2"
          >
            {isLoggingOut && <ActivityIndicator size="small" color="white" />}

            <Text className="text-white font-bold text-center text-lg">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ProfileScreen;
