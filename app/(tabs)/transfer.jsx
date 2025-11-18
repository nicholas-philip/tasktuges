// ================== src/(tabs)/utils/transfer.jsx - WITH THEME ==================
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { PaystackWebView } from "react-native-paystack-webview";

import { useTransferMobileMoneyDirect } from "../hooks/useTransactions";
import {
  usePaystackInitialize,
  useVerifyBankTransfer,
} from "../hooks/usePayment";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

const NETWORKS = [
  { id: "MTN", name: "MTN" },
  { id: "VODAFONE", name: "Vodafone" },
  { id: "TIGO", name: "Tigo" },
];

const TRANSFER_TYPES = [
  { id: "bank", label: "Bank Account", icon: "business" },
  { id: "momo", label: "Mobile Money", icon: "phone-portrait" },
];

export default function TransferScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme(); // ✅ GET THEME
  const { user } = useAuthStore();
  const paystackWebViewRef = useRef();

  // State management
  const [transferType, setTransferType] = useState("bank");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackReference, setPaystackReference] = useState(null);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Hooks
  const { mutate: transferMobileMoneyDirect, isPending: isMobileMoneyPending } =
    useTransferMobileMoneyDirect();
  const { mutate: initializePaystack, isPending: isPaystackInitializing } =
    usePaystackInitialize();
  const { mutate: verifyBankTransfer, isPending: isBankTransferVerifying } =
    useVerifyBankTransfer();
  const { data: balanceData, refetch: refetchBalance } = useGetBalance();
  const { data: account, refetch: refetchAccount } = useGetAccountDetails();

  // Refresh data on focus
  useFocusEffect(
    React.useCallback(() => {
      refetchBalance();
      refetchAccount();
      console.log("🔄 Transfer screen refreshed");
    }, [refetchBalance, refetchAccount])
  );

  // Clear form on unmount
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        resetForm();
        console.log("🗑️ Transfer form cleared");
      };
    }, [])
  );

  const balance = balanceData?.balance || 0;

  const isValidAmount =
    amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const isValidRecipient =
    transferType === "bank"
      ? recipientAccount && recipientAccount.length >= 8
      : phoneNumber && phoneNumber.length >= 9;

  const isValidNetwork = transferType === "momo" ? selectedNetwork : true;

  const formatAmount = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account?.currency || "GHS",
    }).format(parseFloat(val) || 0);
  };

  // ✅ MOBILE MONEY TRANSFER - Direct
  const handleMobileMoneyTransfer = () => {
    if (!isValidRecipient) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid phone number (9 digits)."
      );
      return;
    }

    if (!isValidAmount) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (!isValidNetwork) {
      Alert.alert("Invalid Network", "Please select a network.");
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

    const reference = `MOMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullPhoneNumber = phoneNumber.startsWith("+233")
      ? phoneNumber
      : `+233${phoneNumber}`;

    transferMobileMoneyDirect(
      {
        reference,
        amount: parseFloat(amount),
        phoneNumber: fullPhoneNumber,
        network: selectedNetwork,
        description:
          description || `Transfer to ${fullPhoneNumber} (${selectedNetwork})`,
      },
      {
        onSuccess: () => {
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
        },
      }
    );
  };

  // ✅ BANK TRANSFER - Via Paystack
  const handleBankTransferViaPaystack = () => {
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

    const paystackPayload = {
      amount: parseFloat(amount),
      email: user?.email || `user_${user?.id}@tasktuges.app`,
      paymentMethod: "transfer",
      recipientAccountNumber: recipientAccount,
      description: description || `Bank transfer to ${recipientAccount}`,
    };

    initializePaystack(paystackPayload, {
      onSuccess: (data) => {
        console.log("✅ Paystack initialized for bank transfer");
        setPaystackReference(data.reference);
        setShowPaystack(true);
      },
      onError: (error) => {
        Alert.alert("Error", error?.message || "Failed to initialize transfer");
      },
    });
  };

  // ✅ Handle main transfer action
  const handleTransfer = () => {
    if (transferType === "bank") {
      handleBankTransferViaPaystack();
    } else {
      handleMobileMoneyTransfer();
    }
  };

  // ✅ Paystack success callback for bank transfer
  const handlePaystackSuccess = (res) => {
    console.log("✅ Paystack payment successful:", res);

    verifyBankTransfer(paystackReference, {
      onSuccess: () => {
        Alert.alert(
          "Success",
          `Bank transfer of ${formatAmount(amount)} completed!`,
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
          error?.message || "Failed to complete bank transfer."
        );
        setShowPaystack(false);
      },
    });
  };

  const resetForm = () => {
    setTransferType("bank");
    setRecipientAccount("");
    setPhoneNumber("");
    setSelectedNetwork("");
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

  const handlePhoneChange = (text) => {
    const numericText = text.replace(/[^0-9]/g, "");
    setPhoneNumber(numericText);
  };

  // Render Paystack Modal
  const renderPaystackModal = () => {
    if (!showPaystack || !paystackReference) return null;

    return (
      <Modal
        visible={showPaystack}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          Alert.alert("Cancel Transfer", "Are you sure you want to cancel?", [
            { text: "No", style: "cancel" },
            { text: "Yes", onPress: () => setShowPaystack(false) },
          ]);
        }}
      >
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <PaystackWebView
              paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY}
              amount={parseFloat(amount) * 100}
              billingEmail={user?.email || `user_${user?.id}@tasktuges.app`}
              billingName={user?.name || "User"}
              channels={["card", "bank"]}
              onCancel={() => {
                Alert.alert("Cancelled", "Bank transfer was cancelled");
                setShowPaystack(false);
              }}
              onSuccess={handlePaystackSuccess}
              ref={paystackWebViewRef}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1 pt-8"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3 mb-8">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text className="text-4xl font-bold" style={{ color: colors.text }}>
            Transfer Money
          </Text>
          <View className="w-7" />
        </View>

        {/* FROM Account */}
        <View
          className="mx-5 mb-5 p-4 rounded-xl border"
          style={{
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary,
          }}
        >
          <Text
            className="text-xs font-bold mb-1"
            style={{ color: colors.primary }}
          >
            TRANSFER FROM
          </Text>
          <Text className="text-lg font-bold" style={{ color: colors.text }}>
            {account?.accountNumber || "Your Account"}
          </Text>
          <Text className="text-xs mt-2" style={{ color: colors.text }}>
            Available: {formatAmount(balance)}
          </Text>
        </View>

        {/* Transfer Type Selection */}
        <View className="mx-5 mb-6">
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.text }}
          >
            Transfer To *
          </Text>
          <View className="flex-row gap-3">
            {TRANSFER_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                className="flex-1 p-4 rounded-xl border-2 items-center"
                style={{
                  backgroundColor:
                    transferType === type.id
                      ? colors.primaryLight
                      : colors.card,
                  borderColor:
                    transferType === type.id ? colors.primary : colors.border,
                }}
                onPress={() => setTransferType(type.id)}
              >
                <View
                  className="w-12 h-12 rounded-full justify-center items-center mb-2"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Ionicons name={type.icon} size={24} color="#fff" />
                </View>
                <Text
                  className="text-sm font-bold text-center"
                  style={{
                    color:
                      transferType === type.id ? colors.primary : colors.text,
                  }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bank Account Transfer */}
        {transferType === "bank" && (
          <View
            className="mx-5 mb-6 p-5 rounded-2xl"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              className="text-sm font-semibold mb-3"
              style={{ color: colors.text }}
            >
              Recipient Account Number *
            </Text>
            <View
              className="flex-row items-center rounded-full px-4 py-3 border-2"
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              }}
            >
              <Ionicons
                name="person"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 10 }}
              />
              <TextInput
                className="flex-1 text-base"
                placeholder="Enter account number"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                value={recipientAccount}
                onChangeText={setRecipientAccount}
                style={{ color: colors.text }}
              />
              {recipientAccount && recipientAccount.length >= 8 && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
              )}
            </View>
            <Text
              className="text-xs mt-2"
              style={{ color: colors.textSecondary }}
            >
              Paystack secured transfer
            </Text>
          </View>
        )}

        {/* Mobile Money Transfer */}
        {transferType === "momo" && (
          <>
            <View
              className="mx-5 mb-6 p-5 rounded-2xl"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Recipient Phone Number *
              </Text>
              <View
                className="flex-row items-center rounded-full px-4 py-3 border-2"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                }}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 10 }}
                />
                <Text
                  className="font-semibold mr-2"
                  style={{ color: colors.text }}
                >
                  +233
                </Text>
                <TextInput
                  className="flex-1 text-base"
                  placeholder="501234567"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={9}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  style={{ color: colors.text }}
                />
                {phoneNumber && phoneNumber.length >= 9 && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                )}
              </View>
              <Text
                className="text-xs mt-2"
                style={{ color: colors.textSecondary }}
              >
                Enter 9 digits (without +233 prefix)
              </Text>
            </View>

            <View
              className="mx-5 mb-6 p-5 rounded-full"
              style={{ backgroundColor: colors.card }}
            >
              <Text
                className="text-sm font-semibold mb-3"
                style={{ color: colors.text }}
              >
                Mobile Network *
              </Text>
              <TouchableOpacity
                className="flex-row items-center rounded-xl px-4 py-3 border-2"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                }}
                onPress={() => setShowNetworkModal(true)}
              >
                <Ionicons
                  name="phone-portrait"
                  size={20}
                  color={colors.textSecondary}
                  style={{ marginRight: 10 }}
                />
                <Text
                  className="flex-1 text-base font-medium"
                  style={{ color: colors.text }}
                >
                  {selectedNetwork || "Select Network"}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
              <Text
                className="text-xs mt-2"
                style={{ color: colors.textSecondary }}
              >
                MTN, Vodafone, or Tigo
              </Text>
            </View>

            {/* Network Modal */}
            <Modal
              visible={showNetworkModal}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowNetworkModal(false)}
            >
              <View
                className="flex-1 justify-end"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              >
                <View
                  className="rounded-t-3xl max-h-80"
                  style={{ backgroundColor: colors.card }}
                >
                  <View
                    className="flex-row items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: colors.border }}
                  >
                    <Text
                      className="text-lg font-bold"
                      style={{ color: colors.text }}
                    >
                      Select Network
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowNetworkModal(false)}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView className="p-4">
                    {NETWORKS.map((network) => (
                      <TouchableOpacity
                        key={network.id}
                        className="flex-row items-center p-4 border-b"
                        style={{ borderColor: colors.border }}
                        onPress={() => {
                          setSelectedNetwork(network.id);
                          setShowNetworkModal(false);
                        }}
                      >
                        <View className="flex-1">
                          <Text
                            className="text-base font-bold"
                            style={{ color: colors.text }}
                          >
                            {network.name}
                          </Text>
                        </View>
                        {selectedNetwork === network.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color={colors.success}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </>
        )}

        {/* Transfer Amount */}
        <View
          className="mx-5 mb-6 p-5 rounded-2xl"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.text }}
          >
            Transfer Amount *
          </Text>
          <View
            className="flex-row items-center rounded-full px-4 py-3 border-2"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            }}
          >
            <Text
              className="text-2xl font-bold mr-2"
              style={{ color: colors.text }}
            >
              {account?.currency === "GHS" ? "₵" : "$"}
            </Text>
            <TextInput
              className="flex-1 text-3xl font-bold"
              placeholder="0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={handleAmountChange}
              style={{ color: colors.text }}
            />
          </View>
          {amount && (
            <View className="mt-3 flex-row justify-between">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Amount: {formatAmount(amount)}
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Remaining: {formatAmount(balance - parseFloat(amount))}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View
          className="mx-5 mb-6 p-5 rounded-full"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-sm font-semibold mb-3"
            style={{ color: colors.text }}
          >
            Description (Optional)
          </Text>
          <TextInput
            className="border rounded-full px-4 py-3"
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
            numberOfLines={3}
          />
        </View>

        {/* Terms */}
        <View className="mx-5 mb-6 flex-row items-start">
          <TouchableOpacity
            className="w-5 h-5 rounded border-2 mr-3 mt-0.5 justify-center items-center"
            style={{
              borderColor: agreedToTerms ? colors.warning : colors.border,
              backgroundColor: agreedToTerms ? colors.warning : "transparent",
            }}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            {agreedToTerms && (
              <Ionicons name="checkmark" size={14} color="#fff" />
            )}
          </TouchableOpacity>
          <Text className="flex-1 text-sm" style={{ color: colors.text }}>
            I agree to the{" "}
            <Text style={{ color: colors.warning, fontWeight: "600" }}>
              Terms & Conditions
            </Text>{" "}
            and confirm the recipient details.
          </Text>
        </View>

        {/* Transfer Button */}
        <View className="mx-5 mb-6">
          <TouchableOpacity
            className="p-6 rounded-full flex-row justify-center items-center"
            style={{
              backgroundColor:
                isValidAmount &&
                isValidRecipient &&
                isValidNetwork &&
                agreedToTerms &&
                !isMobileMoneyPending &&
                !isPaystackInitializing &&
                !isBankTransferVerifying
                  ? colors.warning
                  : colors.textTertiary,
            }}
            onPress={handleTransfer}
            disabled={
              !isValidAmount ||
              !isValidRecipient ||
              !isValidNetwork ||
              !agreedToTerms ||
              isMobileMoneyPending ||
              isPaystackInitializing ||
              isBankTransferVerifying
            }
          >
            {isMobileMoneyPending ||
            isPaystackInitializing ||
            isBankTransferVerifying ? (
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

        {/* Info */}
        <View
          className="mx-5 mb-10 p-4 rounded-xl border"
          style={{
            backgroundColor: colors.warningLight,
            borderColor: colors.warning,
          }}
        >
          <View className="flex-row">
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.warning}
              style={{ marginRight: 10 }}
            />
            <View className="flex-1">
              <Text
                className="font-semibold text-sm"
                style={{ color: colors.text }}
              >
                Transfer Information
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                {transferType === "bank"
                  ? "Bank transfers are verified through Paystack."
                  : "Mobile money transfers are instant and secured."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Paystack Payment Modal */}
      {renderPaystackModal()}
    </SafeScreen>
  );
}
