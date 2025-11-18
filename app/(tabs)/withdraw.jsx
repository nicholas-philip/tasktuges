// ================== src/(tabs)/utils/withdraw.jsx - WITH THEME ==================
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
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

export default function WithdrawScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme(); // ✅ GET THEME

  const [amount, setAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { mutate: withdraw, isPending } = useWithdraw();
  const { data: balanceData } = useGetBalance();
  const { data: account } = useGetAccountDetails();

  const withdrawMethods = [
    {
      id: "bank_transfer",
      label: "Bank Transfer",
      icon: "swap-horizontal",
    },
    {
      id: "counter",
      label: "Counter Withdrawal",
      icon: "person",
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
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-8 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-xl font-bold" style={{ color: colors.text }}>
            Withdraw Money
          </Text>
          <View className="w-7" />
        </View>

        {/* Balance Card */}
        <View
          className="mx-5 mb-5 p-6 rounded-3xl shadow-sm border"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: colors.textSecondary }}
          >
            AVAILABLE BALANCE
          </Text>
          <Text
            className="text-3xl font-bold mt-1"
            style={{ color: colors.text }}
          >
            {formatAmount(balance)}
          </Text>
          <Text
            className="text-xs mt-2"
            style={{ color: colors.textSecondary }}
          >
            Account Number: {account?.accountNumber || "N/A"}
          </Text>
        </View>

        {/* Amount Input */}
        <View className="mx-5 mb-6">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Enter Amount
          </Text>

          <View
            className="flex-row items-center rounded-2xl px-4 py-4 shadow-sm border"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            }}
          >
            <Text
              className="text-2xl font-bold mr-3"
              style={{ color: colors.text }}
            >
              {account?.currency === "GHS" ? "₵" : "$"}
            </Text>

            <TextInput
              className="flex-1 text-3xl font-semibold"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              style={{ color: colors.text }}
            />
          </View>

          {/* Amount Summary */}
          {amount ? (
            <View
              className="mt-3 p-4 rounded-2xl border"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.border,
              }}
            >
              <View className="flex-row justify-between">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Amount:
                </Text>
                <Text
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  {formatAmount(amount)}
                </Text>
              </View>

              <View className="flex-row justify-between mt-1">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  Remaining:
                </Text>
                <Text
                  className="text-sm font-bold"
                  style={{ color: colors.text }}
                >
                  {formatAmount(balance - parseFloat(amount))}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Methods */}
        <View className="mx-5 mb-6">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Select Withdrawal Method
          </Text>

          <View className="space-y-3">
            {withdrawMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                className="flex-row items-center p-4 rounded-2xl border"
                style={{
                  backgroundColor: colors.card,
                  borderColor:
                    withdrawMethod === method.id ? colors.error : colors.border,
                  borderWidth: withdrawMethod === method.id ? 2 : 1,
                }}
                onPress={() => setWithdrawMethod(method.id)}
              >
                <View
                  className="w-12 h-12 rounded-2xl justify-center items-center mr-3"
                  style={{
                    backgroundColor:
                      method.id === "bank_transfer"
                        ? colors.success
                        : colors.warning,
                  }}
                >
                  <Ionicons name={method.icon} size={24} color="#fff" />
                </View>

                <Text
                  className="flex-1 font-semibold"
                  style={{ color: colors.text }}
                >
                  {method.label}
                </Text>

                <View
                  className="w-5 h-5 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor:
                      withdrawMethod === method.id
                        ? colors.error
                        : colors.border,
                    backgroundColor:
                      withdrawMethod === method.id
                        ? colors.error
                        : "transparent",
                  }}
                >
                  {withdrawMethod === method.id && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="mx-5 mb-6">
          <Text
            className="text-sm font-semibold mb-2"
            style={{ color: colors.text }}
          >
            Description (Optional)
          </Text>

          <TextInput
            className="border rounded-2xl px-4 py-4"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
            }}
            placeholder="Add a note..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        {/* Terms */}
        <View className="mx-5 mb-6 flex-row items-start">
          <TouchableOpacity
            className="w-6 h-6 rounded-md border-2 mr-3 justify-center items-center"
            style={{
              borderColor: agreedToTerms ? colors.success : colors.border,
              backgroundColor: agreedToTerms ? colors.success : "transparent",
            }}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </TouchableOpacity>

          <Text
            className="flex-1 text-sm leading-5"
            style={{ color: colors.text }}
          >
            I agree to the{" "}
            <Text style={{ color: colors.success, fontWeight: "600" }}>
              Terms & Conditions
            </Text>{" "}
            and confirm the withdrawal details.
          </Text>
        </View>

        {/* Withdraw Button */}
        <View className="mx-5 mb-10">
          <TouchableOpacity
            className="p-5 rounded-2xl flex-row justify-center items-center shadow-md"
            style={{
              backgroundColor:
                isValidAmount && agreedToTerms && !isPending
                  ? colors.error
                  : colors.textTertiary,
            }}
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
                <Text
                  className="text-white font-bold text-lg"
                  style={{ marginLeft: 8 }}
                >
                  Processing...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="arrow-up-circle"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Withdraw {amount ? formatAmount(amount) : ""}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View
          className="mx-5 mb-10 p-4 rounded-2xl shadow-sm border"
          style={{
            backgroundColor: colors.warningLight,
            borderColor: colors.warning,
          }}
        >
          <View className="flex-row">
            <Ionicons
              name="information-circle"
              size={22}
              color={colors.warning}
              style={{ marginRight: 8 }}
            />
            <View className="flex-1">
              <Text
                className="font-semibold text-sm"
                style={{ color: colors.text }}
              >
                Processing Time
              </Text>
              <Text
                className="text-xs mt-1 leading-4"
                style={{ color: colors.textSecondary }}
              >
                Bank transfers take 1–3 business days. Counter withdrawals are
                processed immediately at the branch.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
