// ================== app/(auth)/verify-email.jsx (UPDATED) ==================
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";

export default function VerifyEmail() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams();

  const [code, setCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState(paramEmail || "");

  const { isLoading, verifyEmail, resendVerificationCode, error, clearError } =
    useAuthStore();
  const user = useAuthStore((state) => state.user);

  // Timer countdown for resend button
  useEffect(() => {
    if (timer > 0 && !canResend) {
      const interval = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  // ✅ Auto-navigate after email is verified
  useEffect(() => {
    if (user?.emailVerified) {
      console.log("✅ [VerifyEmail] Email verified successfully");

      // Check if account setup is required
      const needsSetup =
        !user.profileCompleted ||
        user.account?.status === "pending" ||
        !user.account;

      if (needsSetup) {
        console.log("🟡 [VerifyEmail] Navigating to account-setup");
        router.replace("/(auth)/account-setup");
      } else {
        console.log("✅ [VerifyEmail] Navigating to tabs");
        router.replace("/(tabs)");
      }
    }
  }, [user?.emailVerified, user.profileCompleted, router, user.account]);

  const handleVerify = async () => {
    clearError();

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!code.trim() || code.length < 4) {
      Alert.alert("Error", "Please enter a valid verification code");
      return;
    }

    console.log("🔐 Verifying code:", code);

    const result = await verifyEmail(email, code);

    console.log("📊 Verification result:", result);

    if (result.success) {
      console.log("✅ [VerifyEmail] Verification successful");
      // ✅ Navigation happens automatically via useEffect when emailVerified updates
    } else {
      Alert.alert("Verification Failed", result.message || "Invalid code");
    }
  };

  const handleResend = async () => {
    clearError();

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setIsResending(true);
    setCanResend(false);
    setTimer(60);

    console.log("🔄 Resending code to:", email);

    const result = await resendVerificationCode(email);

    console.log("📊 Resend result:", result);

    if (result.success) {
      Alert.alert("Success", "Verification code resent to your email! 📧");
    } else {
      Alert.alert("Error", result.message || "Failed to resend code");
    }

    setIsResending(false);
  };

  const handleChangeEmail = () => {
    setCode("");
    setEmail("");
    clearError();
    router.replace("/(auth)");
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View className="px-6 pt-12 pb-8">
            <View className="items-center mb-6">
              <Image
                source={require("../../assets/images1/logo.png")}
                className="w-16 h-16 mb-4"
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-gray-800 text-center">
                Verify Email
              </Text>
            </View>

            {/* Description */}
            <Text className="text-center text-gray-600 text-base leading-6">
              We have sent a 4-digit verification code to your email
            </Text>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {/* Email Display */}
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <Ionicons name="mail" size={20} color="#3b82f6" />
                <Text className="text-gray-700 font-semibold ml-3 flex-1">
                  {email}
                </Text>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
                <View className="flex-row items-center">
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text className="text-red-700 text-sm ml-3 flex-1">
                    {error}
                  </Text>
                </View>
              </View>
            )}

            {/* Code Input */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Enter Verification Code
              </Text>
              <TextInput
                className="w-full px-4 py-4 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-center text-lg font-bold tracking-widest"
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor="#d1d5db"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading && !isResending}
              />
              <Text className="text-xs text-gray-500 mt-2 text-center">
                Check your email inbox (and spam folder)
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerify}
              disabled={isLoading || !code || code.length < 4}
              className={`w-full py-4 rounded-lg items-center mb-3 ${
                isLoading || !code || code.length < 4
                  ? "bg-gray-300"
                  : "bg-blue-600"
              }`}
            >
              {isLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white text-base font-bold ml-2">
                    Verifying...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-base font-bold">
                  Verify Email
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend Button */}
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || isResending || isLoading}
              className="w-full py-3 mb-4"
            >
              <Text
                className={`text-center font-semibold ${
                  canResend ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {isResending
                  ? "Resending..."
                  : canResend
                    ? "Resend Code"
                    : `Resend Code in ${timer}s`}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View className="h-px bg-gray-200 my-4" />

            {/* Change Email */}
            <TouchableOpacity
              onPress={handleChangeEmail}
              disabled={isLoading || isResending}
              className="py-3"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="arrow-back" size={18} color="#6366f1" />
                <Text className="text-indigo-600 font-semibold ml-2">
                  Wrong email? Go back
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View className="px-6 py-8 items-center">
            <Text className="text-xs text-gray-500 text-center">
              🔒 Code expires in 10 minutes
            </Text>
            <Text className="text-xs text-gray-500 text-center mt-2">
              Keep your verification code private
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
