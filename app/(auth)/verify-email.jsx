// ================== app/(auth)/verify-email.jsx - WITH THEME ==================
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
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

export default function VerifyEmail() {
  const router = useRouter();
  const { colors } = useTheme(); // ✅ GET THEME
  const { email: paramEmail, code: paramCode } = useLocalSearchParams();

  const [code, setCode] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState(paramEmail || "");

  const { isLoading, verifyEmail, resendVerificationCode, error, clearError } =
    useAuthStore();
  const user = useAuthStore((state) => state.user);
  const getDebugVerificationCode = useAuthStore(
    (state) => state.getDebugVerificationCode
  );

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
  }, [user, router]);

  // If a verification code was passed via params (dev mode), show it so the user can copy it
  useEffect(() => {
    if (paramCode) {
      Alert.alert(
        "Verification Code",
        `Your verification code is: ${paramCode}`,
        [
          {
            text: "Copy",
            onPress: async () => await Clipboard.setStringAsync(paramCode),
          },
          { text: "OK" },
        ]
      );
    }
  }, [paramCode]);

  // DEV: attempt to fetch the verification code from server debug endpoint and log it to Metro console
  useEffect(() => {
    let mounted = true;
    const tryFetchDebugCode = async () => {
      if (!email) return;
      try {
        const res = await getDebugVerificationCode(email);
        if (!mounted) return;
        if (res?.success && res.verificationCode) {
          console.log(
            "🛠️ [DEV] Debug verification code:",
            res.verificationCode
          );
          Alert.alert(
            "Verification Code (dev)",
            `Your verification code is: ${res.verificationCode}`,
            [
              {
                text: "Copy",
                onPress: async () =>
                  await Clipboard.setStringAsync(res.verificationCode),
              },
              { text: "OK" },
            ]
          );
        } else if (!res.success) {
          console.log(
            "🛠️ [DEV] Debug endpoint response:",
            res.message || "no code"
          );
        }
      } catch (e) {
        console.log("🛠️ [DEV] Failed to fetch debug code:", e?.message || e);
      }
    };

    tryFetchDebugCode();
    return () => {
      mounted = false;
    };
  }, [email, getDebugVerificationCode]);

  const handleVerify = async () => {
    clearError();

    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    if (!code.trim() || code.length < 6) {
      Alert.alert(
        "Error",
        "Please enter the 6-digit verification code sent to your email"
      );
      return;
    }

    console.log("🔐 Verifying code:", code);

    const result = await verifyEmail(email, code);

    console.log("📊 Verification result:", result);

    if (result.success) {
      console.log("✅ [VerifyEmail] Verification successful");
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
      if (result.verificationCode) {
        Alert.alert(
          "Verification Code",
          `Your verification code is: ${result.verificationCode}`,
          [
            {
              text: "Copy",
              onPress: async () =>
                await Clipboard.setStringAsync(result.verificationCode),
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert("Success", "Verification code resent to your email! 📧");
      }
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
        className="flex-1"
        style={{ backgroundColor: colors.background }}
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
              <Text
                className="text-3xl font-bold text-center"
                style={{ color: colors.text }}
              >
                Verify Email
              </Text>
            </View>

            {/* Description */}
            <Text
              className="text-center text-base leading-6"
              style={{ color: colors.textSecondary }}
            >
              We have sent a 6-digit verification code to your email
            </Text>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {/* Email Display */}
            <View
              className="rounded-xl p-4 mb-6 border"
              style={{
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              }}
            >
              <View className="flex-row items-center">
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text
                  className="font-semibold ml-3 flex-1"
                  style={{ color: colors.text }}
                >
                  {email}
                </Text>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View
                className="rounded-lg px-4 py-3 mb-6 border"
                style={{
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={colors.error}
                  />
                  <Text
                    className="text-sm ml-3 flex-1"
                    style={{ color: colors.error }}
                  >
                    {error}
                  </Text>
                </View>
              </View>
            )}

            {/* Code Input */}
            <View className="mb-6">
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Enter Verification Code
              </Text>
              <TextInput
                className="w-full px-4 py-4 rounded-xl text-center text-lg font-bold tracking-widest border-2"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                }}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading && !isResending}
              />
              <Text
                className="text-xs mt-2 text-center"
                style={{ color: colors.textSecondary }}
              >
                Check your email inbox (and spam folder)
              </Text>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleVerify}
              disabled={isLoading || !code || code.length < 6}
              className="w-full py-4 rounded-lg items-center mb-3"
              style={{
                backgroundColor:
                  isLoading || !code || code.length < 6
                    ? colors.textTertiary
                    : colors.primary,
              }}
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
                className="text-center font-semibold"
                style={{
                  color: canResend ? colors.primary : colors.textTertiary,
                }}
              >
                {isResending
                  ? "Resending..."
                  : canResend
                    ? "Resend Code"
                    : `Resend Code in ${timer}s`}
              </Text>
            </TouchableOpacity>

            {/* Dev: Show code button */}
            <TouchableOpacity
              onPress={async () => {
                if (!email) {
                  Alert.alert("Error", "No email available to fetch code");
                  return;
                }
                const res = await getDebugVerificationCode(email);
                console.log("🛠️ [DEV] Manual debug fetch result:", res);
                if (res?.success && res.verificationCode) {
                  Alert.alert(
                    "Verification Code (dev)",
                    `Your verification code is: ${res.verificationCode}`,
                    [
                      {
                        text: "Copy",
                        onPress: async () =>
                          await Clipboard.setStringAsync(res.verificationCode),
                      },
                      { text: "OK" },
                    ]
                  );
                } else {
                  Alert.alert("Debug", res.message || "No code available");
                }
              }}
              className="w-full py-3 mb-4"
            >
              <Text
                className="text-center font-semibold"
                style={{ color: colors.primary }}
              >
                Show code (dev)
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View
              className="h-px my-4"
              style={{ backgroundColor: colors.border }}
            />

            {/* Change Email */}
            <TouchableOpacity
              onPress={handleChangeEmail}
              disabled={isLoading || isResending}
              className="py-3"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text
                  className="font-semibold ml-2"
                  style={{ color: colors.primary }}
                >
                  Wrong email? Go back
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer Info */}
          <View className="px-6 py-8 items-center">
            <Text
              className="text-xs text-center"
              style={{ color: colors.textSecondary }}
            >
              🔒 Code expires in 10 minutes
            </Text>
            <Text
              className="text-xs text-center mt-2"
              style={{ color: colors.textSecondary }}
            >
              Keep your verification code private
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
