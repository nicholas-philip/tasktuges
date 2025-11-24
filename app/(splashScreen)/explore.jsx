import React, { useState, useCallback, useRef } from "react";
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
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

// Static data moved outside component
const APP_NAME = "Tasktuges";

const ONBOARDING_STEPS = [
  {
    image: require("../../assets/images1/cartoon1.png"),
    name: "Team Up For Success",
    description:
      "Team up for success! Learning and growing are easier when we work as a team. Share knowledge, support one another, and watch how collaboration leads to amazing results.",
  },
  {
    image: require("../../assets/images1/cartoon2.png"),
    name: "User-Friendly At Its Core",
    description:
      "Our app is designed with you in mind. Enjoy a seamless experience with intuitive navigation and easy-to-use features that make managing your tasks a breeze.",
  },
  {
    image: require("../../assets/images1/cartoon3.png"),
    name: "Easy Tasks Creation",
    description:
      "Creating tasks has never been easier! Quickly add, organize, and prioritize your to-dos so you can stay focused and productive throughout your day.",
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const { user, token } = useAuthStore();

  // Extract navigation logic
  const navigateToNextScreen = useCallback(() => {
    if (user && token) {
      router.replace("/(tabs)");
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
    <View
      className="flex-1 px-3"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header with Logo */}
      <View className="flex-row items-center justify-center mt-16 pb-4">
        <Image
          source={require("../../assets/images1/logo.png")}
          className="w-12 h-12"
          resizeMode="contain"
        />
        <Text
          className="text-4xl font-bold ml-2"
          style={{
            fontFamily: "Poppins-Bold",
            letterSpacing: 0.5,
            color: colors.text,
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
            style={{ fontFamily: "Poppins-SemiBold", color: colors.primary }}
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
          <View className="flex-row justify-center items-center mb-6 w-1/3">
            {ONBOARDING_STEPS.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleStepPress(index)}
                activeOpacity={0.8}
                disabled={isAnimating}
                className="flex-1 h-1.5 rounded-full min-w-5 mx-1"
                style={{
                  backgroundColor:
                    currentStep >= index ? colors.primary : colors.separator,
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
            className="text-3xl font-bold text-center mb-4 px-4"
            style={{ fontFamily: "Poppins-Bold", color: colors.text }}
          >
            {currentItem.name}
          </Text>

          {/* Description */}
          <Text
            className="text-base text-center leading-6 px-6"
            style={{
              fontFamily: "Poppins-Regular",
              color: colors.textSecondary,
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
        className={`py-5 rounded-full items-center mb-6 mt-4 ${
          isAnimating ? "opacity-60" : ""
        }`}
        style={{ backgroundColor: colors.primary }}
        accessibilityLabel={isLastStep ? "Get started" : "Next step"}
        accessibilityRole="button"
        activeOpacity={0.8}
      >
        <Text
          className="text-lg font-bold tracking-wide"
          style={{ fontFamily: "Poppins-Bold", color: colors.background }}
        >
          {isLastStep ? "Get Started" : "Try it now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
