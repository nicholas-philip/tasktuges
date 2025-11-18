// ================== app/(auth)/index.jsx - IMPROVED UI ==================
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
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
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { isLoading, register, login, error, clearError } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // ----------------- Auto navigation -----------------
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

        if (needsSetup) {
          router.replace("/(auth)/account-setup");
        } else {
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, token, router]);

  // ----------------- Validations -----------------
  const validateInputs = () => {
    clearError();

    if (isLogin) {
      if (!email.trim()) return Alert.alert("Error", "Email is required");
      if (!password) return Alert.alert("Error", "Password is required");
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

  // ----------------- Handlers -----------------
  const handleSignup = async () => {
    if (!validateInputs()) return;
    const result = await register(username, email, password);

    if (result.success) {
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email },
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

  // ----------------- Keyboard listener -----------------
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 justify-center items-center px-5 w-full">
          {/* ----------------- Logo ----------------- */}
          {!keyboardVisible && (
            <View className="absolute top-10 left-0 right-0 items-center">
              <View className="flex-row items-center justify-center mb-8">
                <Image
                  source={require("../../assets/images1/logo.png")}
                  className="w-16 h-16 mr-2"
                  resizeMode="contain"
                />
                <Text
                  className="text-4xl font-extrabold tracking-wide"
                  style={{ color: colors.text }}
                >
                  SkyPay
                </Text>
              </View>
            </View>
          )}

          {/* ----------------- CARD ----------------- */}
          <BlurView
            intensity={80}
            tint={isDarkMode ? "dark" : "light"}
            className="p-6 w-full rounded-3xl overflow-hidden mb-8"
            style={{
              marginTop: keyboardVisible ? 60 : 160,
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.3)",
              borderWidth: 1.5,
              borderColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(255, 255, 255, 0.5)",
            }}
          >
            {/* ----------------- Title ----------------- */}
            <Text
              className="text-3xl font-extrabold text-center mb-1"
              style={{ color: colors.text }}
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </Text>

            <Text
              className="text-center mb-4"
              style={{ color: colors.primaryLight }}
            >
              {isLogin
                ? "Log in to continue with SkyPay"
                : "Get started with your SkyPay wallet"}
            </Text>

            {/* ----------------- Error ----------------- */}
            {error && (
              <View
                className="border rounded-lg px-3 py-2 mb-8"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  borderColor: colors.error,
                }}
              >
                <Text className="text-sm" style={{ color: colors.error }}>
                  {error}
                </Text>
              </View>
            )}

            {/* ----------------- Inputs ----------------- */}
            {!isLogin && (
              <View className="mb-3">
                <Text
                  className="font-semibold mb-2"
                  style={{ color: colors.text }}
                >
                  Username
                </Text>
                <TextInput
                  placeholder="Choose a username"
                  placeholderTextColor="#ffffff80"
                  value={username}
                  onChangeText={setUsername}
                  className="rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: colors.text,
                  }}
                />
              </View>
            )}

            {/* Email */}
            <View className="mb-3">
              <Text
                className="font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Email
              </Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor="#ffffff80"
                value={email}
                onChangeText={setEmail}
                className="rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: colors.text,
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View className="mb-2">
              <Text
                className="font-semibold mb-2"
                style={{ color: colors.text }}
              >
                Password
              </Text>

              <View className="relative">
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  className="rounded-2xl px-4 py-3 pr-12"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: colors.text,
                  }}
                />

                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#fff"
                    className="mt-3"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            {!isLogin && (
              <View className="mb-2">
                <Text
                  className="font-semibold mb-2"
                  style={{ color: colors.text }}
                >
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Re-enter your password"
                    placeholderTextColor="#ffffff80"
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    className="rounded-2xl px-4 py-3 pr-12"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: colors.text,
                    }}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-3"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#fff"
                      className="mt-3"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Forgot password */}
            {isLogin && (
              <TouchableOpacity
                className="mt-1 mb-3"
                onPress={() =>
                  Alert.alert("Coming Soon", "Password reset coming soon!")
                }
              >
                <Text
                  className="text-right font-semibold"
                  style={{ color: colors.primaryLight }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {/* ----------------- Button ----------------- */}
            <TouchableOpacity
              onPress={isLogin ? handleLogin : handleSignup}
              disabled={isLoading}
              className="py-4 rounded-full mt-1"
              style={{
                backgroundColor: colors.card,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator color={colors.text} />
                  <Text
                    className="ml-2 font-bold"
                    style={{ color: colors.text }}
                  >
                    {isLogin ? "Logging in..." : "Creating..."}
                  </Text>
                </View>
              ) : (
                <Text
                  className="text-center text-lg font-bold"
                  style={{ color: colors.text }}
                >
                  {isLogin ? "Login" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* ----------------- Divider ----------------- */}
            <View className="flex-row items-center justify-center my-4">
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: colors.textSecondary }}
              />
              <Text
                className="mx-4 font-semibold"
                style={{ color: colors.textSecondary }}
              >
                or
              </Text>
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: colors.textSecondary }}
              />
            </View>

            {/* ----------------- Social Auth ----------------- */}
            <View className="flex-row justify-center gap-8 mb-2">
              {/* Google */}
              <TouchableOpacity
                className="p-4 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                onPress={() => Alert.alert("Coming Soon", "Google login")}
              >
                <FontAwesomeIcon icon={faGoogle} size={26} color="#DB4437" />
              </TouchableOpacity>

              {/* Facebook */}
              <TouchableOpacity
                className="p-4 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                onPress={() => Alert.alert("Coming Soon", "Facebook login")}
              >
                <FontAwesomeIcon icon={faFacebook} size={26} color="#1877F2" />
              </TouchableOpacity>

              {/* Apple */}
              <TouchableOpacity
                className="p-4 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                onPress={() => Alert.alert("Coming Soon", "Apple login")}
              >
                <FontAwesomeIcon icon={faApple} size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ----------------- Switch Mode ----------------- */}
            <TouchableOpacity
              className="mt-4 mb-1"
              onPress={() => {
                setIsLogin(!isLogin);
                clearError();
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setUsername("");
              }}
            >
              <Text
                className="text-center text-base font-semibold"
                style={{ color: colors.text }}
              >
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text style={{ color: colors.primary, fontWeight: "700" }}>
                  {isLogin ? "Sign Up" : "Log In"}
                </Text>
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
