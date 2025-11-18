// app/(tabs)/deposit.jsx - WITH THEME
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
} from "react-native";
import { usePaystackInitialize, usePaystackVerify } from "../hooks/usePayment";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useTheme } from "../context/ThemeContext";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useFocusEffect } from "expo-router";

export default function DepositScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const { data: accountData } = useGetAccountDetails();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("");
  const [paystackReference, setPaystackReference] = useState(null);

  const NETWORKS = [
    { id: "MTN", name: "MTN" },
    { id: "VODAFONE", name: "Vodafone" },
    { id: "TIGO", name: "Tigo" },
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
              "Redirecting",
              `You will be redirected to Paystack to complete your deposit via ${networkToSend}.`,
              [
                { text: "Cancel", onPress: () => setStep(1) },
                { text: "OK", onPress: () => {} },
              ]
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
          "Success! 🎉",
          `Deposit of ₵${amount} completed.\n\nNew Balance: ₵${data.newBalance?.toLocaleString()}`,
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

  if (step === 2) {
    return (
      <View
        style={{ backgroundColor: colors.background }}
        className="flex-1 items-center justify-center p-6"
      >
        <View
          style={{ backgroundColor: colors.card }}
          className="rounded-2xl p-8 items-center w-full max-w-sm"
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{ color: colors.text }}
            className="text-xl font-bold mt-6"
          >
            Processing Deposit
          </Text>

          <Text
            style={{ color: colors.textSecondary }}
            className="text-center mt-2 text-sm leading-5"
          >
            You have been redirected to Paystack. Complete the deposit on your{" "}
            {network || "mobile"} line.
          </Text>

          <View className="flex-row gap-3 mt-8 w-full">
            <TouchableOpacity
              style={{ backgroundColor: colors.inputBackground }}
              className="flex-1 px-4 py-3 rounded-lg"
              onPress={() => setStep(1)}
            >
              <Text
                style={{ color: colors.text }}
                className="font-semibold text-center"
              >
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: colors.primary }}
              className="flex-1 px-4 py-3 rounded-lg"
              onPress={() => handleVerifyDeposit(paystackReference)}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text
                  style={{ color: colors.background }}
                  className="font-semibold text-center"
                >
                  Verify Deposit
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ backgroundColor: colors.background }}
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ backgroundColor: colors.background }}
          className="flex-1"
          contentContainerStyle={{ padding: 20 }}
        >
          <View className="items-center mb-8 mt-4">
            <Text
              style={{ color: colors.text }}
              className="text-4xl font-bold mb-1"
            >
              Add Funds
            </Text>

            <Text
              style={{ color: colors.textSecondary }}
              className="text-center text-md px-6 leading-5"
            >
              Deposit money into your SkyPay wallet using Mobile Money.
            </Text>
          </View>

          {error && (
            <View
              style={{
                backgroundColor: colors.errorLight,
                borderColor: colors.error,
              }}
              className="border rounded-lg p-3 mb-4"
            >
              <Text style={{ color: colors.error }} className="text-sm">
                {error}
              </Text>
            </View>
          )}

          <View style={{ backgroundColor: colors.card }} className="p-6 mb-6">
            {phoneNumber && (
              <View
                style={{
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                }}
                className="border rounded-lg p-4 mb-5"
              >
                <Text
                  style={{ color: colors.primary }}
                  className="text-xs font-bold mb-1"
                >
                  DEPOSIT TO
                </Text>
                <Text
                  style={{ color: colors.text }}
                  className="text-lg font-bold"
                >
                  {phoneNumber}
                </Text>
              </View>
            )}

            {!phoneNumber && (
              <View
                style={{
                  backgroundColor: colors.errorLight,
                  borderColor: colors.error,
                }}
                className="border rounded-lg p-4 mb-5"
              >
                <Text
                  style={{ color: colors.error }}
                  className="text-xs font-semibold mb-1"
                >
                  ACCOUNT NOT SETUP
                </Text>
                <Text style={{ color: colors.error }} className="text-xs">
                  Please complete your account setup with phone number first.
                </Text>
              </View>
            )}

            <View className="mb-5">
              <Text
                style={{ color: colors.text }}
                className="text-sm font-bold mb-2"
              >
                Amount to Deposit (GHS) *
              </Text>

              <View
                style={{
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                }}
                className="flex-row items-center border-2 rounded-lg px-4 py-3"
              >
                <Text
                  style={{ color: colors.text }}
                  className="text-2xl font-bold mr-2"
                >
                  ₵
                </Text>
                <TextInput
                  style={{
                    color: colors.text,
                    flex: 1,
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="100.00"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  editable={!!phoneNumber && !!network}
                />
              </View>

              <Text
                style={{ color: colors.textSecondary }}
                className="text-xs mt-2"
              >
                Min ₵1.00 • Max ₵10,000,000
              </Text>
            </View>

            <View
              style={{
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              }}
              className="border rounded-lg p-4 mt-6"
            >
              <Text
                style={{ color: colors.primary }}
                className="text-sm font-medium"
              >
                How it works:
              </Text>

              <Text
                style={{ color: colors.primary }}
                className="text-xs mt-2 leading-5 font-semibold"
              >
                1. Enter deposit amount{"\n"}
                2. Tap "Deposit Now"{"\n"}
                3. You'll be taken to Paystack{"\n"}
                4. Approve the deposit on your {network || "mobile"} line{"\n"}
                5. Return and tap "Verify Deposit"{"\n"}
                6. Funds appear instantly in your account
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor:
                isInitializing ||
                isVerifying ||
                !phoneNumber ||
                !network ||
                !amount
                  ? colors.inputBorder
                  : colors.success,
            }}
            className="py-4 rounded-full mb-3"
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
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color={colors.background} />
                <Text
                  style={{ color: colors.background }}
                  className="font-semibold ml-2"
                >
                  Processing...
                </Text>
              </View>
            ) : (
              <Text
                style={{ color: colors.background }}
                className="text-base font-bold text-center"
              >
                Deposit Now
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={{ color: colors.textSecondary }}
            className="text-center text-xs mb-8"
          >
            Secure deposit powered by Paystack
          </Text>

          <View
            style={{
              backgroundColor: colors.successLight,
              borderColor: colors.success,
            }}
            className="border rounded-lg p-4"
          >
            <View className="flex-row">
              <Text className="text-xl mr-3">🔒</Text>
              <View className="flex-1">
                <Text
                  style={{ color: colors.success }}
                  className="font-semibold text-sm"
                >
                  Your deposit is secure
                </Text>
                <Text
                  style={{ color: colors.success }}
                  className="text-xs mt-1 font-semibold"
                >
                  All deposits are encrypted and protected by industry-leading
                  security standards.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
