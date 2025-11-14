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

import { useGetAccountDetails, useUpdateAccount } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useRouter } from "expo-router";

const ProfileScreen = ({ navigation }) => {
  const { logout, user } = useAuthStore();
  const router = useRouter();
  const {
    data: accountData,
    isLoading: detailsLoading,
    error: detailsError,
  } = useGetAccountDetails();

  const updateAccountMutation = useUpdateAccount();

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState("");

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
  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  return (
    <SafeScreen>
      <ScrollView className="flex-1 bg-gray-50">
        {/* ================= HEADER ================= */}
        <View className="bg-indigo-700 px-6 py-10 rounded-b-3xl shadow-md">
          <View className="flex-row items-center gap-4 mb-6">
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-white/20 justify-center items-center">
                <Text className="text-2xl font-bold text-white">
                  {user?.username?.[0]?.toUpperCase()}
                </Text>
              </View>
            )}

            <View>
              <Text className="text-2xl font-bold text-white">
                {account?.personalInfo?.firstName}{" "}
                {account?.personalInfo?.lastName}
              </Text>
              <Text className="text-indigo-100">{user?.email}</Text>
            </View>
          </View>

          {/* Top Stats */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-indigo-100 text-xs">Account Number</Text>
              <Text className="text-white font-semibold text-sm">
                {account?.accountNumber}
              </Text>
            </View>

            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-indigo-100 text-xs">Status</Text>
              <Text className="text-white font-semibold text-sm capitalize">
                {account?.status}
              </Text>
            </View>

            <View className="flex-1 bg-white/10 rounded-xl p-3">
              <Text className="text-indigo-100 text-xs">Balance</Text>
              <Text className="text-white font-semibold text-sm">
                {account?.currency} {account?.balance}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= MAIN CONTENT ================= */}
        <View className="px-6 py-6">
          {editError ? (
            <View className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-800 text-sm">{editError}</Text>
            </View>
          ) : null}

          {/* PERSONAL INFO */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Personal Information
            </Text>

            <View className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
              <Text className="text-base font-medium">
                First Name: {account?.personalInfo?.firstName || "N/A"}
              </Text>
              <Text className="text-base font-medium">
                Last Name: {account?.personalInfo?.lastName || "N/A"}
              </Text>
              <Text className="text-base font-medium">
                DOB:{" "}
                {account?.personalInfo?.dateOfBirth
                  ? new Date(
                      account.personalInfo.dateOfBirth
                    ).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>
          </View>

          {/* CONTACT INFO */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">
                Contact Information
              </Text>

              <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                <Text className="text-indigo-600 font-semibold">
                  {isEditing ? "Cancel" : "Edit"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-200">
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
            <Text className="text-lg font-bold text-gray-900 mb-3">
              Identification
            </Text>

            <View className="bg-white rounded-xl p-4 border border-gray-200 space-y-3">
              <Text className="text-base font-medium">
                ID Type: {account?.identification?.idType || "N/A"}
              </Text>
              <Text className="text-base font-medium">
                ID Number: {account?.identification?.idNumber || "N/A"}
              </Text>

              <View className="flex-row items-center gap-2">
                <View
                  className={`w-2 h-2 rounded-full ${
                    account?.identification?.verified
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <Text className="font-medium">
                  {account?.identification?.verified
                    ? "Verified"
                    : "Not Verified"}
                </Text>
              </View>
            </View>
          </View>

          {/* EMPLOYMENT */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-900">
                Employment Information
              </Text>

              {!isEditing && (
                <TouchableOpacity onPress={() => setIsEditing(true)}>
                  <Text className="text-indigo-600 font-semibold">Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="bg-white rounded-xl p-4 border border-gray-200">
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

          {/* SAVE BUTTON */}
          {isEditing && (
            <TouchableOpacity
              onPress={handleSaveChanges}
              disabled={updateAccountMutation.isPending}
              className={`py-4 rounded-xl mb-6 ${
                updateAccountMutation.isPending
                  ? "bg-gray-400"
                  : "bg-indigo-600"
              }`}
            >
              <View className="flex-row justify-center items-center gap-2">
                {updateAccountMutation.isPending && (
                  <ActivityIndicator size="small" color="white" />
                )}
                <Text className="text-white font-bold text-center">
                  {updateAccountMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ACCOUNT INFO */}
          <View className="bg-indigo-50 rounded-xl p-4 border border-indigo-200 mb-6">
            <Text className="text-sm font-semibold text-indigo-900 mb-2">
              Account Information
            </Text>

            <Text className="text-xs text-indigo-700 mb-1">
              Type:{" "}
              <Text className="font-semibold">{account?.accountType}</Text>
            </Text>

            <Text className="text-xs text-indigo-700 mb-1">
              Verification Level:{" "}
              <Text className="font-semibold capitalize">
                {account?.verificationLevel}
              </Text>
            </Text>

            <Text className="text-xs text-indigo-700">
              Created:{" "}
              <Text className="font-semibold">
                {new Date(account?.createdAt).toLocaleDateString()}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 py-4 rounded-2xl active:opacity-80"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

export default ProfileScreen;
