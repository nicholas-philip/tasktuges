// ================== src/app/explore/onboarding.jsx - WITH THEME ==================
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

const { width, height } = Dimensions.get("window");

const APP_NAME = "SkyPay";

const ONBOARDING_STEPS = [
  {
    image: require("../../assets/images1/cartoon1.png"),
    name: "Smart Payments Made Easy",
    description:
      "Send and receive money instantly with SkyPay. Fast, secure, and designed to make your daily transactions simple.",
  },
  {
    image: require("../../assets/images1/cartoon2.png"),
    name: "Secure & User-Friendly",
    description:
      "SkyPay is built with top-level security and a clean interface, giving you a safe and effortless way to manage your money.",
  },
  {
    image: require("../../assets/images1/cartoon3.png"),
    name: "Track & Manage Finances",
    description:
      "Stay in control with real-time transaction history, spending insights, and easy tools to help you manage your finances better.",
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // ✅ GET THEME
  const { colors, isDarkMode } = useTheme();

  // Use selectors to subscribe to auth state
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Initialize auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
    };
    initAuth();
  }, []);

  // Extract navigation logic
  const navigateToNextScreen = useCallback(() => {
    if (user && token) {
      router.replace("/(auth)");
    } else {
      router.replace("/(auth)");
    }
  }, [user, token, router]);

  // Animate transition between steps
  const animateTransition = useCallback(
    (callback) => {
      setIsAnimating(true);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        callback();
        slideAnim.setValue(50);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsAnimating(false);
        });
      });
    },
    [fadeAnim, slideAnim]
  );

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      animateTransition(() => {
        setCurrentStep(currentStep + 1);
      });
    } else {
      navigateToNextScreen();
    }
  }, [currentStep, isAnimating, animateTransition, navigateToNextScreen]);

  const handleStepPress = useCallback(
    (index) => {
      if (isAnimating || index === currentStep) return;

      animateTransition(() => {
        setCurrentStep(index);
      });
    },
    [currentStep, isAnimating, animateTransition]
  );

  const currentItem = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <SafeScreen>
      <View
        className="flex-1 px-3"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header with Logo */}
        <View className="flex-row items-center justify-center mt-16 pb-4">
          <Image
            source={require("../../assets/images1/logo.png")}
            className="w-16 h-16"
            resizeMode="contain"
          />
          <Text
            className="text-4xl font-bold"
            style={{
              color: colors.text,
              fontFamily: "Poppins-Bold",
              letterSpacing: 0.5,
            }}
          >
            {APP_NAME}
          </Text>
        </View>

        {/* Skip Button */}
        <View className="items-end mt-6">
          <TouchableOpacity
            onPress={navigateToNextScreen}
            disabled={isAnimating}
            className="px-4 py-2"
            accessibilityLabel="Skip onboarding"
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text
              className="text-base font-semibold"
              style={{
                color: colors.primary,
                fontFamily: "Poppins-SemiBold",
              }}
            >
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable Main Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 20,
          }}
          bounces={false}
        >
          <Animated.View
            className="items-center w-full"
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Image */}
            <Image
              source={currentItem.image}
              style={{
                width: width * 0.9,
                height: Math.min(height * 0.35, 350),
                marginBottom: 20,
              }}
              resizeMode="contain"
            />

            {/* Progress Indicators */}
            <View className="flex-row gap-2 justify-center items-center mb-6 w-1/3">
              {ONBOARDING_STEPS.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleStepPress(index)}
                  activeOpacity={0.8}
                  disabled={isAnimating}
                  className="flex-1 h-1.5 rounded-full min-w-5"
                  style={{
                    backgroundColor:
                      currentStep >= index ? colors.primary : colors.border,
                  }}
                  accessibilityLabel={`Step ${index + 1} of ${
                    ONBOARDING_STEPS.length
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: currentStep === index }}
                />
              ))}
            </View>

            {/* Title */}
            <Text
              className="text-2xl font-bold text-center mb-4 px-4"
              style={{
                color: colors.text,
                fontFamily: "Poppins-Bold",
              }}
            >
              {currentItem.name}
            </Text>

            {/* Description */}
            <Text
              className="text-base text-center leading-6 px-6"
              style={{
                color: colors.textSecondary,
                fontFamily: "Poppins-Regular",
              }}
            >
              {currentItem.description}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={isAnimating}
          className={`py-8 rounded-full items-center mb-12 ${
            isAnimating ? "opacity-60" : ""
          }`}
          style={{
            backgroundColor: colors.text,
          }}
          accessibilityLabel={isLastStep ? "Get started" : "Next step"}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Text
            className="text-lg font-bold tracking-wide"
            style={{
              color: colors.card,
              fontFamily: "Poppins-Bold",
            }}
          >
            {isLastStep ? "Get Started" : "Try it now"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}
