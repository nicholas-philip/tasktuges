// ================== FILE 3: src/(tabs)/utils/transfer.jsx ==================
import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import { useTransfer } from "../hooks/useTransactions";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import SafeScreen from "../../components/SafeScreen";

export default function TransferScreen() {
  const router = useRouter();
  const [recipientAccount, setRecipientAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { mutate: transfer, isPending } = useTransfer();
  const { data: balanceData } = useGetBalance();
  const { data: account } = useGetAccountDetails();

  const balance = balanceData?.balance || 0;
  const isValidAmount =
    amount &&
    !isNaN(amount) &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= balance;
  const isValidRecipient = recipientAccount && recipientAccount.length >= 8;

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
      Alert.alert(
        "Invalid Amount",
        `Please enter a valid amount (Max: ${formatAmount(balance)})`
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

    const transferData = {
      recipientAccountNumber: recipientAccount,
      amount: parseFloat(amount),
      description: description || "Transfer",
    };

    transfer(transferData, {
      onSuccess: (data) => {
        Alert.alert(
          "Success",
          `Transfer of ${formatAmount(amount)} completed!`,
          [
            {
              text: "OK",
              onPress: () => {
                setRecipientAccount("");
                setAmount("");
                setDescription("");
                setAgreedToTerms(false);
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
      },
    });
  };

  const handleAmountChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    setAmount(numericText);
  };

  return (
    <SafeScreen>
      <ScrollView className="flex-1 bg-gray-50">
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
              isValidAmount && isValidRecipient && agreedToTerms && !isPending
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
            onPress={handleTransfer}
            disabled={
              !isValidAmount || !isValidRecipient || !agreedToTerms || isPending
            }
          >
            {isPending ? (
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
                Transfers to accounts in this bank are instant. International
                transfers may take 1-3 business days.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
