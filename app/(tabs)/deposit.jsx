// ================== app/(tabs)/deposit.jsx (CLEAN UI VERSION) ==================
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
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";

export default function DepositScreen() {
  const { user } = useAuthStore();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const { mutate: initializePaystack, isPending: isInitializing } =
    usePaystackInitialize();
  const { mutate: verifyPayment, isPending: isVerifying } = usePaystackVerify();

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

    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  // ================== INITIALIZE PAYMENT ==================
  const handleInitializePayment = () => {
    if (!validateInput()) return;

    const amountInKobo = Math.round(parseFloat(amount) * 100);

    initializePaystack(
      {
        amount: amountInKobo,
        email: user?.email,
        phoneNumber,
        network,
      },
      {
        onSuccess: (data) => {
          if (data.authorizationUrl) {
            Linking.openURL(data.authorizationUrl).catch(() => {
              Alert.alert("Error", "Could not open payment page.");
            });

            setStep(2);

            Alert.alert(
              "Redirecting",
              "You will be redirected to Paystack to complete payment.",
              [
                { text: "Cancel", onPress: () => setStep(1) },
                {
                  text: "OK",
                  onPress: () => {
                    setTimeout(() => {
                      handleVerifyPayment(data.reference);
                    }, 2000);
                  },
                },
              ]
            );
          }
        },

        onError: (err) => {
          Alert.alert("Error", err.message || "Payment initialization failed");
        },
      }
    );
  };

  // ================== VERIFY PAYMENT ==================
  const handleVerifyPayment = (reference) => {
    Alert.alert("Verification", "Did you complete the payment?", [
      { text: "No", onPress: () => setStep(1) },
      {
        text: "Yes, Verify",
        onPress: () => {
          verifyPayment(reference, {
            onSuccess: (data) => {
              Alert.alert(
                "Success! 🎉",
                `Deposit of ₵${amount} completed.\n\nNew Balance: ₵${data.newBalance?.toLocaleString()}`,
                [
                  {
                    text: "Done",
                    onPress: () => resetForm(),
                  },
                ]
              );
            },
            onError: () => {
              Alert.alert("Error", "Verification failed. Try again.");
              setStep(1);
            },
          });
        },
      },
    ]);
  };

  // ================== RESET FORM ==================
  const resetForm = () => {
    setAmount("");
    setPhoneNumber("");
    setNetwork("MTN");
    setError("");
    setStep(1);
  };

  // ================== STEP 2 SCREEN ==================
  if (step === 2) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center w-full max-w-sm">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-xl font-bold text-gray-800 mt-6">
            Processing Payment
          </Text>

          <Text className="text-gray-600 text-center mt-2 text-sm leading-5">
            You have been redirected to Paystack. Complete the payment on your
            phone.
          </Text>

          <TouchableOpacity
            className="mt-8 px-6 py-3 bg-blue-600 rounded-lg w-full"
            onPress={() => setStep(1)}
          >
            <Text className="text-white font-semibold text-center">
              Back to Form
            </Text>
          </TouchableOpacity>
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
              Deposit Funds
            </Text>

            <Text className="text-gray-600 text-center text-sm px-6 leading-5">
              Add money to your SkyPay wallet using Mobile Money.
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
            {/* Amount */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Amount (GHS) *
              </Text>

              <TextInput
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                value={amount}
                onChangeText={setAmount}
                placeholder="100.00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />

              <Text className="text-xs text-gray-500 mt-1">
                Min ₵1.00 • Max ₵10,000,000
              </Text>
            </View>

            {/* Phone Number */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Phone Number (+233...) *
              </Text>

              <TextInput
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+233501234567"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>

            {/* Network */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Mobile Network *
              </Text>

              <View className="flex-row gap-3">
                {["MTN", "VODAFONE", "TIGO"].map((net) => (
                  <TouchableOpacity
                    key={net}
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      network === net
                        ? "bg-blue-600 border-blue-600"
                        : "bg-white border-gray-300"
                    }`}
                    onPress={() => setNetwork(net)}
                  >
                    <Text
                      className={`text-center font-semibold text-sm ${
                        network === net ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {net}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Info Box */}
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text className="text-blue-900 text-sm font-medium">
                ℹ️ How it works:
              </Text>

              <Text className="text-blue-800 text-xs mt-2 leading-5">
                1. Enter deposit amount{"\n"}
                2. Enter your MoMo number{"\n"}
                3. Tap Pay Now{"\n"}
                4. Approve the prompt on your {network} line
              </Text>
            </View>
          </View>

          {/* PAY BUTTON */}
          <TouchableOpacity
            className={`py-4 rounded-full ${
              isInitializing || isVerifying ? "bg-gray-400" : "bg-green-600"
            }`}
            onPress={handleInitializePayment}
            disabled={isInitializing || isVerifying}
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
                Pay Now
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-center text-gray-500 text-xs mt-5">
            Payments powered securely by Paystack
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
