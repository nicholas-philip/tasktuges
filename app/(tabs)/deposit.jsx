// app/(tabs)/deposit.jsx (FIXED - Network as String)
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
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useFocusEffect } from "expo-router";

export default function DepositScreen() {
  const { user } = useAuthStore();
  const { data: accountData } = useGetAccountDetails();

  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("");
  const [paystackReference, setPaystackReference] = useState(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const NETWORKS = [
    { id: "MTN", name: "MTN" },
    { id: "VODAFONE", name: "Vodafone" },
    { id: "TIGO", name: "Tigo" },
  ];

  const { mutate: initializePaystack, isPending: isInitializing } =
    usePaystackInitialize();
  const { mutate: verifyPayment, isPending: isVerifying } = usePaystackVerify();

  // ================== AUTO-LOAD ACCOUNT INFO ON SCREEN FOCUS ==================
  useFocusEffect(
    React.useCallback(() => {
      if (accountData?.account) {
        const account = accountData.account;

        console.log("📱 Full Account Data:", JSON.stringify(account, null, 2));

        // Get phone number from account
        if (account.contactInfo?.phoneNumber) {
          console.log("✅ Phone loaded:", account.contactInfo.phoneNumber);
          setPhoneNumber(account.contactInfo.phoneNumber);
        } else {
          console.log("❌ Phone NOT found in contactInfo");
        }

        // Extract network from account and ensure it's a string
        let storedNetwork =
          account.contactInfo?.network || account.metadata?.network;

        console.log(
          "🌐 Raw network value:",
          storedNetwork,
          "Type:",
          typeof storedNetwork
        );

        // Fix: Convert number to network string if needed
        if (typeof storedNetwork === "number") {
          const networkArray = ["MTN", "VODAFONE", "TIGO"];
          storedNetwork = networkArray[storedNetwork];
          console.log("🔄 Converted network index to string:", storedNetwork);
        }

        if (
          storedNetwork &&
          ["MTN", "VODAFONE", "TIGO"].includes(storedNetwork)
        ) {
          console.log("✅ Network auto-filled:", storedNetwork);
          setNetwork(storedNetwork);
        } else {
          console.log("⚠️ Network not valid, defaulting to MTN");
          setNetwork("MTN");
        }
      }
    }, [accountData])
  );

  // ================== VALIDATION ==================
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

  // ================== INITIALIZE PAYMENT ==================
  const handleInitializePayment = () => {
    if (!validateInput()) return;

    const amountInKobo = Math.round(parseFloat(amount) * 100);

    // ENSURE NETWORK IS A STRING
    let networkToSend = network;
    if (typeof networkToSend === "number") {
      const networkArray = ["MTN", "VODAFONE", "TIGO"];
      networkToSend = networkArray[networkToSend];
    }

    console.log("💳 Sending deposit request:", {
      amount: amountInKobo,
      phoneNumber,
      network: networkToSend,
      networkType: typeof networkToSend,
    });

    initializePaystack(
      {
        amount: amountInKobo,
        email: user?.email,
        phoneNumber,
        network: networkToSend, // Send as string
        paymentMethod: "mobile_money",
        description: `Deposit to account`,
      },
      {
        onSuccess: (data) => {
          console.log("✅ Paystack initialized:", data.reference);
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
                {
                  text: "OK",
                  onPress: () => {
                    console.log("📱 User acknowledged redirection");
                  },
                },
              ]
            );
          }
        },

        onError: (err) => {
          console.error("❌ Paystack init error:", err.message);
          Alert.alert("Error", err.message || "Deposit initialization failed");
        },
      }
    );
  };

  // ================== VERIFY PAYMENT ==================
  const handleVerifyPayment = (reference) => {
    console.log("🔄 Verifying deposit payment:", reference);

    verifyPayment(reference, {
      onSuccess: (data) => {
        console.log("✅ Deposit verified successfully");
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
        console.error("❌ Verification error:", err.message);
        Alert.alert(
          "Verification Failed",
          "We couldn't verify your deposit. Please try again.",
          [
            {
              text: "Retry",
              onPress: () => handleVerifyPayment(reference),
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

  // ================== RESET FORM ==================
  const resetForm = () => {
    setAmount("");
    setError("");
    setStep(1);
    setPaystackReference(null);
  };

  // ================== STEP 2 SCREEN (PROCESSING) ==================
  if (step === 2) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center w-full max-w-sm">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-xl font-bold text-gray-800 mt-6">
            Processing Deposit
          </Text>

          <Text className="text-gray-600 text-center mt-2 text-sm leading-5">
            You have been redirected to Paystack. Complete the deposit on your{" "}
            {network} line.
          </Text>

          <View className="flex-row gap-3 mt-8 w-full">
            <TouchableOpacity
              className="flex-1 px-4 py-3 bg-gray-300 rounded-lg"
              onPress={() => setStep(1)}
            >
              <Text className="text-gray-800 font-semibold text-center">
                Back
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 px-4 py-3 bg-blue-600 rounded-lg"
              onPress={() => handleVerifyPayment(paystackReference)}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Verify Payment
                </Text>
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
        className="flex-1 bg-gray-50"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View className="items-center mb-8 mt-4">
            <Text className="text-2xl font-bold text-gray-800 mb-1">
              Add Funds
            </Text>

            <Text className="text-gray-600 text-center text-sm px-6 leading-5">
              Deposit money into your SkyPay wallet using Mobile Money.
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* FORM */}
          <View className="bg-white rounded-2xl shadow p-6 mb-6">
            {/* Phone Number Display */}
            {phoneNumber && (
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
                <Text className="text-xs text-blue-600 font-semibold mb-1">
                  DEPOSIT TO
                </Text>
                <Text className="text-lg font-bold text-gray-800">
                  {phoneNumber}
                </Text>
              </View>
            )}

            {!phoneNumber && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                <Text className="text-xs text-red-600 font-semibold mb-1">
                  ACCOUNT NOT SETUP
                </Text>
                <Text className="text-xs text-red-700">
                  Please complete your account setup with phone number first.
                </Text>
              </View>
            )}

            {/* Network Selection */}
            {phoneNumber && (
              <View className="mb-5">
                <Text className="text-sm font-medium text-gray-700 mb-3">
                  Mobile Network *
                </Text>
                <View className="flex-row gap-3">
                  {NETWORKS.map((net) => (
                    <TouchableOpacity
                      key={net.id}
                      className={`flex-1 py-3 px-3 rounded-lg border-2 items-center ${
                        network === net.id
                          ? "bg-blue-100 border-blue-600"
                          : "bg-white border-gray-300"
                      }`}
                      onPress={() => setNetwork(net.id)}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          network === net.id ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {net.name}
                      </Text>
                      {network === net.id && (
                        <Text className="text-lg mt-1">✅</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Amount */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Amount to Deposit (GHS) *
              </Text>

              <View className="flex-row items-center border-2 border-gray-300 rounded-lg px-4 py-3">
                <Text className="text-2xl font-bold text-gray-800 mr-2">₵</Text>
                <TextInput
                  className="flex-1 text-2xl font-bold text-gray-900"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="100.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  editable={!!phoneNumber && !!network}
                />
              </View>

              <Text className="text-xs text-gray-500 mt-2">
                Min ₵1.00 • Max ₵10,000,000
              </Text>
            </View>

            {/* Info Box */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <Text className="text-blue-900 text-sm font-medium">
                ℹ️ How it works:
              </Text>

              <Text className="text-blue-800 text-xs mt-2 leading-5">
                1. Enter deposit amount{"\n"}
                2. Tap "Deposit Now"{"\n"}
                3. You'll be taken to Paystack{"\n"}
                4. Approve the payment on your {network || "mobile"} line{"\n"}
                5. Return and tap "Verify Payment"{"\n"}
                6. Funds appear instantly in your account
              </Text>
            </View>
          </View>

          {/* DEPOSIT BUTTON */}
          <TouchableOpacity
            className={`py-4 rounded-full mb-3 ${
              isInitializing ||
              isVerifying ||
              !phoneNumber ||
              !network ||
              !amount
                ? "bg-gray-400"
                : "bg-green-600"
            }`}
            onPress={handleInitializePayment}
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
                <ActivityIndicator color="#FFF" />
                <Text className="text-white font-semibold ml-2">
                  Processing...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-base font-bold text-center">
                Deposit Now
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-500 text-xs mb-8">
            Secure payment powered by Paystack
          </Text>

          {/* Security Info */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <View className="flex-row">
              <Text className="text-xl mr-3">🔒</Text>
              <View className="flex-1">
                <Text className="text-blue-900 font-semibold text-sm">
                  Your deposit is secure
                </Text>
                <Text className="text-blue-800 text-xs mt-1">
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
