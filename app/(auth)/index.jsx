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
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faGoogle,
  faFacebook,
  faApple,
} from "@fortawesome/free-brands-svg-icons";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();
  const { isLoading, register, login, error, clearError } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      if (!user.emailVerified) {
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: user.email },
        });
      } else {
        const needsSetup =
          !user.profileCompleted ||
          user.account?.status === "pending" ||
          !user.account;
        if (needsSetup) router.replace("/(auth)/account-setup");
        else router.replace("/(tabs)");
      }
    }
  }, [user, token, router]);

  const validateInputs = () => {
    clearError();
    if (isLogin) {
      if (!email.trim()) return Alert.alert("Error", "Email is required");
      if (!password.trim()) return Alert.alert("Error", "Password is required");
      if (password.length < 6)
        return Alert.alert("Error", "Password must be at least 6 characters");
    } else {
      if (!username.trim() || username.length < 3)
        return Alert.alert("Error", "Username must be at least 3 characters");
      if (!email.includes("@"))
        return Alert.alert("Error", "Enter a valid email");
      if (password.length < 6)
        return Alert.alert("Error", "Password must be at least 6 characters");
      if (password !== confirmPassword)
        return Alert.alert("Error", "Passwords do not match");
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateInputs()) return;
    const result = await register(username, email, password);

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
      }

      router.push({
        pathname: "/(auth)/verify-email",
        params: { email, code: result.verificationCode },
      });
    } else {
      Alert.alert("Registration Failed", result.message);
    }
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;
    const result = await login(email, password);

    if (!result.success) {
      Alert.alert("Login Failed", result.message);
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= HEADER - FIXED ================= */}
          <View
            className="px-7 pt-11 pb-9 w-full h-[250px]"
            style={{ backgroundColor: colors.headerBackground }}
          >
            <View className="flex-row items-center">
              <Image
                source={require("../../assets/images1/logo.png")}
                className="w-14 h-14 mr-3"
                resizeMode="contain"
              />
              <Text
                className="text-3xl font-black"
                style={{ color: colors.headerText }}
              >
                SkyPay
              </Text>
            </View>

            <Text
              className="text-3xl font-extrabold mt-16"
              style={{ color: colors.headerText }}
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            <Text
              style={{ color: colors.headerText, opacity: 0.9 }}
              className="text-base mt-2"
            >
              {isLogin
                ? "Log in to continue your journey with SkyPay."
                : "Register your account today using a valid email and password."}
            </Text>
          </View>

          {/* ================= FORM CARD ================= */}
          <View
            className="flex-1 w-full px-6 pt-8 pb-14 rounded-tl-[20px] rounded-tr-[20px] -mt-3 overflow-hidden shadow-lg"
            style={{
              backgroundColor:
                colors.authCard || colors.card || colors.background,
              borderColor: colors.authCardBorder || colors.cardBorder,
              borderWidth: 1,
              shadowColor: "#000",
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            {/* Error */}
            {error && (
              <View
                className="p-3 rounded-lg mb-4"
                style={{
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                  borderWidth: 1,
                }}
              >
                <Text style={{ color: colors.error }} className="text-sm">
                  {error}
                </Text>
              </View>
            )}

            <Text
              style={{ color: colors.text }}
              className="text-2xl font-extrabold mt-8"
            >
              {isLogin ? "Log In" : "Sign Up"}
            </Text>

            {/* ================= INPUT FIELDS ================= */}

            {/* Username (signup only) */}
            {!isLogin && (
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: colors.inputBorder,
                }}
                className="px-4 py-4 rounded-full text-base border mt-5"
              />
            )}

            {/* Email */}
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.inputBackground,
                color: colors.text,
                borderColor: colors.inputBorder,
              }}
              className="px-4 py-4 rounded-full text-base border mt-5"
            />

            {/* Password */}
            <View
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              }}
              className="rounded-full px-4 py-0 border flex-row items-center mt-5"
            >
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                style={{
                  color: colors.text,
                }}
                className="flex-1 text-base py-4"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            {!isLogin && (
              <View
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                }}
                className="rounded-full px-4 py-0 border flex-row items-center mt-5"
              >
                <TextInput
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  style={{
                    color: colors.text,
                  }}
                  className="flex-1 py-4 text-base"
                />
              </View>
            )}

            {/* Remember Me */}
            {isLogin && (
              <View className="flex-row justify-between items-center mt-6">
                <TouchableOpacity
                  onPress={() => setRememberMe(!rememberMe)}
                  className="flex-row items-center"
                >
                  <View
                    style={{
                      backgroundColor: rememberMe
                        ? colors.primary
                        : colors.inputBackground,
                      borderWidth: rememberMe ? 0 : 1,
                      borderColor: colors.inputBorder,
                    }}
                    className="w-[18px] h-[18px] rounded justify-center items-center"
                  >
                    {rememberMe && (
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    )}
                  </View>
                  <Text style={{ color: colors.text }} className="text-l ml-2">
                    Remember me
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Coming Soon", "Password reset coming soon!")
                  }
                >
                  <Text
                    style={{
                      color: colors.primary,
                    }}
                    className="font-semibold text-l"
                  >
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ================= SUBMIT BUTTON ================= */}
            <TouchableOpacity
              onPress={isLogin ? handleLogin : handleSignup}
              activeOpacity={0.85}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? colors.border : colors.primary,
              }}
              className="py-5 rounded-full items-center mt-6"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white text-base font-bold">
                  {isLogin ? "Log In" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View
                style={{
                  backgroundColor: colors.separator,
                }}
                className="flex-1 h-px"
              />
              <Text
                style={{
                  color: colors.textTertiary,
                }}
                className="mx-2.5"
              >
                or
              </Text>
              <View
                style={{
                  backgroundColor: colors.separator,
                }}
                className="flex-1 h-px"
              />
            </View>

            {/* Social Login */}
            <View className="flex-row justify-center mb-2">
              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                }}
                className="p-4 rounded-full mx-1.5"
                onPress={() =>
                  Alert.alert("Coming Soon", "Google login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faGoogle} size={20} color="#DB4437" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                }}
                className="p-4 rounded-full mx-1.5"
                onPress={() =>
                  Alert.alert("Coming Soon", "Facebook login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faFacebook} size={20} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.surface,
                }}
                className="p-4 rounded-full mx-1.5"
                onPress={() =>
                  Alert.alert("Coming Soon", "Apple login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faApple} size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Toggle Mode */}
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                clearError();
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setUsername("");
              }}
              className="mt-4"
            >
              <Text
                style={{
                  color: colors.textSecondary,
                }}
                className="text-center text-l"
              >
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={{ color: colors.primary }} className="font-bold">
                  {isLogin ? "Sign Up" : "Log In"}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
