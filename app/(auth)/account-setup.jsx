// ================== app/(auth)/account-setup.jsx (COMPLETE FIXED) ==================
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

export default function AccountSetup() {
  const router = useRouter();
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
        console.log("📊 Response details:", {
          hasProfileCompleted: !!data?.profileCompleted,
          profileCompleted: data?.profileCompleted,
          accountStatus: data?.account?.status,
          accountExists: !!data?.account,
        });

        // ✅ CRITICAL: Update local storage FIRST before refreshing
        console.log("💾 [onSuccess] Updating local storage...");
        try {
          // Step 1: Update user profile with profileCompleted: true
          await useAuthStore.getState().updateUserProfile({
            firstName: submitData.firstName,
            lastName: submitData.lastName,
            profileCompleted: true,
          });
          console.log("✅ User profile updated locally");

          // Step 2: Get the response account data and merge with local account
          const localAccount = useAuthStore.getState().account;
          console.log("📊 Local account before update:", localAccount);

          const updatedAccount = {
            ...localAccount,
            ...data.account, // Merge with API response (includes status: "active")
            personalInfo: {
              ...submitData,
            },
          };

          console.log("📊 Merged account data:", updatedAccount);
          console.log("   - status:", updatedAccount.status);
          console.log("   - accountNumber:", updatedAccount.accountNumber);

          // Step 3: Save merged account to store
          await useAuthStore.getState().updateAccount(updatedAccount);
          console.log("✅ Account updated locally with status: active");

          // Step 4: Refresh auth state to confirm
          console.log("🔄 Refreshing auth state...");
          const refreshedResult = await checkAuth();
          console.log("✅ Auth state refreshed");
          console.log("📊 Refreshed user state:", {
            profileCompleted: refreshedResult?.user?.profileCompleted,
            accountStatus: refreshedResult?.user?.account?.status,
          });

          // ✅ The useEffect above will handle navigation automatically
          // when user state updates and account.status === "active"
        } catch (refreshError) {
          console.error("⚠️ Error updating local storage:", refreshError);
          // If local update fails, try manual navigation
          console.log("📱 Manual navigation to tabs as fallback...");
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
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Personal Information
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          First Name *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.firstName}
          onChangeText={(value) => handleInputChange("firstName", value)}
          placeholder="John"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Last Name *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.lastName}
          onChangeText={(value) => handleInputChange("lastName", value)}
          placeholder="Doe"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Date of Birth * (YYYY-MM-DD)
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.dateOfBirth}
          onChangeText={(value) => handleInputChange("dateOfBirth", value)}
          placeholder="1990-01-15"
          placeholderTextColor="#9CA3AF"
          keyboardType="numbers-and-punctuation"
          editable={!loading}
        />
        <Text className="text-xs text-gray-500 mt-1">
          You must be at least 18 years old
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Contact Information
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Phone Number * (+233...)
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange("phoneNumber", value)}
          placeholder="+233501234567"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
          editable={!loading}
        />
        <Text className="text-xs text-gray-500 mt-1">
          Format: +233XXXXXXXXX (Ghana)
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Street Address *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.address}
          onChangeText={(value) => handleInputChange("address", value)}
          placeholder="123 Main Street, Osu"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">City *</Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.city}
          onChangeText={(value) => handleInputChange("city", value)}
          placeholder="Accra"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          State/Region *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.state}
          onChangeText={(value) => handleInputChange("state", value)}
          placeholder="Greater Accra"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Postal Code (Optional)
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.postalCode}
          onChangeText={(value) => handleInputChange("postalCode", value)}
          placeholder="00233"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Country *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.country}
          onChangeText={(value) => handleInputChange("country", value)}
          placeholder="Ghana"
          placeholderTextColor="#9CA3AF"
          editable={!loading}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Identification
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-3">
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
              className={`px-4 py-3 rounded-lg border mb-2 ${
                formData.idType === type.value
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => handleInputChange("idType", type.value)}
              disabled={loading}
            >
              <Text
                className={`text-center font-medium ${
                  formData.idType === type.value
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          ID Number *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.idNumber}
          onChangeText={(value) => handleInputChange("idNumber", value)}
          placeholder="Enter your ID number (9-13 characters)"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="characters"
          editable={!loading}
        />
        <Text className="text-xs text-gray-500 mt-1">
          Must be 9-13 alphanumeric characters
        </Text>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        Employment Information
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Occupation *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.occupation}
          onChangeText={(value) => handleInputChange("occupation", value)}
          placeholder="e.g., Software Engineer, Teacher, Trader"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          editable={!loading}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Monthly Income (GHS) *
        </Text>
        <TextInput
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
          value={formData.monthlyIncome}
          onChangeText={(value) => handleInputChange("monthlyIncome", value)}
          placeholder="5000"
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
          editable={!loading}
        />
        <Text className="text-xs text-gray-500 mt-1">
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
        className="flex-1 bg-gray-50"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View className="items-center mb-8 mt-6">
            <Text className="text-3xl font-bold text-gray-800 mb-2 text-center">
              Complete Your Account Setup
            </Text>
            <Text className="text-gray-600 text-center">
              Fill in your details to activate your account
            </Text>
          </View>

          {/* Progress Steps */}
          <View className="flex-row justify-between mb-6 px-2">
            {steps.map((step) => (
              <View key={step.number} className="flex-1 items-center">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                    currentStep >= step.number ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <step.icon
                    size={20}
                    color={currentStep >= step.number ? "#FFFFFF" : "#6B7280"}
                  />
                </View>
                <Text
                  className={`text-xs font-medium text-center ${
                    currentStep >= step.number
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {step.title}
                </Text>
              </View>
            ))}
          </View>

          <Text className="text-center text-sm text-gray-500 mb-6">
            Step {currentStep} of 4
          </Text>

          {/* Error Message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Form Steps */}
          <View className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row justify-between gap-4 mb-8">
            <TouchableOpacity
              className={`flex-1 flex-row items-center justify-center px-6 py-4 rounded-lg ${
                currentStep === 1 || loading ? "bg-gray-200" : "bg-gray-300"
              }`}
              onPress={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft
                size={20}
                color={currentStep === 1 || loading ? "#9CA3AF" : "#374151"}
              />
              <Text
                className={`ml-2 font-semibold ${
                  currentStep === 1 || loading
                    ? "text-gray-400"
                    : "text-gray-700"
                }`}
              >
                Back
              </Text>
            </TouchableOpacity>

            {currentStep < 4 ? (
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center px-6 py-4 rounded-lg shadow-lg ${
                  loading ? "bg-gray-400" : "bg-blue-600"
                }`}
                onPress={handleNext}
                disabled={loading}
              >
                <Text className="text-white font-semibold mr-2">Next</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className={`flex-1 items-center justify-center px-6 py-4 rounded-lg shadow-lg ${
                  loading ? "bg-gray-400" : "bg-green-600"
                }`}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">
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
