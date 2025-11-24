// ================== src/(tabs)/utils/payment.jsx - WITH STICKY HEADER ==================
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { usePaymentInitialize, useVerifyPayment } from "../hooks/usePayment";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../context/ThemeContext";
import StickyHeader from "../../components/StickyHeader";

const PAYMENT_RECIPIENTS = [
  { id: 1, name: "Bliss School", category: "Education", icon: "school" },
  { id: 2, name: "ECG", category: "Utilities", icon: "flash" },
  { id: 3, name: "Water Company", category: "Utilities", icon: "water" },
  { id: 4, name: "Foodstuff", category: "Groceries", icon: "basket" },
  { id: 5, name: "School Fees", category: "Education", icon: "document" },
  { id: 6, name: "Internet Bill", category: "Utilities", icon: "wifi" },
  { id: 7, name: "Mobile Bill", category: "Telecom", icon: "phone-portrait" },
  { id: 8, name: "Rent Payment", category: "Housing", icon: "home" },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Debit Card", icon: "card" },
  { id: "wallet", label: "Wallet Balance", icon: "wallet" },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useTheme();
  const { user } = useAuthStore();
  const screenWidth = Dimensions.get("window").width;

  // ================== STATE MANAGEMENT ==================
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("wallet");
  const [amount, setAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [isCustomRecipient, setIsCustomRecipient] = useState(false);
  const [paystackReference, setPaystackReference] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [hasVerified, setHasVerified] = useState(false);

  // ================== HOOKS ==================
  const { mutate: initializePayment, isPending: isPaymentInitializing } =
    usePaymentInitialize();
  const { mutate: verifyPayment, isPending: isPaymentVerifying } =
    useVerifyPayment();
  const { data: balanceData, refetch: refetchBalance } = useGetBalance();
  const { data: account, refetch: refetchAccount } = useGetAccountDetails();

  const balance = balanceData?.balance || 0;

  // ================== DERIVED STATE ==================
  const isValidAmount =
    amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const isValidRecipient =
    selectedRecipient !== null || (isCustomRecipient && customName?.trim());

  const formatAmount = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account?.currency || "GHS",
    }).format(parseFloat(val) || 0);
  };

  // ================== LIFECYCLE ==================
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Payment screen focused");
      refetchBalance();
      refetchAccount();
      return () => {
        console.log("🗑️ Payment screen unfocused");
      };
    }, [])
  );

  // ================== HANDLERS ==================
  const handleManualVerifyPayment = useCallback(() => {
    if (!paystackReference) return;
    console.log("🔍 Manual verification:", paystackReference);
    setIsVerifying(true);

    verifyPayment(paystackReference, {
      onSuccess: (data) => {
        console.log("✅ Manual verification successful!", data);
        setIsVerifying(false);
        setHasVerified(true);
        const recipientName = isCustomRecipient
          ? customName
          : selectedRecipient?.name;

        Alert.alert(
          "✅ Payment Verified!",
          `Payment of ${formatAmount(amount)} to ${recipientName} completed!`,
          [
            {
              text: "Done",
              onPress: () => {
                refetchBalance();
                resetForm();
                handleGoBack();
              },
            },
          ]
        );
      },
      onError: (error) => {
        console.error("❌ Manual verification failed:", error);
        setIsVerifying(false);
        Alert.alert(
          "Verification Failed",
          error?.message || "Could not verify payment. Please try again.",
          [
            {
              text: "Try Again",
              onPress: () => handleManualVerifyPayment(),
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                setPaystackReference(null);
                setHasVerified(true);
                setVerificationAttempts(0);
                resetForm();
              },
            },
          ]
        );
      },
    });
  }, [
    paystackReference,
    isCustomRecipient,
    customName,
    selectedRecipient,
    amount,
    verifyPayment,
  ]);

  const resetForm = () => {
    console.log("🔄 Resetting form...");
    setSelectedRecipient(null);
    setAmount("");
    setDescription("");
    setAgreedToTerms(false);
    setCustomName("");
    setIsCustomRecipient(false);
    setPaystackReference(null);
    setIsVerifying(false);
    setVerificationAttempts(0);
    setHasVerified(false);
  };

  const handleGoBack = () => {
    try {
      if (router.canGoBack?.()) {
        router.back();
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (error) {
      console.log("Navigation error:", error);
      router.replace("/(tabs)/home");
    }
  };

  const handlePayment = () => {
    if (isPaymentInitializing || isPaymentVerifying) {
      console.log("⏳ Already processing, please wait...");
      return;
    }

    if (!isValidRecipient) {
      Alert.alert(
        "Invalid Recipient",
        "Please select or enter a valid recipient."
      );
      return;
    }

    if (!isValidAmount) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (selectedMethod === "wallet" && parseFloat(amount) > balance) {
      Alert.alert(
        "Insufficient Balance",
        `Your balance (${formatAmount(balance)}) is less than the payment amount.`
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

    const recipientName = isCustomRecipient
      ? customName
      : selectedRecipient.name;

    console.log("🚀 Initiating PAYMENT via Paystack:", {
      amount: parseFloat(amount),
      method: selectedMethod,
      recipient: recipientName,
    });

    initializePayment(
      {
        amount: parseFloat(amount),
        email: user?.email || `user_${user?.id}@tasktuges.app`,
        paymentMethod: selectedMethod,
        recipient: { name: recipientName },
        description: description || `Payment to ${recipientName}`,
      },
      {
        onSuccess: (data) => {
          console.log("✅ Payment initialized:", data.reference);
          setPaystackReference(data.reference);
          setVerificationAttempts(0);
          setHasVerified(false);

          if (data.authorizationUrl) {
            Linking.openURL(data.authorizationUrl);
            Alert.alert(
              "Complete Payment",
              "Complete your payment in the browser. When done, return to this app and we'll verify.",
              [
                {
                  text: "I understand",
                  onPress: () => console.log("📱 User acknowledged"),
                },
              ]
            );
          }
        },
        onError: (error) => {
          console.error("❌ Payment init failed:", error);
          Alert.alert(
            "Error",
            error?.message || "Failed to initialize payment"
          );
        },
      }
    );
  };

  const handleAmountChange = (text) => {
    const numericText = text.replace(/[^0-9.]/g, "");
    setAmount(numericText);
  };

  const handleSelectRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setIsCustomRecipient(false);
    setShowRecipientModal(false);
  };

  // ================== RENDER ==================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StickyHeader title="Make Payment" showBack={true} className="mb-2" />

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        scrollEventThrottle={16}
      >
        {/* BALANCE CARD */}
        <View
          className="mx-4 mb-6 p-5 rounded-2xl mt-2"
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
            className="text-xs font-bold mb-2 tracking-wide"
            style={{ color: "rgba(255, 255, 255, 0.8)" }}
          >
            AVAILABLE BALANCE
          </Text>
          <Text className="text-4xl font-bold" style={{ color: "#fff" }}>
            {formatAmount(balance)}
          </Text>
        </View>

        {/* VERIFYING STATE */}
        {isVerifying && paystackReference && (
          <View
            className="mx-4 mb-5 p-4 rounded-2xl border-2 flex-row items-center"
            style={{
              backgroundColor: colors.primaryLight,
              borderColor: colors.primary,
            }}
          >
            <ActivityIndicator
              color={colors.primary}
              size="large"
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: colors.text }}
              >
                Verifying Payment...
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                Please wait while we verify your transaction.
              </Text>
            </View>
          </View>
        )}

        {/* PAYMENT PENDING */}
        {paystackReference && !isVerifying && !hasVerified && (
          <View
            className="mx-4 mb-5 p-4 rounded-2xl border-2"
            style={{
              backgroundColor: colors.warningLight,
              borderColor: colors.warning,
            }}
          >
            <Text
              className="text-base font-bold mb-2"
              style={{ color: colors.text }}
            >
              ⏳ Payment in Progress
            </Text>
            <Text
              className="text-sm mb-4"
              style={{ color: colors.textSecondary }}
            >
              Completed payment on Paystack? Tap below to verify.
            </Text>
            <TouchableOpacity
              onPress={handleManualVerifyPayment}
              disabled={isVerifying}
              className="px-4 py-3 rounded-xl flex-row items-center justify-center"
              style={{ backgroundColor: colors.warning }}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white font-bold">Verify Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SELECTED RECIPIENT */}
        {selectedRecipient && (
          <View
            className="mx-4 mb-6 p-4 rounded-2xl border-2 flex-row items-center justify-between"
            style={{
              backgroundColor: colors.successLight,
              borderColor: colors.success,
            }}
          >
            <View className="flex-row items-center flex-1">
              <View
                className="w-14 h-14 rounded-full justify-center items-center mr-4"
                style={{ backgroundColor: colors.success }}
              >
                <Ionicons
                  name={selectedRecipient.icon}
                  size={28}
                  color="#fff"
                />
              </View>
              <View>
                <Text
                  className="text-base font-bold"
                  style={{ color: colors.text }}
                >
                  {selectedRecipient.name}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  {selectedRecipient.category}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedRecipient(null);
                setIsCustomRecipient(false);
              }}
            >
              <Ionicons name="close-circle" size={28} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        {/* QUICK SELECT */}
        {!selectedRecipient && !isCustomRecipient && (
          <View className="mx-4 mb-6">
            <Text
              className="text-base font-bold mb-3"
              style={{ color: colors.text }}
            >
              Quick Select
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="space-x-2"
            >
              {PAYMENT_RECIPIENTS.slice(0, 4).map((recipient) => (
                <TouchableOpacity
                  key={recipient.id}
                  className="items-center mr-2"
                  onPress={() => handleSelectRecipient(recipient)}
                >
                  <View
                    className="w-20 h-20 rounded-2xl justify-center items-center mb-2"
                    style={{
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name={recipient.icon} size={32} color="#fff" />
                  </View>
                  <Text
                    className="text-xs font-semibold text-center w-20"
                    style={{ color: colors.text }}
                  >
                    {recipient.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="items-center ml-2"
                onPress={() => setShowRecipientModal(true)}
              >
                <View
                  className="w-20 h-20 rounded-2xl justify-center items-center mb-2"
                  style={{
                    backgroundColor: colors.textSecondary,
                    shadowColor: colors.textSecondary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={32} color="#fff" />
                </View>
                <Text
                  className="text-xs font-semibold text-center w-20"
                  style={{ color: colors.text }}
                >
                  More
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* RECIPIENT MODAL */}
        <Modal
          visible={showRecipientModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRecipientModal(false)}
        >
          <View
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
          >
            <View
              className="rounded-t-3xl max-h-3/4"
              style={{ backgroundColor: colors.card }}
            >
              <View
                className="flex-row items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: colors.border }}
              >
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.text }}
                >
                  Select Recipient
                </Text>
                <TouchableOpacity onPress={() => setShowRecipientModal(false)}>
                  <Ionicons
                    name="close"
                    size={28}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-4">
                {PAYMENT_RECIPIENTS.map((recipient) => (
                  <TouchableOpacity
                    key={recipient.id}
                    className="flex-row items-center p-4 border-b"
                    style={{ borderColor: colors.border }}
                    onPress={() => handleSelectRecipient(recipient)}
                  >
                    <View
                      className="w-14 h-14 rounded-full justify-center items-center mr-4"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Ionicons name={recipient.icon} size={24} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-bold"
                        style={{ color: colors.text }}
                      >
                        {recipient.name}
                      </Text>
                      <Text
                        className="text-xs mt-1"
                        style={{ color: colors.textSecondary }}
                      >
                        {recipient.category}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  className="flex-row items-center p-4 border-t mt-2"
                  style={{ borderColor: colors.border }}
                  onPress={() => {
                    setIsCustomRecipient(true);
                    setShowRecipientModal(false);
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-full justify-center items-center mr-4"
                    style={{ backgroundColor: colors.textSecondary }}
                  >
                    <Ionicons name="person-add" size={24} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-bold"
                      style={{ color: colors.text }}
                    >
                      Custom Recipient
                    </Text>
                    <Text
                      className="text-xs mt-1"
                      style={{ color: colors.textSecondary }}
                    >
                      Enter custom recipient name
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* CUSTOM RECIPIENT */}
        {isCustomRecipient && (
          <View
            className="mx-4 mb-6 p-5 rounded-2xl border-2"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.primary,
            }}
          >
            <Text
              className="text-base font-bold mb-3"
              style={{ color: colors.text }}
            >
              Recipient Name
            </Text>
            <View
              className="flex-row items-center rounded-xl px-4 py-3 border-2"
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
              }}
            >
              <Ionicons
                name="person"
                size={22}
                color={colors.textSecondary}
                style={{ marginRight: 12 }}
              />
              <TextInput
                className="flex-1 text-lg"
                placeholder="e.g. Bliss School"
                placeholderTextColor={colors.textTertiary}
                value={customName}
                onChangeText={setCustomName}
                style={{ color: colors.text }}
              />
            </View>
          </View>
        )}

        {/* AMOUNT */}
        <View
          className="mx-4 mb-6 p-5 rounded-2xl"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-base font-bold mb-3"
            style={{ color: colors.text }}
          >
            Payment Amount
          </Text>
          <View
            className="flex-row items-center rounded-xl px-4 py-3 border-2"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            }}
          >
            <Text
              className="text-3xl font-bold mr-2"
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
          {amount && selectedMethod === "wallet" && (
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

        {/* PAYMENT METHOD */}
        <View className="mx-4 mb-6">
          <Text
            className="text-base font-bold mb-3"
            style={{ color: colors.text }}
          >
            Payment Method
          </Text>
          <View className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                className="flex-row items-center p-4 rounded-xl border-2"
                style={{
                  backgroundColor: colors.card,
                  borderColor:
                    selectedMethod === method.id
                      ? colors.success
                      : colors.border,
                }}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View
                  className="w-14 h-14 rounded-full justify-center items-center mr-4"
                  style={{
                    backgroundColor:
                      method.id === "card" ? colors.primary : colors.success,
                  }}
                >
                  <Ionicons name={method.icon} size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-bold"
                    style={{ color: colors.text }}
                  >
                    {method.label}
                  </Text>
                </View>
                <View
                  className="w-6 h-6 rounded-full border-2 items-center justify-center"
                  style={{
                    borderColor:
                      selectedMethod === method.id
                        ? colors.success
                        : colors.border,
                    backgroundColor:
                      selectedMethod === method.id
                        ? colors.success
                        : "transparent",
                  }}
                >
                  {selectedMethod === method.id && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* DESCRIPTION */}
        <View
          className="mx-4 mb-6 p-5 rounded-2xl"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-base font-bold mb-3"
            style={{ color: colors.text }}
          >
            Description (Optional)
          </Text>
          <TextInput
            className="border rounded-xl px-4 py-3"
            style={{
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.text,
              minHeight: 90,
            }}
            placeholder="Add a note..."
            placeholderTextColor={colors.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* TERMS */}
        <View className="mx-4 mb-6 flex-row items-start">
          <TouchableOpacity
            className="w-6 h-6 rounded border-2 mr-3 mt-0.5 justify-center items-center"
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
            for this payment.
          </Text>
        </View>

        {/* PAY BUTTON */}
        <View className="mx-4 mb-6">
          <TouchableOpacity
            className="p-4 rounded-xl flex-row justify-center items-center"
            style={{
              backgroundColor:
                isValidAmount &&
                isValidRecipient &&
                agreedToTerms &&
                !isPaymentInitializing &&
                !isVerifying
                  ? colors.success
                  : colors.textTertiary,
            }}
            onPress={handlePayment}
            disabled={
              !isValidAmount ||
              !isValidRecipient ||
              !agreedToTerms ||
              isPaymentInitializing ||
              isVerifying
            }
          >
            {isPaymentInitializing || isVerifying ? (
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
                  name="checkmark-circle"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white font-bold text-lg">
                  Pay {amount ? formatAmount(amount) : "Now"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* SECURITY INFO */}
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
              Secure Payment
            </Text>
            <Text
              className="text-xs mt-1"
              style={{ color: colors.textSecondary }}
            >
              Your payment is protected with Paystack end-to-end encryption.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
