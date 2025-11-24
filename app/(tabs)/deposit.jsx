// app/(tabs)/deposit.jsx - WITH STICKY HEADER
import React, { useState } from "react";
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
  Linking,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePaystackInitialize, usePaystackVerify } from "../hooks/usePayment";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useTheme } from "../context/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import StickyHeader from "../../components/StickyHeader";
import { useFocusEffect } from "expo-router";

export default function DepositScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { data: accountData } = useGetAccountDetails();
  const screenWidth = Dimensions.get("window").width;

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("");
  const [paystackReference, setPaystackReference] = useState(null);

  const NETWORKS = [
    { id: "MTN", name: "MTN", color: "#FFCC00" },
    { id: "VODAFONE", name: "Vodafone", color: "#FF0000" },
    { id: "TIGO", name: "Tigo", color: "#FFC72C" },
  ];

  const { mutate: initializeDeposit, isPending: isInitializing } =
    usePaystackInitialize();
  const { mutate: verifyDeposit, isPending: isVerifying } = usePaystackVerify();

  useFocusEffect(
    React.useCallback(() => {
      if (accountData?.account) {
        const account = accountData.account;

        if (account.contactInfo?.phoneNumber) {
          setPhoneNumber(account.contactInfo.phoneNumber);
        }

        let storedNetwork =
          account.contactInfo?.network || account.metadata?.network;

        if (typeof storedNetwork === "number") {
          const networkArray = ["MTN", "VODAFONE", "TIGO"];
          storedNetwork = networkArray[storedNetwork];
        }

        if (
          storedNetwork &&
          ["MTN", "VODAFONE", "TIGO"].includes(storedNetwork)
        ) {
          setNetwork(storedNetwork);
        } else {
          setNetwork("MTN");
        }
      }
    }, [accountData])
  );

  const validateInput = () => {
    setError("");

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (parseFloat(amount) > 10000000) {
      setError("Amount cannot exceed ₵10,000,000");
      return false;
    }

    if (!phoneNumber) {
      setError("Phone number not found. Please complete your account setup.");
      return false;
    }

    if (!network || !["MTN", "VODAFONE", "TIGO"].includes(network)) {
      setError("Network not properly set. Please contact support.");
      return false;
    }

    return true;
  };

  const handleInitializeDeposit = () => {
    if (!validateInput()) return;

    const amountInKobo = Math.round(parseFloat(amount) * 100);

    let networkToSend = network;
    if (typeof networkToSend === "number") {
      const networkArray = ["MTN", "VODAFONE", "TIGO"];
      networkToSend = networkArray[networkToSend];
    }

    initializeDeposit(
      {
        amount: amountInKobo,
        email: user?.email,
        phoneNumber,
        network: networkToSend,
        paymentMethod: "mobile_money",
        description: `Deposit to account`,
      },
      {
        onSuccess: (data) => {
          if (data.authorizationUrl) {
            setPaystackReference(data.reference);
            setStep(2);

            Linking.openURL(data.authorizationUrl).catch(() => {
              Alert.alert("Error", "Could not open payment page.");
            });

            Alert.alert(
              "Redirecting to Paystack",
              `Complete your deposit via ${networkToSend}.`,
              [{ text: "OK", onPress: () => {} }]
            );
          }
        },
        onError: (err) => {
          Alert.alert("Error", err.message || "Deposit initialization failed");
        },
      }
    );
  };

  const handleVerifyDeposit = (reference) => {
    verifyDeposit(reference, {
      onSuccess: (data) => {
        Alert.alert(
          "✅ Success!",
          `Deposit of ₵${parseFloat(amount).toLocaleString()} completed.\n\nNew Balance: ₵${data.newBalance?.toLocaleString()}`,
          [
            {
              text: "Done",
              onPress: () => {
                resetForm();
              },
            },
          ]
        );
      },
      onError: (err) => {
        Alert.alert(
          "Verification Failed",
          "We couldn't verify your deposit. Please try again.",
          [
            {
              text: "Retry",
              onPress: () => handleVerifyDeposit(reference),
            },
            {
              text: "Back",
              onPress: () => setStep(1),
            },
          ]
        );
      },
    });
  };

  const resetForm = () => {
    setAmount("");
    setError("");
    setStep(1);
    setPaystackReference(null);
  };

  // ================== PROCESSING STEP ==================
  if (step === 2) {
    return (
      <View
        style={{ backgroundColor: colors.background }}
        className="flex-1 items-center justify-center p-6"
      >
        <View
          style={{ backgroundColor: colors.card }}
          className="rounded-3xl p-8 items-center w-full max-w-sm"
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{ color: colors.text }}
            className="text-2xl font-bold mt-6"
          >
            Processing Deposit
          </Text>

          <Text
            style={{ color: colors.textSecondary }}
            className="text-center mt-3 text-base leading-6"
          >
            Complete payment on your{" "}
            <Text style={{ fontWeight: "bold", color: colors.primary }}>
              {network || "mobile"}
            </Text>{" "}
            line via Paystack.
          </Text>

          <View
            className="mt-8 p-4 rounded-xl w-full"
            style={{
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
              borderWidth: 2,
            }}
          >
            <Text
              style={{ color: colors.primary }}
              className="text-sm font-bold mb-2"
            >
              💡 WHAT TO DO:
            </Text>
            <Text
              style={{ color: colors.primary }}
              className="text-xs leading-5"
            >
              • Complete payment in the browser{"\n"}• Return to this app{"\n"}•
              Tap "Verify Deposit" below
            </Text>
          </View>

          <View className="flex-row gap-3 mt-8 w-full">
            <TouchableOpacity
              style={{ backgroundColor: colors.inputBackground }}
              className="flex-1 px-4 py-3 rounded-xl"
              onPress={() => setStep(1)}
            >
              <Text
                style={{ color: colors.text }}
                className="font-bold text-center text-base"
              >
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: isVerifying
                  ? colors.textTertiary
                  : colors.success,
              }}
              className="flex-1 px-4 py-3 rounded-xl flex-row items-center justify-center"
              onPress={() => handleVerifyDeposit(paystackReference)}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white font-bold text-base ml-2">
                    Verifying...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text className="text-white font-bold text-base">
                    Verify Deposit
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ================== MAIN DEPOSIT FORM ==================
  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ backgroundColor: colors.background, flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <StickyHeader title="Add Funds" showBack={true} />

        <ScrollView
          style={{ backgroundColor: colors.background }}
          className="flex-1"
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text
            style={{ color: colors.textSecondary }}
            className="text-base leading-6 px-5 mb-6 mt-6"
          >
            Deposit money into your wallet using Mobile Money.
          </Text>

          {/* Error Alert */}
          {error && (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              }}
              className="mx-4 border-2 rounded-xl p-4 mb-6 flex-row"
            >
              <Ionicons
                name="alert-circle"
                size={20}
                color={colors.error}
                style={{ marginRight: 10 }}
              />
              <Text
                style={{ color: colors.error }}
                className="text-sm font-semibold flex-1"
              >
                {error}
              </Text>
            </View>
          )}

          {/* Deposit To Phone Card */}
          {phoneNumber ? (
            <View
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              className="mx-4 rounded-2xl p-6 mb-6"
            >
              <Text
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
                className="text-xs font-bold mb-2 tracking-wide"
              >
                DEPOSIT TO
              </Text>
              <Text style={{ color: "#fff" }} className="text-3xl font-bold">
                {phoneNumber}
              </Text>
              <Text
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
                className="text-sm mt-2"
              >
                Network: <Text className="font-bold">{network}</Text>
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              }}
              className="mx-4 border-2 rounded-xl p-4 mb-6 flex-row"
            >
              <Ionicons
                name="warning"
                size={20}
                color={colors.error}
                style={{ marginRight: 10 }}
              />
              <View className="flex-1">
                <Text
                  style={{ color: colors.error }}
                  className="font-bold text-sm"
                >
                  Account Setup Required
                </Text>
                <Text style={{ color: colors.error }} className="text-xs mt-1">
                  Please complete your account setup with a phone number first.
                </Text>
              </View>
            </View>
          )}

          {/* Main Form Card */}
          <View
            style={{ backgroundColor: colors.card }}
            className="mx-4 rounded-2xl p-6 mb-6"
          >
            {/* Amount Input */}
            <View className="mb-6">
              <Text
                style={{ color: colors.text }}
                className="text-base font-bold mb-3"
              >
                Deposit Amount
              </Text>

              <View
                style={{
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                }}
                className="px-4 py-5 border rounded-2xl flex-row items-center"
              >
                <Text
                  style={{ color: colors.text }}
                  className="text-3xl font-bold mr-2"
                >
                  ₵
                </Text>

                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="100.00"
                  placeholderTextColor={colors.textTertiary}
                  style={{
                    flex: 1,
                    color: colors.text,
                    fontSize: 26,
                    fontWeight: "600",
                  }}
                />
              </View>

              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs mt-3 font-semibold"
              >
                Min ₵1.00 • Max ₵10,000,000
              </Text>
            </View>

            {/* How It Works */}
            <View
              style={{
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              }}
              className="border-2 rounded-xl p-4"
            >
              <View className="flex-row items-center mb-3">
                <Ionicons
                  name="help-circle"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ color: colors.primary }}
                  className="text-base font-bold"
                >
                  How It Works
                </Text>
              </View>

              <Text
                style={{ color: colors.primary }}
                className="text-xs leading-6 font-semibold"
              >
                {`1️⃣ Enter deposit amount\n2️⃣ Tap "Deposit Now"\n3️⃣ Complete payment on Paystack\n4️⃣ Return and verify\n5️⃣ Funds appear instantly`}
              </Text>
            </View>
          </View>

          {/* Deposit Button */}
          <View className="mx-4 mb-6" style={{ color: colors.text }}>
            <TouchableOpacity
              style={{
                backgroundColor:
                  isInitializing ||
                  isVerifying ||
                  !phoneNumber ||
                  !network ||
                  !amount
                    ? colors.textTertiary
                    : colors.success,
              }}
              className="py-6 rounded-full flex-row items-center justify-center"
              onPress={handleInitializeDeposit}
              disabled={
                isInitializing ||
                isVerifying ||
                !phoneNumber ||
                !network ||
                !amount
              }
            >
              {isInitializing ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text
                    style={{ color: colors.text }}
                    className="font-bold text-lg ml-2"
                  >
                    Processing...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="arrow-down-circle"
                    size={24}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: "#fff" }} className="text-lg font-bold">
                    Deposit Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text
            style={{ color: colors.textSecondary }}
            className="text-center text-xs mb-8 px-4"
          >
            🔒 Secure deposit powered by Paystack
          </Text>

          {/* Security Info */}
          <View
            style={{
              backgroundColor: colors.successLight,
              borderColor: colors.success,
            }}
            className="mx-4 border-2 rounded-xl p-4 mb-6"
          >
            <View className="flex-row">
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={colors.success}
                style={{ marginRight: 12 }}
              />
              <View className="flex-1">
                <Text
                  style={{ color: colors.success }}
                  className="font-bold text-base"
                >
                  Your Deposit is Secure
                </Text>
                <Text
                  style={{ color: colors.success }}
                  className="text-xs mt-2 leading-5"
                >
                  ✓ End-to-end encryption\n✓ Industry-leading security\n✓ PCI
                  DSS compliant
                </Text>
              </View>
            </View>
          </View>

          {/* Benefits */}
          <View className="mx-4 mb-12">
            <Text
              style={{ color: colors.text }}
              className="text-base font-bold mb-4"
            >
              Why Deposit?
            </Text>

            <View className="space-y-3">
              {[
                { icon: "flash", text: "Instant funding" },
                { icon: "wallet", text: "Pay bills & shop" },
                { icon: "gift", text: "Earn rewards" },
              ].map((item, idx) => (
                <View key={idx} className="flex-row items-center">
                  <View
                    style={{ backgroundColor: colors.primaryLight }}
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <Text
                    style={{ color: colors.text }}
                    className="text-sm font-semibold"
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
