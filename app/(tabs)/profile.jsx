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
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

import { useGetAccountDetails, useUpdateAccount } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";

const ProfileScreen = ({ navigation }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
        // Here you would typically upload to your backend
        // await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
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
        // Here you would typically upload to your backend
        // await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.error(error);
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
            console.log("📱 Logout result:", result);
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

  if (detailsLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (detailsError) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-red-600 text-center mb-4">
          Error loading profile
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-indigo-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const account = accountData?.account;

  const InputField = ({ label, value, editable, field, keyboard }) => (
    <View className="mb-4">
      <Text className="text-xs font-semibold text-gray-600 uppercase mb-2">
        {label}
      </Text>
      {editable ? (
        <TextInput
          className="border border-gray-300 rounded-xl px-3 py-2 text-base"
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChangeText={(v) => handleInputChange(field, v)}
          keyboardType={keyboard}
          placeholderTextColor="#999"
        />
      ) : (
        <Text className="text-base text-gray-900 font-medium">
          {value || "Not provided"}
        </Text>
      )}
    </View>
  );

  return (
    <SafeScreen>
      <ScrollView className="flex-1 bg-gray-50">
        {/* ================= HERO HEADER ================= */}
        <LinearGradient
          colors={["#4F46E5", "#6366F1", "#818CF8"]}
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
                <View className="w-28 h-28 rounded-full bg-white/20 justify-center items-center border-4 border-white">
                  <Text className="text-5xl font-bold text-white">
                    {user?.username?.[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}

              {/* Camera Icon Badge */}
              <View className="absolute bottom-0 right-0 bg-white rounded-full p-3 shadow-md">
                <Ionicons name="camera" size={18} color="#4F46E5" />
              </View>
            </TouchableOpacity>

            <Text className="text-2xl font-bold text-white mt-5">
              {account?.personalInfo?.firstName || user?.username || "User"}{" "}
              {account?.personalInfo?.lastName || ""}
            </Text>
            <Text className="text-indigo-100 text-sm mt-1">{user?.email}</Text>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <Text className="text-indigo-100 text-xs font-semibold">
                Account
              </Text>
              <Text className="text-white font-bold text-sm mt-1">
                {account?.accountNumber?.slice(-4) || "••••"}
              </Text>
            </View>

            <View className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <Text className="text-indigo-100 text-xs font-semibold">
                Status
              </Text>
              <Text className="text-white font-bold text-sm mt-1 capitalize">
                {account?.status || "Active"}
              </Text>
            </View>

            <View className="flex-1 bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <Text className="text-indigo-100 text-xs font-semibold">
                Balance
              </Text>
              <Text className="text-white font-bold text-sm mt-1">
                {account?.currency} {account?.balance || "0"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ================= MAIN CONTENT ================= */}
        <View className="px-6 py-6">
          {editError ? (
            <View className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200 flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text className="text-red-800 text-sm flex-1">{editError}</Text>
            </View>
          ) : null}

          {/* PERSONAL INFO */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Ionicons name="person" size={20} color="#4F46E5" />
              <Text className="text-lg font-bold text-gray-900">
                Personal Information
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">First Name</Text>
                <Text className="font-semibold text-gray-900">
                  {account?.personalInfo?.firstName || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Last Name</Text>
                <Text className="font-semibold text-gray-900">
                  {account?.personalInfo?.lastName || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600 font-medium">Date of Birth</Text>
                <Text className="font-semibold text-gray-900">
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
                <Ionicons name="call" size={20} color="#4F46E5" />
                <Text className="text-lg font-bold text-gray-900">
                  Contact Information
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg ${
                  isEditing ? "bg-red-100" : "bg-indigo-100"
                }`}
              >
                <Text
                  className={`font-semibold ${
                    isEditing ? "text-red-600" : "text-indigo-600"
                  }`}
                >
                  {isEditing ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
              <Ionicons name="document" size={20} color="#4F46E5" />
              <Text className="text-lg font-bold text-gray-900">
                Identification
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">ID Type</Text>
                <Text className="font-semibold text-gray-900">
                  {account?.identification?.idType || "N/A"}
                </Text>
              </View>
              <View className="flex-row justify-between items-center pb-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">ID Number</Text>
                <Text className="font-semibold text-gray-900">
                  {account?.identification?.idNumber || "N/A"}
                </Text>
              </View>

              <View className="flex-row items-center gap-3 pt-2">
                <View
                  className={`w-3 h-3 rounded-full ${
                    account?.identification?.verified
                      ? "bg-green-500"
                      : "bg-yellow-500"
                  }`}
                />
                <Text className="font-medium text-gray-900">
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
              <Ionicons name="briefcase" size={20} color="#4F46E5" />
              <Text className="text-lg font-bold text-gray-900">
                Employment Information
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
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
              backgroundColor: "#F0F4FF",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "#E0E7FF",
              marginBottom: 24,
            }}
          >
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="shield-checkmark" size={18} color="#4F46E5" />
              <Text className="text-sm font-bold text-indigo-900">
                Account Information
              </Text>
            </View>

            <View className="space-y-2">
              <Text className="text-xs text-indigo-700">
                Type:{" "}
                <Text className="font-bold capitalize">
                  {account?.accountType || "Standard"}
                </Text>
              </Text>

              <Text className="text-xs text-indigo-700">
                Verification:{" "}
                <Text className="font-bold capitalize">
                  {account?.verificationLevel || "Basic"}
                </Text>
              </Text>

              <Text className="text-xs text-indigo-700">
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
              className={`py-4 rounded-xl mb-6 flex-row justify-center items-center gap-2 ${
                updateAccountMutation.isPending
                  ? "bg-gray-300"
                  : "bg-indigo-600"
              }`}
            >
              {updateAccountMutation.isPending && (
                <ActivityIndicator size="small" color="white" />
              )}
              <Text className="text-white font-bold text-center">
                {updateAccountMutation.isPending ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isLoggingOut}
            className={`py-4 rounded-xl mb-6 flex-row justify-center items-center gap-2 ${
              isLoggingOut ? "bg-red-400" : "bg-red-600"
            }`}
          >
            {isLoggingOut && <ActivityIndicator size="small" color="white" />}
            <Ionicons name="log-out" size={18} color="white" />
            <Text className="text-white font-bold text-center">
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ProfileScreen;
