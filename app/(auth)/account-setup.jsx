// ================== app/(auth)/account-setup.jsx - ENHANCED STYLING ==================
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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  User,
  MapPin,
  CreditCard,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react-native";
import { useSetupAccount } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext";

export default function AccountSetup() {
  const router = useRouter();
  const { colors } = useTheme();
  const { mutate: setupAccount, isPending: loading } = useSetupAccount();
  const { checkAuth } = useAuthStore();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("🔍 [AccountSetup] Checking user state:", {
      profileCompleted: user?.profileCompleted,
      accountStatus: user?.account?.status,
      token: !!token,
    });

    const profileCompleted = !!user?.profileCompleted;
    const accountStatus = user?.account?.status;

    if (profileCompleted && accountStatus === "active" && token) {
      console.log(
        "✅ [AccountSetup] Account is now active - navigating to tabs"
      );
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 300);
    }
  }, [user, token, router]);

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

  useEffect(() => {
    if (!user || !user.username) return;
    setFormData((prev) => {
      if (prev.firstName || prev.lastName) return prev;

      const raw = String(user.username || "").trim();
      if (!raw) return prev;

      const parts = raw.split(/\s+|[-_.]+/).filter(Boolean);
      const firstName = parts[0] || "";
      const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      return {
        ...prev,
        firstName,
        lastName,
      };
    });
  }, [user]);

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
          // Update local auth store with profile completion
          await useAuthStore.getState().updateUserProfile({
            firstName: submitData.firstName,
            lastName: submitData.lastName,
            profileCompleted: true,
          });
          console.log("✅ User profile updated locally");

          // Refresh auth state to get updated account status from API
          console.log("🔄 Refreshing auth state...");
          await checkAuth();
          console.log("✅ Auth state refreshed");

          // Navigate after a short delay to ensure state is updated
          setTimeout(() => router.replace("/(tabs)"), 500);
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

  const renderInput = (
    label,
    value,
    name,
    placeholder,
    keyboardType = "default",
    multiline = false
  ) => (
    <View className="mb-5">
      <Text
        className="text-sm font-semibold mb-2.5"
        style={{ color: colors.text }}
      >
        {label}
      </Text>
      <TextInput
        className="w-full px-4 py-3.5 rounded-xl border"
        style={{
          backgroundColor: colors.inputBackground,
          borderColor: error ? colors.error : colors.inputBorder,
          color: colors.text,
          borderWidth: 1.5,
        }}
        value={value}
        onChangeText={(v) => handleInputChange(name, v)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 2 : 1}
        editable={!loading}
      />
    </View>
  );

  const renderStep1 = () => (
    <View>
      <View className="flex-row items-center mb-6">
        <View
          className="w-1 h-8 rounded-full mr-3"
          style={{ backgroundColor: colors.primary }}
        />
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Personal Information
        </Text>
      </View>

      {renderInput("First Name", formData.firstName, "firstName", "John")}
      {renderInput("Last Name", formData.lastName, "lastName", "Doe")}
      {renderInput(
        "Date of Birth (YYYY-MM-DD)",
        formData.dateOfBirth,
        "dateOfBirth",
        "1990-01-15",
        "numbers-and-punctuation"
      )}

      <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
        ℹ️ You must be at least 18 years old
      </Text>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View className="flex-row items-center mb-6">
        <View
          className="w-1 h-8 rounded-full mr-3"
          style={{ backgroundColor: colors.primary }}
        />
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Contact Information
        </Text>
      </View>

      {renderInput(
        "Phone Number",
        formData.phoneNumber,
        "phoneNumber",
        "+233501234567",
        "phone-pad"
      )}
      <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
        Format: +233XXXXXXXXX (Ghana)
      </Text>

      {renderInput(
        "Street Address",
        formData.address,
        "address",
        "123 Main Street, Osu",
        "default",
        true
      )}
      {renderInput("City", formData.city, "city", "Accra")}
      {renderInput("State/Region", formData.state, "state", "Greater Accra")}
      {renderInput(
        "Postal Code (Optional)",
        formData.postalCode,
        "postalCode",
        "00233"
      )}
      {renderInput("Country", formData.country, "country", "Ghana")}
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View className="flex-row items-center mb-6">
        <View
          className="w-1 h-8 rounded-full mr-3"
          style={{ backgroundColor: colors.primary }}
        />
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Identification
        </Text>
      </View>

      <View className="mb-6">
        <Text
          className="text-sm font-semibold mb-3"
          style={{ color: colors.text }}
        >
          ID Type
        </Text>
        <View className="gap-2.5">
          {[
            { value: "national_id", label: "National ID" },
            { value: "passport", label: "Passport" },
            { value: "drivers_license", label: "Driver's License" },
            { value: "voter_id", label: "Voter ID" },
          ].map((type) => (
            <TouchableOpacity
              key={type.value}
              className="px-4 py-3.5 rounded-xl border-2 flex-row items-center"
              style={{
                backgroundColor:
                  formData.idType === type.value ? colors.primary : colors.card,
                borderColor:
                  formData.idType === type.value
                    ? colors.primary
                    : colors.border,
              }}
              onPress={() => handleInputChange("idType", type.value)}
              disabled={loading}
            >
              <View
                className="w-5 h-5 rounded-full items-center justify-center mr-3"
                style={{
                  backgroundColor:
                    formData.idType === type.value ? "#fff" : colors.border,
                }}
              >
                {formData.idType === type.value && (
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  />
                )}
              </View>
              <Text
                className="font-medium flex-1"
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

      {renderInput(
        "ID Number",
        formData.idNumber,
        "idNumber",
        "Enter your ID number (9-13 characters)"
      )}
      <Text className="text-xs" style={{ color: colors.textSecondary }}>
        ℹ️ Must be 9-13 alphanumeric characters
      </Text>
    </View>
  );

  const renderStep4 = () => (
    <View>
      <View className="flex-row items-center mb-6">
        <View
          className="w-1 h-8 rounded-full mr-3"
          style={{ backgroundColor: colors.primary }}
        />
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          Employment Information
        </Text>
      </View>

      {renderInput(
        "Occupation",
        formData.occupation,
        "occupation",
        "e.g., Software Engineer, Teacher"
      )}
      {renderInput(
        "Monthly Income (GHS)",
        formData.monthlyIncome,
        "monthlyIncome",
        "5000",
        "decimal-pad"
      )}

      <Text className="text-xs" style={{ color: colors.textSecondary }}>
        ℹ️ Enter amount in Ghana Cedis (GHS)
      </Text>
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-10 mt-4">
            <View className="flex-row items-center justify-center mb-5">
              <Image
                source={require("../../assets/images1/logo.png")}
                className="w-14 h-14 mr-2"
                resizeMode="contain"
              />
              <Text
                className="text-3xl font-extrabold"
                style={{ color: colors.primary }}
              >
                SkyPay
              </Text>
            </View>
            <Text
              className="text-2xl font-bold text-center mb-2"
              style={{ color: colors.text }}
            >
              Complete Your Profile
            </Text>
            <Text
              className="text-center text-sm"
              style={{ color: colors.textSecondary }}
            >
              Secure your account in 4 easy steps
            </Text>
          </View>

          {/* Progress Steps */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              {steps.map((step, idx) => (
                <React.Fragment key={step.number}>
                  <View className="items-center flex-1">
                    <View
                      className="w-14 h-14 rounded-full items-center justify-center mb-2"
                      style={{
                        backgroundColor:
                          currentStep >= step.number
                            ? colors.primary
                            : colors.border,
                      }}
                    >
                      {currentStep > step.number ? (
                        <Check size={24} color="#FFFFFF" />
                      ) : (
                        <step.icon
                          size={22}
                          color={
                            currentStep >= step.number
                              ? "#FFFFFF"
                              : colors.textSecondary
                          }
                        />
                      )}
                    </View>
                    <Text
                      className="text-xs font-semibold text-center"
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

                  {idx < steps.length - 1 && (
                    <View
                      className="h-1 mb-8 flex-1 mx-2 rounded-full"
                      style={{
                        backgroundColor:
                          currentStep > step.number
                            ? colors.primary
                            : colors.border,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </View>

            <View className="flex-row justify-center">
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.textSecondary }}
              >
                Step{" "}
                <Text style={{ color: colors.primary }}>{currentStep}</Text> of{" "}
                <Text style={{ color: colors.primary }}>4</Text>
              </Text>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View
              className="rounded-xl p-3.5 mb-6 border-l-4 flex-row items-center"
              style={{
                backgroundColor: colors.errorLight,
                borderLeftColor: colors.error,
              }}
            >
              <Text className="text-lg mr-2">⚠️</Text>
              <Text
                style={{ color: colors.error }}
                className="text-sm flex-1 font-medium"
              >
                {error}
              </Text>
            </View>
          ) : null}

          {/* Form Steps */}
          <View
            className="rounded-2xl p-6 mb-8"
            style={{
              backgroundColor: colors.card,
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center px-6 py-3.5 rounded-xl"
              style={{
                backgroundColor:
                  currentStep === 1 || loading ? colors.border : colors.primary,
              }}
              onPress={handleBack}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft
                size={18}
                color={
                  currentStep === 1 || loading ? colors.textSecondary : "#fff"
                }
              />
              <Text
                className="ml-2 font-bold text-sm"
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
                className="flex-1 flex-row items-center justify-center px-6 py-3.5 rounded-xl"
                style={{
                  backgroundColor: loading ? colors.border : colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                onPress={handleNext}
                disabled={loading}
              >
                <Text className="font-bold text-sm" style={{ color: "#fff" }}>
                  Next
                </Text>
                <ArrowRight
                  size={18}
                  color="#FFFFFF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 items-center justify-center px-6 py-3.5 rounded-xl"
                style={{
                  backgroundColor: loading ? colors.border : colors.success,
                  shadowColor: colors.success,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                }}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="font-bold text-sm" style={{ color: "#fff" }}>
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
