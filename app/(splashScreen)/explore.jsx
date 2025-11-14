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

const { width, height } = Dimensions.get("window");

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  // Use selectors to subscribe to auth state
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Initialize auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log("🎬 [Onboarding] Checking auth status");
      await checkAuth();
    };
    initAuth();
  }, []);

  // ✅ FIXED: Determine where to navigate based on auth state
  const navigateToNextScreen = useCallback(() => {
    console.log("📱 [Onboarding] Navigate based on auth state");
    console.log("   - has user:", !!user);
    console.log("   - has token:", !!token);
    console.log("   - emailVerified:", user?.emailVerified);
    console.log("   - profileCompleted:", user?.profileCompleted);
    console.log("   - accountStatus:", user?.account?.status);

    // ✅ No user or token - go to login
    if (!user || !token) {
      console.log("🔴 [Onboarding] No auth - going to login screen");
      router.replace("/(auth)/index");
      return;
    }

    // ✅ User exists but email not verified - go to verify email
    if (!user.emailVerified) {
      console.log(
        "🟡 [Onboarding] Email not verified - going to verify-email screen"
      );
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: user.email },
      });
      return;
    }

    // ✅ Email verified but account setup not complete - go to account setup
    const needsAccountSetup =
      !user.profileCompleted ||
      !user.account ||
      user.account.status === "pending";

    if (needsAccountSetup) {
      console.log(
        "🟡 [Onboarding] Account setup incomplete - going to account-setup screen"
      );
      router.replace("/(auth)/account-setup");
      return;
    }

    // ✅ Everything complete - go to main app
    console.log("🟢 [Onboarding] All checks passed - going to tabs (main app)");
    router.replace("/(tabs)");
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
      // On last step, navigate based on auth state
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
      <View className="flex-1 bg-white px-3">
        {/* Header with Logo */}
        <View className="flex-row items-center justify-center mt-16 pb-4">
          <Image
            source={require("../../assets/images1/logo.png")}
            className="w-12 h-12"
            resizeMode="contain"
          />
          <Text
            className="text-4xl font-bold text-black ml-2"
            style={{
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
              className="text-blue-500 text-base font-semibold"
              style={{ fontFamily: "Poppins-SemiBold" }}
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
                  className={`flex-1 h-1.5 rounded-full min-w-5 ${
                    currentStep >= index ? "bg-blue-500" : "bg-gray-300"
                  }`}
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
              className="text-3xl font-bold text-gray-800 text-center mb-6 px-4"
              style={{ fontFamily: "Poppins-Bold" }}
            >
              {currentItem.name}
            </Text>

            {/* Description */}
            <Text
              className="text-base text-center text-gray-700 leading-6 px-6"
              style={{ fontFamily: "Poppins-Regular" }}
            >
              {currentItem.description}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Next/Get Started Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={isAnimating}
          className={`bg-black py-8 rounded-full items-center  mb-20 ${
            isAnimating ? "opacity-60" : ""
          }`}
          accessibilityLabel={isLastStep ? "Get started" : "Next step"}
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <Text
            className="text-white text-lg font-bold tracking-wide"
            style={{ fontFamily: "Poppins-Bold" }}
          >
            {isLastStep ? "Get Started" : "Try it now"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}
