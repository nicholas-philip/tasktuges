// src/(tabs)/utils/transfer.jsx - UPDATED WITH PAYSTACK
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { PaystackWebView } from "react-native-paystack-webview";

import { useTransfer } from "../hooks/useTransactions";
import { usePaystackInitialize } from "../hooks/usePayment";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";

export default function TransferScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const paystackWebViewRef = useRef();

  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackReference, setPaystackReference] = useState(null);
  const [paystackKey, setPaystackKey] = useState("");
  const [paystackEmail, setPaystackEmail] = useState("");
  const [paystackAmount, setPaystackAmount] = useState(0);

  const { mutate: transfer, isPending } = useTransfer();
  const { mutate: initializePaystack, isPending: isPaystackInitializing } =
    usePaystackInitialize();
  const { data: balanceData, refetch: refetchBalance } = useGetBalance();
  const { data: account, refetch: refetchAccount } = useGetAccountDetails();

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetchBalance();
      refetchAccount();
      console.log("🔄 Transfer screen refreshed");
    }, [refetchBalance, refetchAccount])
  );

  // Clear form when screen loses focus (user leaves)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when screen loses focus
        resetForm();
        console.log("🗑️ Transfer form cleared");
      };
    }, [])
  );

  // Clear form when screen loses focus (user leaves)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when screen loses focus
        resetForm();
        console.log("🗑️ Transfer form cleared");
      };
    }, [])
  );

  const balance = balanceData?.balance || 0;

  const isValidAmount =
    amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const isValidRecipient = recipientAccount && recipientAccount.length >= 8;

  console.log("🔍 Transfer Form State:", {
    amount,
    isValidAmount,
    recipientAccount,
    isValidRecipient,
    agreedToTerms,
    balance,
    amountExceedsBalance: parseFloat(amount) > balance,
  });

  const formatAmount = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account?.currency || "USD",
    }).format(parseFloat(val) || 0);
  };

  const handleTransfer = () => {
    if (!isValidRecipient) {
      Alert.alert(
        "Invalid Account",
        "Please enter a valid recipient account number (minimum 8 digits)."
      );
      return;
    }

    if (!isValidAmount) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (parseFloat(amount) > balance) {
      Alert.alert(
        "Insufficient Balance",
        `Your balance (${formatAmount(balance)}) is less than the transfer amount.`
      );
      return;
    }

    if (!agreedToTerms) {
      Alert.alert(
        "Terms Required",
        "Please agree to the terms and conditions."
      );
      return;
    }

    // Initialize Paystack for transfer
    initializePaystack(
      {
        amount: parseFloat(amount),
        email: user?.email || `user_${user?.id}@tasktuges.app`,
        recipientAccountNumber: recipientAccount,
        description: description || `Transfer to ${recipientAccount}`,
      },
      {
        onSuccess: (data) => {
          setPaystackReference(data.reference);
          setShowPaystack(true);
        },
        onError: (error) => {
          Alert.alert(
            "Error",
            error?.message || "Failed to initialize transfer"
          );
        },
      }
    );
  };

  const handlePaystackSuccess = (res) => {
    // Verify transfer with backend
    transfer(
      {
        reference: paystackReference,
        recipientAccountNumber: recipientAccount,
        amount: parseFloat(amount),
        description: description || "Transfer",
      },
      {
        onSuccess: (data) => {
          Alert.alert(
            "Success",
            `Transfer of ${formatAmount(amount)} completed!`,
            [
              {
                text: "OK",
                onPress: () => {
                  resetForm();
                  router.back();
                },
              },
            ]
          );
        },
        onError: (error) => {
          Alert.alert(
            "Transfer Failed",
            error?.message || "An error occurred during transfer."
          );
          setShowPaystack(false);
        },
      }
    );
  };

  const resetForm = () => {
    setRecipientAccount("");
    setAmount("");
    setDescription("");
    setAgreedToTerms(false);
    setShowPaystack(false);
    setPaystackReference(null);
  };

  const handleAmountChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    setAmount(numericText);
  };

  if (showPaystack && paystackReference) {
    return (
      <PaystackWebView
        paystackKey="pk_live_YOUR_PUBLIC_KEY_HERE"
        amount={parseFloat(amount) * 100}
        billingEmail={user?.email || `user_${user?.id}@tasktuges.app`}
        billingName={user?.name || "User"}
        channels={["card"]}
        onCancel={() => {
          Alert.alert("Cancelled", "Transfer was cancelled");
          setShowPaystack(false);
        }}
        onSuccess={handlePaystackSuccess}
        ref={paystackWebViewRef}
      />
    );
  }

  return (
    <SafeScreen>
      <ScrollView className="flex-1 bg-gray-50 pt-8">
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">
            Transfer Money
          </Text>
          <View className="w-7" />
        </View>

        <View className="mx-5 mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <Text className="text-xs text-blue-600 font-semibold mb-1">
            TRANSFER FROM
          </Text>
          <Text className="text-lg font-bold text-gray-800">
            {account?.accountNumber || "Your Account"}
          </Text>
          <Text className="text-xs text-gray-600 mt-2">
            Available: {formatAmount(balance)}
          </Text>
        </View>

        <View className="mx-5 mb-6 p-5 bg-white rounded-2xl">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Recipient Account Number
          </Text>
          <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
            <Ionicons
              name="person"
              size={20}
              color="#999"
              style={{ marginRight: 10 }}
            />
            <TextInput
              className="flex-1 text-base text-gray-800"
              placeholder="Enter account number"
              placeholderTextColor="#ccc"
              keyboardType="number-pad"
              value={recipientAccount}
              onChangeText={setRecipientAccount}
            />
            {recipientAccount && recipientAccount.length >= 8 && (
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            )}
          </View>
          <Text className="text-xs text-gray-500 mt-2">
            Enter the 10-digit account number to transfer to
          </Text>
        </View>

        <View className="mx-5 mb-6 p-5 bg-white rounded-2xl">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Transfer Amount
          </Text>
          <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
            <Text className="text-2xl font-bold text-gray-800 mr-2">
              {account?.currency === "GHS" ? "₵" : "$"}
            </Text>
            <TextInput
              className="flex-1 text-3xl font-bold text-gray-800"
              placeholder="0.00"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>
          {amount && (
            <View className="mt-3 flex-row justify-between">
              <Text className="text-sm text-gray-600">
                Amount: {formatAmount(amount)}
              </Text>
              <Text className="text-sm text-gray-600">
                Remaining: {formatAmount(balance - parseFloat(amount))}
              </Text>
            </View>
          )}
        </View>

        <View className="mx-5 mb-6 p-5 bg-white rounded-2xl">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Description (Optional)
          </Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800"
            placeholder="Add a note..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="mx-5 mb-6 flex-row items-start">
          <TouchableOpacity
            className={`w-5 h-5 rounded border-2 mr-3 mt-0.5 justify-center items-center ${
              agreedToTerms
                ? "bg-orange-500 border-orange-500"
                : "border-gray-300"
            }`}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>
          <Text className="flex-1 text-sm text-gray-600">
            I agree to the{" "}
            <Text className="text-orange-600 font-semibold">
              Terms & Conditions
            </Text>{" "}
            and confirm the recipient account number.
          </Text>
        </View>

        <View className="mx-5 mb-6">
          <TouchableOpacity
            className={`p-4 rounded-xl flex-row justify-center items-center ${
              isValidAmount &&
              isValidRecipient &&
              agreedToTerms &&
              !isPending &&
              !isPaystackInitializing
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
            onPress={handleTransfer}
            disabled={
              !isValidAmount ||
              !isValidRecipient ||
              !agreedToTerms ||
              isPending ||
              isPaystackInitializing
            }
          >
            {isPending || isPaystackInitializing ? (
              <>
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Processing...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Transfer {amount ? formatAmount(amount) : "Now"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View className="mx-5 mb-10 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <View className="flex-row">
            <Ionicons
              name="information-circle"
              size={20}
              color="#ca8a04"
              style={{ marginRight: 10 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-yellow-800 text-sm">
                Transfer Information
              </Text>
              <Text className="text-xs text-yellow-700 mt-1">
                Transfers to accounts in this bank are instant. Transfers are
                secured through Paystack.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
