// ================== app/(auth)/account-setup.jsx - WITH THEME ==================
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  Phone,
  MapPin,
  CreditCard,
  Briefcase,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";
import { useSetupAccount } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { Image } from "react-native";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

export default function AccountSetup() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme(); // ✅ GET THEME
  const { mutate: setupAccount, isPending: loading } = useSetupAccount();
  const { checkAuth } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  // ✅ Auto-navigate when account setup is complete
  useEffect(() => {
    console.log("🔍 [AccountSetup] Checking user state:", {
      profileCompleted: user?.profileCompleted,
      accountStatus: user?.account?.status,
      token: !!token,
    });

    if (user?.profileCompleted && user?.account?.status === "active" && token) {
      console.log(
        "✅ [AccountSetup] Account is now active - navigating to tabs"
      );
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 300);
    }
  }, [user?.profileCompleted, user?.account?.status, token, router]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Ghana",
    idType: "national_id",
    idNumber: "",
    occupation: "",
    monthlyIncome: "",
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (
          !formData.firstName?.trim() ||
          !formData.lastName?.trim() ||
          !formData.dateOfBirth
        ) {
          setError("Please fill in all personal information fields");
          return false;
        }

        const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
        if (
          !nameRegex.test(formData.firstName) ||
          !nameRegex.test(formData.lastName)
        ) {
          setError(
            "Names must contain only letters, spaces, hyphens, or apostrophes"
          );
          return false;
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.dateOfBirth)) {
          setError("Date of birth must be in YYYY-MM-DD format");
          return false;
        }

        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18 || age > 120) {
          setError("You must be between 18 and 120 years old");
          return false;
        }
        break;

      case 2:
        if (
          !formData.phoneNumber?.trim() ||
          !formData.address?.trim() ||
          !formData.city?.trim() ||
          !formData.state?.trim() ||
          !formData.country?.trim()
        ) {
          setError("Please fill in all contact information fields");
          return false;
        }

        const phoneRegex = /^\+233\d{9}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
          setError("Phone number must be in format: +233XXXXXXXXX");
          return false;
        }

        if (formData.address.length < 5 || formData.address.length > 200) {
          setError("Address must be between 5 and 200 characters");
          return false;
        }
        break;

      case 3:
        if (!formData.idType || !formData.idNumber?.trim()) {
          setError("Please provide valid identification details");
          return false;
        }

        const idRegex = /^[A-Za-z0-9]{9,13}$/;
        if (!idRegex.test(formData.idNumber)) {
          setError("ID number must be 9-13 alphanumeric characters");
          return false;
        }
        break;

      case 4:
        if (!formData.occupation?.trim() || !formData.monthlyIncome) {
          setError("Please provide employment information");
          return false;
        }

        if (
          formData.occupation.length < 2 ||
          formData.occupation.length > 100
        ) {
          setError("Occupation must be between 2 and 100 characters");
          return false;
        }

        const income = parseFloat(formData.monthlyIncome);
        if (isNaN(income) || income < 0 || income > 10000000) {
          setError("Please enter a valid monthly income (0 - 10,000,000 GHS)");
          return false;
        }
        break;

      default:
        return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    const submitData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      dateOfBirth: formData.dateOfBirth,
      phoneNumber: formData.phoneNumber.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode?.trim() || "",
      country: formData.country.trim(),
      idType: formData.idType,
      idNumber: formData.idNumber.trim(),
      occupation: formData.occupation.trim(),
      monthlyIncome: parseFloat(formData.monthlyIncome),
    };

    console.log("🚀 Submitting account setup:", submitData);

    setupAccount(submitData, {
      onSuccess: async (data) => {
        console.log("✅ Setup response:", data);

        try {
          await useAuthStore.getState().updateUserProfile({
            firstName: submitData.firstName,
            lastName: submitData.lastName,
            profileCompleted: true,
          });
          console.log("✅ User profile updated locally");

          const localAccount = useAuthStore.getState().account;
          const updatedAccount = {
            ...localAccount,
            ...data.account,
            personalInfo: {
              ...submitData,
            },
          };

          await useAuthStore.getState().updateAccount(updatedAccount);
          console.log("✅ Account updated locally with status: active");

          console.log("🔄 Refreshing auth state...");
          await checkAuth();
          console.log("✅ Auth state refreshed");
        } catch (refreshError) {
          console.error("⚠️ Error updating local storage:", refreshError);
          setTimeout(() => router.replace("/(tabs)"), 500);
        }
      },
      onError: (err) => {
        console.error("❌ Setup error:", err);
        setError(err.message || "Account setup failed");
        Alert.alert(
          "Setup Failed",
          err.message || "Failed to complete account setup. Please try again."
        );
      },
    });
  };

  const renderStep1 = () => (
    <View>
      <Text
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text }}
      >
        Personal Information
      </Text>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          First Name *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.firstName}
          onChangeText={(value) => handleInputChange("firstName", value)}
          placeholder="John"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Last Name *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.lastName}
          onChangeText={(value) => handleInputChange("lastName", value)}
          placeholder="Doe"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Date of Birth * (YYYY-MM-DD)
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.dateOfBirth}
          onChangeText={(value) => handleInputChange("dateOfBirth", value)}
          placeholder="1990-01-15"
          placeholderTextColor={colors.textTertiary}
          keyboardType="numbers-and-punctuation"
          editable={!loading}
        />
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          You must be at least 18 years old
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text }}
      >
        Contact Information
      </Text>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Phone Number * (+233...)
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange("phoneNumber", value)}
          placeholder="+233501234567"
          placeholderTextColor={colors.textTertiary}
          keyboardType="phone-pad"
          editable={!loading}
        />
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          Format: +233XXXXXXXXX (Ghana)
        </Text>
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Street Address *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.address}
          onChangeText={(value) => handleInputChange("address", value)}
          placeholder="123 Main Street, Osu"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={2}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          City *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.city}
          onChangeText={(value) => handleInputChange("city", value)}
          placeholder="Accra"
          placeholderTextColor={colors.textTertiary}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          State/Region *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.state}
          onChangeText={(value) => handleInputChange("state", value)}
          placeholder="Greater Accra"
          placeholderTextColor={colors.textTertiary}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Postal Code (Optional)
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.postalCode}
          onChangeText={(value) => handleInputChange("postalCode", value)}
          placeholder="00233"
          placeholderTextColor={colors.textTertiary}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Country *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.country}
          onChangeText={(value) => handleInputChange("country", value)}
          placeholder="Ghana"
          placeholderTextColor={colors.textTertiary}
          editable={!loading}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text }}
      >
        Identification
      </Text>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-3"
          style={{ color: colors.text }}
        >
          ID Type *
        </Text>
        <View>
          {[
            { value: "national_id", label: "National ID" },
            { value: "passport", label: "Passport" },
            { value: "drivers_license", label: "Driver's License" },
            { value: "voter_id", label: "Voter ID" },
          ].map((type) => (
            <TouchableOpacity
              key={type.value}
              className="px-4 py-3 rounded-lg border mb-2"
              style={{
                backgroundColor:
                  formData.idType === type.value ? colors.primary : colors.card,
                borderColor: colors.border,
              }}
              onPress={() => handleInputChange("idType", type.value)}
              disabled={loading}
            >
              <Text
                className="text-center font-medium"
                style={{
                  color: formData.idType === type.value ? "#fff" : colors.text,
                }}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          ID Number *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.idNumber}
          onChangeText={(value) => handleInputChange("idNumber", value)}
          placeholder="Enter your ID number (9-13 characters)"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          editable={!loading}
        />
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          Must be 9-13 alphanumeric characters
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text
        className="text-lg font-semibold mb-4"
        style={{ color: colors.text }}
      >
        Employment Information
      </Text>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Occupation *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.occupation}
          onChangeText={(value) => handleInputChange("occupation", value)}
          placeholder="e.g., Software Engineer, Teacher, Trader"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text
          className="text-sm font-medium mb-2"
          style={{ color: colors.text }}
        >
          Monthly Income (GHS) *
        </Text>
        <TextInput
          className="w-full px-4 py-3 rounded-lg border"
          style={{
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
            color: colors.text,
          }}
          value={formData.monthlyIncome}
          onChangeText={(value) => handleInputChange("monthlyIncome", value)}
          placeholder="5000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
          Enter amount in Ghana Cedis (GHS)
        </Text>
      </View>
    </View>
  );

  const steps = [
    { number: 1, title: "Personal", icon: User },
    { number: 2, title: "Contact", icon: MapPin },
    { number: 3, title: "ID", icon: CreditCard },
    { number: 4, title: "Employment", icon: Briefcase },
  ];

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View className="absolute top-10 left-0 right-0 items-center">
            <View className="flex flex-row items-center justify-center mb-8">
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
          <View className="items-center mb-8 mt-6">
            <Text
              className="text-3xl font-bold mb-2 text-center"
              style={{ color: colors.text }}
            >
              Complete Your Account Setup
            </Text>
            <Text
              className="text-center"
              style={{ color: colors.textSecondary }}
            >
              Fill in your details to activate your account
            </Text>
          </View>

          {/* Progress Steps */}
          <View className="flex-row justify-between mb-6 px-2">
            {steps.map((step) => (
              <View key={step.number} className="flex-1 items-center">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mb-2"
                  style={{
                    backgroundColor:
                      currentStep >= step.number
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <step.icon
                    size={20}
                    color={
                      currentStep >= step.number
                        ? "#FFFFFF"
                        : colors.textSecondary
                    }
                  />
                </View>
                <Text
                  className="text-xs font-medium text-center"
                  style={{
                    color:
                      currentStep >= step.number
                        ? colors.primary
                        : colors.textSecondary,
                  }}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          <Text
            className="text-center text-sm mb-6"
            style={{ color: colors.textSecondary }}
          >
            Step {currentStep} of 4
          </Text>

          {/* Error Message */}
          {error ? (
            <View
              className="rounded-lg p-4 mb-6 border"
              style={{
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              }}
            >
              <Text style={{ color: colors.error }} className="text-sm">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form Steps */}
          <View
            className="rounded-2xl shadow-lg p-6 mb-6"
            style={{ backgroundColor: colors.card }}
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row justify-between gap-4 mb-8">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center px-6 py-4 rounded-lg"
              style={{
                backgroundColor:
                  currentStep === 1 || loading ? colors.border : colors.primary,
              }}
              onPress={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft
                size={20}
                color={
                  currentStep === 1 || loading ? colors.textSecondary : "#fff"
                }
              />
              <Text
                className="ml-2 font-semibold"
                style={{
                  color:
                    currentStep === 1 || loading
                      ? colors.textSecondary
                      : "#fff",
                }}
              >
                Back
              </Text>
            </TouchableOpacity>

            {currentStep < 4 ? (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center px-6 py-4 rounded-lg shadow-lg"
                style={{
                  backgroundColor: loading ? colors.border : colors.primary,
                }}
                onPress={handleNext}
                disabled={loading}
              >
                <Text
                  className="text-white font-semibold mr-2"
                  style={{ color: "#fff" }}
                >
                  Next
                </Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 items-center justify-center px-6 py-4 rounded-lg shadow-lg"
                style={{
                  backgroundColor: loading ? colors.border : colors.success,
                }}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    className="text-white font-semibold"
                    style={{ color: "#fff" }}
                  >
                    Complete Setup
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
