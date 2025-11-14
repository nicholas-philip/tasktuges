// ================== app/(auth)/index.jsx (UPDATED) ==================
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

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();
  const { isLoading, register, login, error, clearError } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  // ✅ Auto-navigate when user logs in successfully
  useEffect(() => {
    if (user && token) {
      console.log("🟡 [Login] User detected");
      console.log("   - emailVerified:", user.emailVerified);
      console.log("   - profileCompleted:", user.profileCompleted);

      // Check email verification first
      if (!user.emailVerified) {
        console.log(
          "🟡 [Login] Email not verified - navigating to verify-email"
        );
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: user.email },
        });
      } else {
        // Check if account setup is required
        const needsSetup =
          !user.profileCompleted ||
          user.account?.status === "pending" ||
          !user.account;

        if (needsSetup) {
          console.log("🟡 [Login] Email verified but account setup needed");
          router.replace("/(auth)/account-setup");
        } else {
          console.log("✅ [Login] All verified - navigating to tabs");
          router.replace("/(tabs)");
        }
      }
    }
  }, [user, token, router]);

  // ✅ Validate inputs
  const validateInputs = () => {
    clearError();

    if (isLogin) {
      if (!email.trim()) {
        Alert.alert("Error", "Email is required");
        return false;
      }
      if (!password) {
        Alert.alert("Error", "Password is required");
        return false;
      }
      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return false;
      }
    } else {
      if (!username.trim() || username.length < 3) {
        Alert.alert("Error", "Username must be at least 3 characters");
        return false;
      }
      if (!email.trim() || !email.includes("@")) {
        Alert.alert("Error", "Please enter a valid email");
        return false;
      }
      if (!password || password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return false;
      }
    }

    return true;
  };

  // ✅ Handle signup
  const handleSignup = async () => {
    if (!validateInputs()) return;

    const result = await register(username, email, password);

    console.log("📦 Registration result:", result);

    if (result.success) {
      // ✅ Redirect to email verification screen
      console.log("📧 Redirecting to email verification");
      router.push({
        pathname: "/(auth)/verify-email",
        params: { email },
      });
    } else {
      Alert.alert(
        "Registration Failed",
        result.message || "Something went wrong"
      );
    }
  };

  // ✅ Handle login
  const handleLogin = async () => {
    if (!validateInputs()) return;

    const result = await login(email, password);

    console.log("📦 Login result:", result);

    if (result.success) {
      // ✅ Navigation will happen automatically via useEffect when user/token update
      console.log("✅ [Login] Login successful, waiting for navigation...");
    } else {
      Alert.alert(
        "Login Failed",
        result.message || "Invalid email or password"
      );
    }
  };

  // ✅ Detect keyboard visibility
  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1 bg-white items-center justify-center"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
      >
        <View className="flex-1 justify-center items-center px-4">
          {!keyboardVisible && (
            <View className="absolute top-10 left-0 right-0 items-center">
              <View className="flex flex-row items-center justify-center mb-8">
                <Image
                  source={require("../../assets/images1/logo.png")}
                  className="w-16 h-16 mr-2"
                  resizeMode="contain"
                />
                <Text className="text-4xl font-extrabold text-black tracking-wide">
                  Tasktuges
                </Text>
              </View>
            </View>
          )}

          {/* 🔥 Deep black blur container */}
          <BlurView
            intensity={80}
            tint="dark"
            className="px-6 py-3 w-full mt-48 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: "rgba(0, 0, 0, 1)",
              borderWidth: 2,
              borderColor: "rgba(255, 255, 255, 0.89)",
            }}
          >
            <Text className="text-3xl font-extrabold text-white text-center mb-2">
              {isLogin ? "Welcome Back" : "Create Your Account"}
            </Text>

            <Text className="text-center text-white mb-2">
              {isLogin
                ? "Log in to continue your journey with Tasktuges."
                : "Join Tasktuges and start managing your tasks easily."}
            </Text>

            {/* 🔴 Show error if exists */}
            {error && (
              <View className="bg-red-500/20 border border-red-500 rounded-lg px-3 py-2 mb-3">
                <Text className="text-red-300 text-sm">{error}</Text>
              </View>
            )}

            {/* Username field (signup only) */}
            {!isLogin && (
              <View className="mb-2">
                <Text className="text-white font-semibold mb-2">Username</Text>
                <TextInput
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  className="rounded-2xl px-4 py-4 bg-white/10 text-white"
                  placeholderTextColor="#ffffff80"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Email field */}
            <View className="mb-2">
              <Text className="text-white font-semibold mb-2">Email</Text>
              <TextInput
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                className="rounded-2xl px-4 py-4 bg-white/10 text-white"
                placeholderTextColor="#ffffff80"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            {/* Password field */}
            <View className="mb-2">
              <Text className="text-white font-semibold mb-2">Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  className="rounded-2xl px-4 py-4 pr-12 bg-white/10 text-white"
                  placeholderTextColor="#ffffff80"
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  className="absolute right-4 top-4"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color="#ffffff"
                  />
                </TouchableOpacity>
              </View>

              {isLogin && (
                <TouchableOpacity
                  className="mt-2"
                  onPress={() =>
                    Alert.alert(
                      "Feature Coming Soon",
                      "Password reset coming soon!"
                    )
                  }
                >
                  <Text className="text-gray-300 text-right font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Confirm password (signup only) */}
            {!isLogin && (
              <View className="mb-2">
                <Text className="text-white font-semibold mb-2">
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    className="rounded-2xl px-4 py-4 pr-12 bg-white/10 text-white"
                    placeholderTextColor="#ffffff80"
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-4"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={24}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Login/Signup button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={isLogin ? handleLogin : handleSignup}
              disabled={isLoading}
              className={`py-4 rounded-full mt-3 ${
                isLoading ? "bg-gray-400" : "bg-white"
              }`}
            >
              {isLoading ? (
                <View className="flex-row justify-center items-center">
                  <ActivityIndicator color="#000" />
                  <Text className="text-black text-lg font-bold ml-2">
                    {isLogin ? "Logging in..." : "Creating account..."}
                  </Text>
                </View>
              ) : (
                <Text className="text-center text-black text-lg font-bold tracking-wide">
                  {isLogin ? "Login" : "Sign Up"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center justify-center my-3">
              <View className="flex-1 h-[1px] bg-white" />
              <Text className="mx-4 text-white font-semibold">or</Text>
              <View className="flex-1 h-[1px] bg-white" />
            </View>

            {/* Social logins */}
            <View className="flex-row justify-center gap-8">
              <TouchableOpacity
                className="bg-black p-4 rounded-full"
                onPress={() =>
                  Alert.alert("Coming Soon", "Google login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faGoogle} size={26} color="#DB4437" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-black p-4 rounded-full"
                onPress={() =>
                  Alert.alert("Coming Soon", "Facebook login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faFacebook} size={26} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-black p-4 rounded-full"
                onPress={() =>
                  Alert.alert("Coming Soon", "Apple login coming soon!")
                }
              >
                <FontAwesomeIcon icon={faApple} size={26} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Switch between Login/Signup */}
            <TouchableOpacity
              onPress={() => {
                setIsLogin(!isLogin);
                clearError();
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setUsername("");
              }}
              className="mt-2"
              disabled={isLoading}
            >
              <Text className="text-center text-white text-base font-semibold">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <Text className="text-blue-500 font-bold">
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
