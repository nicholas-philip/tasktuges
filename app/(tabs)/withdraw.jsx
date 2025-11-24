// ================== src/(tabs)/utils/withdraw.jsx - WITH STICKY HEADER ==================
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useWithdraw } from "../hooks/useTransactions";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import SafeScreen from "../../components/SafeScreen";
import StickyHeader from "../../components/StickyHeader";
import { useTheme } from "../context/ThemeContext";

export default function WithdrawScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get("window").width;

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
      desc: "1-3 business days",
    },
    {
      id: "counter",
      label: "Counter Withdrawal",
      icon: "person",
      desc: "Instant at branch",
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
      currency: account?.currency || "GHS",
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
      method: withdrawMethod,
      description: description || "Withdrawal",
    };

    withdraw(withdrawData, {
      onSuccess: () => {
        Alert.alert(
          "✅ Success",
          `Withdrawal of ${formatAmount(amount)} initiated!`,
          [
            {
              text: "OK",
              onPress: () => {
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
          "❌ Withdrawal Failed",
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
      <StickyHeader title="Withdraw Money" showBack={true} />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        scrollEventThrottle={16}
      >
        {/* Balance Card */}
        <View
          className="mx-4 mb-6 p-6 rounded-2xl mt-6"
          style={{
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Text
            className="text-xs font-bold tracking-wider mb-2"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            AVAILABLE BALANCE
          </Text>
          <Text className="text-4xl font-bold mb-3" style={{ color: "#fff" }}>
            {formatAmount(balance)}
          </Text>
          <Text
            className="text-sm"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
            Account: {account?.accountNumber || "N/A"}
          </Text>
        </View>

        {/* Amount Input Section */}
        <View className="mx-4 mb-6">
          <Text
            className="text-base font-bold mb-3"
            style={{ color: colors.text }}
          >
            Enter Withdrawal Amount
          </Text>

          <View
            className="flex-row items-center rounded-xl px-4 py-4 border-2"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            }}
          >
            <Text
              className="text-3xl font-bold mr-3"
              style={{ color: colors.text }}
            >
              {account?.currency === "GHS" ? "₵" : "$"}
            </Text>

            <TextInput
              className="flex-1 text-4xl font-bold"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              style={{ color: colors.text }}
            />
          </View>

          {/* Amount Summary */}
          {amount && (
            <View
              className="mt-4 p-4 rounded-xl border-2"
              style={{
                backgroundColor: colors.successLight,
                borderColor: colors.success,
              }}
            >
              <View className="flex-row justify-between mb-3">
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Amount:
                </Text>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {formatAmount(amount)}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text
                  className="text-sm"
                  style={{ color: colors.textSecondary }}
                >
                  Remaining:
                </Text>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {formatAmount(balance - parseFloat(amount))}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Withdrawal Methods */}
        <View className="mx-4 mb-6">
          <Text
            className="text-base font-bold mb-4"
            style={{ color: colors.text }}
          >
            Select Withdrawal Method
          </Text>

          <View className="space-y-3">
            {withdrawMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                className="flex-row items-center p-4 rounded-xl border-2"
                style={{
                  backgroundColor:
                    withdrawMethod === method.id
                      ? colors.primaryLight
                      : colors.card,
                  borderColor:
                    withdrawMethod === method.id
                      ? colors.primary
                      : colors.border,
                }}
                onPress={() => setWithdrawMethod(method.id)}
              >
                <View
                  className="w-16 h-16 rounded-xl justify-center items-center mr-4"
                  style={{
                    backgroundColor:
                      method.id === "bank_transfer"
                        ? colors.success
                        : colors.warning,
                  }}
                >
                  <Ionicons name={method.icon} size={28} color="#fff" />
                </View>

                <View className="flex-1">
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    {method.label}
                  </Text>
                  <Text
                    className="text-xs mt-1"
                    style={{ color: colors.textSecondary }}
                  >
                    ⏱ {method.desc}
                  </Text>
                </View>

                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor:
                      withdrawMethod === method.id
                        ? colors.primary
                        : colors.border,
                    backgroundColor:
                      withdrawMethod === method.id
                        ? colors.primary
                        : "transparent",
                  }}
                >
                  {withdrawMethod === method.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="mx-4 mb-6">
          <Text
            className="text-base font-bold mb-3"
            style={{ color: colors.text }}
          >
            Description (Optional)
          </Text>

          <TextInput
            className="border-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
              minHeight: 100,
            }}
            placeholder="Add a note about this withdrawal..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Terms Agreement */}
        <View className="mx-4 mb-6 flex-row items-start">
          <TouchableOpacity
            className="w-6 h-6 rounded-md border-2 mr-3 mt-0.5 justify-center items-center"
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

          <Text className="flex-1 text-sm mt-1" style={{ color: colors.text }}>
            I agree to the{" "}
            <Text style={{ color: colors.success, fontWeight: "700" }}>
              Terms & Conditions
            </Text>{" "}
            and confirm the withdrawal details.
          </Text>
        </View>

        {/* Withdraw Button */}
        <View className="mx-4 mb-6">
          <TouchableOpacity
            className="p-4 rounded-xl flex-row justify-center items-center"
            style={{
              backgroundColor:
                isValidAmount && agreedToTerms && !isPending
                  ? colors.success
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
                  style={{ marginRight: 10 }}
                />
                <Text className="text-white font-bold text-lg">
                  Processing...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
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

        {/* Processing Time Info */}
        <View
          className="mx-4 mb-12 p-4 rounded-2xl border-2 flex-row"
          style={{
            backgroundColor: colors.warningLight,
            borderColor: colors.warning,
          }}
        >
          <Ionicons
            name="information-circle"
            size={24}
            color={colors.warning}
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <View className="flex-1">
            <Text
              className="font-bold text-base"
              style={{ color: colors.text }}
            >
              Processing Time
            </Text>
            <Text
              className="text-xs mt-2"
              style={{ color: colors.textSecondary }}
            >
              {withdrawMethod === "bank_transfer"
                ? "🏦 Bank transfers take 1–3 business days to complete."
                : "⚡ Counter withdrawals are processed instantly at the branch."}
            </Text>
          </View>
        </View>

        {/* Security Info */}
        <View
          className="mx-4 mb-12 p-4 rounded-2xl border-2 flex-row"
          style={{
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary,
          }}
        >
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={colors.primary}
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <View className="flex-1">
            <Text
              className="font-bold text-base"
              style={{ color: colors.text }}
            >
              Secure Withdrawal
            </Text>
            <Text
              className="text-xs mt-2"
              style={{ color: colors.textSecondary }}
            >
              ✓ Your withdrawal is protected with end-to-end encryption
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
