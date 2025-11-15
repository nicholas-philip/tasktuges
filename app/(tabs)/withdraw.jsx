// ================== FILE 4: src/(tabs)/utils/withdraw.jsx ==================
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
import { useWithdraw } from "../hooks/useTransactions";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import SafeScreen from "../../components/SafeScreen";

export default function WithdrawScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { mutate: withdraw, isPending } = useWithdraw();
  const { data: balanceData } = useGetBalance();
  const { data: account } = useGetAccountDetails();

  // ⛔ ATM REMOVED — Only Bank Transfer & Counter remain
  const withdrawMethods = [
    {
      id: "bank_transfer",
      label: "Bank Transfer",
      icon: "swap-horizontal",
      color: "bg-green-500",
    },
    {
      id: "counter",
      label: "Counter Withdrawal",
      icon: "person",
      color: "bg-purple-500",
    },
  ];

  const balance = balanceData?.balance || 0;

  const isValidAmount =
    amount &&
    !isNaN(amount) &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= balance;

  const formatAmount = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account?.currency || "USD",
    }).format(parseFloat(val) || 0);
  };

  const handleWithdraw = () => {
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

    const withdrawData = {
      amount: parseFloat(amount),
      description: description || "Withdrawal",
    };

    withdraw(withdrawData, {
      onSuccess: () => {
        Alert.alert("Success", "Withdrawal completed successfully!", [
          {
            text: "OK",
            onPress: () => {
              setAmount("");
              setDescription("");
              setAgreedToTerms(false);
              router.back();
            },
          },
        ]);
      },
      onError: (error) => {
        Alert.alert(
          "Withdrawal Failed",
          error?.message || "An error occurred during withdrawal."
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
        <View className="flex-row items-center justify-between px-5 pt-8 pb-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">
            Withdraw Money
          </Text>
          <View className="w-7" />
        </View>

        <View className="mx-5 mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <Text className="text-xs text-blue-600 font-semibold mb-1">
            AVAILABLE BALANCE
          </Text>
          <Text className="text-2xl font-bold text-gray-800">
            {formatAmount(balance)}
          </Text>
          <Text className="text-xs text-gray-600 mt-1">
            Account: {account?.accountNumber || "N/A"}
          </Text>
        </View>

        <View className="mx-5 mb-6 p-5 bg-white rounded-2xl">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Withdrawal Amount
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

        <View className="mx-5 mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Select Withdrawal Method
          </Text>

          <View className="space-y-2">
            {withdrawMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                className={`flex-row items-center p-4 rounded-xl border-2 ${
                  withdrawMethod === method.id
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setWithdrawMethod(method.id)}
              >
                <View
                  className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${method.color}`}
                >
                  <Ionicons name={method.icon} size={24} color="#fff" />
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">
                    {method.label}
                  </Text>
                </View>

                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    withdrawMethod === method.id
                      ? "border-red-500 bg-red-500"
                      : "border-gray-300"
                  }`}
                >
                  {withdrawMethod === method.id && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
              agreedToTerms ? "bg-red-500 border-red-500" : "border-gray-300"
            }`}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>

          <Text className="flex-1 text-sm text-gray-600">
            I agree to the{" "}
            <Text className="text-red-600 font-semibold">
              Terms & Conditions
            </Text>{" "}
            and confirm withdrawal details.
          </Text>
        </View>

        <View className="mx-5 mb-6">
          <TouchableOpacity
            className={`p-4 rounded-xl flex-row justify-center items-center ${
              isValidAmount && agreedToTerms && !isPending
                ? "bg-red-500"
                : "bg-gray-300"
            }`}
            onPress={handleWithdraw}
            disabled={!isValidAmount || !agreedToTerms || isPending}
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
                  name="arrow-up-circle"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Withdraw {amount ? formatAmount(amount) : "Now"}
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
                Processing Time
              </Text>

              {/* Updated text (ATM removed) */}
              <Text className="text-xs text-yellow-700 mt-1">
                Bank transfers typically complete within 1-3 business days.
                Counter withdrawals are processed immediately at the branch.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
