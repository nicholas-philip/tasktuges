// ================== app/(tabs)/deposit.jsx (SIMPLIFIED - NO WEBVIEW) ==================
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

export default function DepositScreen() {
  const { user } = useAuthStore();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Form, 2: Payment Link

  const { mutate: initializePaystack, isPending: isInitializing } =
    usePaystackInitialize();
  const { mutate: verifyPayment, isPending: isVerifying } = usePaystackVerify();

  // ✅ VALIDATE INPUT
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

    if (!["MTN", "VODAFONE", "TIGO"].includes(network)) {
      setError("Please select a valid network");
      return false;
    }

    return true;
  };

  // ✅ STEP 1: Initialize Paystack payment with backend
  const handleInitializePayment = () => {
    if (!validateInput()) return;

    console.log("🔄 Initializing Paystack payment...");

    // Convert amount to kobo (GHS * 100)
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
          console.log("✅ Paystack initialized:", data);

          if (data.authorizationUrl) {
            // Open the authorization URL in browser
            console.log("🔗 Opening Paystack payment URL...");
            Linking.openURL(data.authorizationUrl).catch(() => {
              Alert.alert(
                "Error",
                "Could not open payment page. Please try again."
              );
            });

            // Move to verification step
            setStep(2);

            // Ask user to confirm after payment
            Alert.alert(
              "Payment Redirect",
              "You will be redirected to Paystack to complete payment. Tap OK to continue.",
              [
                {
                  text: "Cancel",
                  onPress: () => setStep(1),
                },
                {
                  text: "OK",
                  onPress: () => {
                    // After user completes payment, they'll return
                    // We can verify after a delay
                    setTimeout(() => {
                      handleVerifyPayment(data.reference);
                    }, 2000);
                  },
                },
              ]
            );
          } else {
            Alert.alert("Error", "Could not get payment URL from server");
          }
        },
        onError: (err) => {
          console.error("❌ Paystack initialization failed:", err);
          Alert.alert("Error", err.message || "Failed to initialize payment");
        },
      }
    );
  };

  // ✅ STEP 2: Verify payment after redirect
  const handleVerifyPayment = (reference) => {
    console.log("🔄 Verifying payment with backend...");

    Alert.alert("Verify Payment", "Did you complete the payment on Paystack?", [
      {
        text: "No, Cancel",
        onPress: () => setStep(1),
      },
      {
        text: "Yes, Verify",
        onPress: () => {
          verifyPayment(reference, {
            onSuccess: (data) => {
              console.log("✅ Payment verified:", data);
              Alert.alert(
                "Success! 🎉",
                `Deposit of ₵${amount} completed successfully!\n\nNew Balance: ₵${data.newBalance?.toLocaleString() || "N/A"}`,
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
              console.error("❌ Payment verification failed:", err);
              Alert.alert(
                "Verification Failed",
                "Payment may not have been completed. Please try again or contact support."
              );
              setStep(1);
            },
          });
        },
      },
    ]);
  };

  // ✅ Reset form
  const resetForm = () => {
    setAmount("");
    setPhoneNumber("");
    setNetwork("MTN");
    setError("");
    setStep(1);
  };

  // Show payment status screen
  if (step === 2) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <View className="bg-white rounded-2xl p-8 items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-xl font-bold text-gray-800 mt-6">
            Processing Payment
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            You have been redirected to Paystack. Complete the payment on your
            phone.
          </Text>

          <TouchableOpacity
            className="mt-8 px-6 py-3 bg-blue-600 rounded-lg"
            onPress={() => setStep(1)}
          >
            <Text className="text-white font-semibold">Back to Form</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show deposit form
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="items-center mb-8 mt-6">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            Deposit Funds
          </Text>
          <Text className="text-gray-600 text-center">
            Add money to your wallet via Mobile Money
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Amount */}
          <View className="mb-4">
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
              editable={!isInitializing && !isVerifying}
            />
            <Text className="text-xs text-gray-500 mt-1">
              Minimum: ₵1.00 | Maximum: ₵10,000,000
            </Text>
          </View>

          {/* Phone Number */}
          <View className="mb-4">
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
              editable={!isInitializing && !isVerifying}
            />
            <Text className="text-xs text-gray-500 mt-1">
              The number linked to your mobile money account
            </Text>
          </View>

          {/* Network Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-3">
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
                  disabled={isInitializing || isVerifying}
                >
                  <Text
                    className={`text-center font-semibold ${
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
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <Text className="text-blue-900 text-sm font-medium">
              ℹ️ How it works:
            </Text>
            <Text className="text-blue-800 text-xs mt-2">
              1. Enter your deposit amount and phone number{"\n"}
              2. Click Pay Now to proceed to Paystack{"\n"}
              3. Authorize payment from your {network} account{"\n"}
              4. Your wallet will be credited immediately
            </Text>
          </View>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          className={`py-4 rounded-lg shadow-lg ${
            isInitializing || isVerifying ? "bg-gray-400" : "bg-green-600"
          }`}
          onPress={handleInitializePayment}
          disabled={isInitializing || isVerifying}
        >
          {isInitializing ? (
            <View className="flex-row justify-center items-center">
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">
                Processing...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-lg font-bold text-center">
              Pay Now
            </Text>
          )}
        </TouchableOpacity>

        {/* Info */}
        <Text className="text-center text-gray-500 text-xs mt-6">
          Your payment is secure and processed by Paystack
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
