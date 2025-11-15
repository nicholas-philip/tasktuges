// src/(tabs)/utils/payment.jsx - UPDATED WITH PAYSTACK
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
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { PaystackWebView } from "react-native-paystack-webview";

import { usePaystackInitialize, useInitiatePayment } from "../hooks/usePayment";
import { useGetBalance } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import { useAuthStore } from "../../store/authStore";
import SafeScreen from "../../components/SafeScreen";

const PAYMENT_RECIPIENTS = [
  {
    id: 1,
    name: "Bliss School",
    category: "Education",
    icon: "school",
    color: "bg-blue-500",
  },
  {
    id: 2,
    name: "ECG",
    category: "Utilities",
    icon: "flash",
    color: "bg-yellow-500",
  },
  {
    id: 3,
    name: "Water Company",
    category: "Utilities",
    icon: "water",
    color: "bg-cyan-500",
  },
  {
    id: 4,
    name: "Foodstuff",
    category: "Groceries",
    icon: "basket",
    color: "bg-green-500",
  },
  {
    id: 5,
    name: "School Fees",
    category: "Education",
    icon: "document",
    color: "bg-indigo-500",
  },
  {
    id: 6,
    name: "Internet Bill",
    category: "Utilities",
    icon: "wifi",
    color: "bg-blue-600",
  },
  {
    id: 7,
    name: "Mobile Bill",
    category: "Telecom",
    icon: "phone-portrait",
    color: "bg-purple-500",
  },
  {
    id: 8,
    name: "Rent Payment",
    category: "Housing",
    icon: "home",
    color: "bg-orange-500",
  },
];

const PAYMENT_METHODS = [
  { id: "card", label: "Debit Card", icon: "card", color: "bg-blue-500" },
  {
    id: "wallet",
    label: "Wallet Balance",
    icon: "wallet",
    color: "bg-green-500",
  },
  {
    id: "mobile_money",
    label: "Mobile Money",
    icon: "phone-portrait",
    color: "bg-orange-500",
  },
];

const NETWORKS = [
  { id: "MTN", name: "MTN" },
  { id: "VODAFONE", name: "Vodafone" },
  { id: "TIGO", name: "Tigo" },
];

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const paystackWebViewRef = useRef();

  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("wallet");
  const [amount, setAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [isCustomRecipient, setIsCustomRecipient] = useState(false);

  // Mobile Money States
  const [showMobileMoneyModal, setShowMobileMoneyModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [showPaystack, setShowPaystack] = useState(false);
  const [paystackReference, setPaystackReference] = useState(null);

  const { mutate: initiatePayment, isPending } = useInitiatePayment();
  const { mutate: initializePaystack, isPending: isPaystackInitializing } =
    usePaystackInitialize();
  const { data: balanceData, refetch: refetchBalance } = useGetBalance();
  const { data: account, refetch: refetchAccount } = useGetAccountDetails();

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetchBalance();
      refetchAccount();
      console.log("🔄 Payment screen refreshed");
    }, [refetchBalance, refetchAccount])
  );

  // Clear form when screen loses focus (user leaves)
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when screen loses focus
        resetForm();
        console.log("🗑️ Payment form cleared");
      };
    }, [])
  );

  const balance = balanceData?.balance || 0;

  const isValidAmount =
    amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  const isValidRecipient =
    selectedRecipient !== null || (isCustomRecipient && customName?.trim());

  console.log("🔍 Payment Form State:", {
    amount,
    isValidAmount,
    selectedRecipient: selectedRecipient?.name,
    isCustomRecipient,
    customName,
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

  const handleMobileMoneyInitiate = () => {
    if (phoneNumber.length !== 9) {
      Alert.alert("Error", "Phone number must be 9 digits");
      return;
    }
    if (!selectedNetwork) {
      Alert.alert("Error", "Please select a network");
      return;
    }

    // Initialize Paystack payment
    initializePaystack(
      {
        amount: parseFloat(amount),
        email: user?.email || `user_${user?.id}@tasktuges.app`,
        phoneNumber: `+233${phoneNumber}`,
        network: selectedNetwork,
        recipient: isCustomRecipient ? customName : selectedRecipient.name,
        description:
          description ||
          `Payment to ${isCustomRecipient ? customName : selectedRecipient.name}`,
      },
      {
        onSuccess: (data) => {
          setPaystackReference(data.reference);
          setShowPaystack(true);
        },
        onError: (error) => {
          Alert.alert(
            "Error",
            error?.message || "Failed to initialize payment"
          );
        },
      }
    );
  };

  const handlePaystackSuccess = (res) => {
    const recipientName = isCustomRecipient
      ? customName
      : selectedRecipient.name;

    // Verify payment with backend
    initiatePayment(
      {
        reference: paystackReference,
        phoneNumber: `+233${phoneNumber}`,
        network: selectedNetwork,
        paymentMethod: "mobile_money",
        recipient: {
          name: recipientName,
        },
        description: description || `Payment to ${recipientName}`,
      },
      {
        onSuccess: () => {
          Alert.alert(
            "Success",
            `Payment of ${formatAmount(amount)} to ${recipientName} completed!`,
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
          Alert.alert("Error", error?.message || "Failed to save payment.");
          setShowPaystack(false);
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedRecipient(null);
    setAmount("");
    setDescription("");
    setAgreedToTerms(false);
    setCustomName("");
    setIsCustomRecipient(false);
    setPhoneNumber("");
    setSelectedNetwork(null);
    setShowPaystack(false);
    setPaystackReference(null);
    setShowMobileMoneyModal(false);
  };

  const handlePayment = () => {
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

    if (parseFloat(amount) > balance) {
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

    // If mobile money, show mobile money modal
    if (selectedMethod === "mobile_money") {
      setShowMobileMoneyModal(true);
      return;
    }

    // For wallet and card, use Paystack
    const recipientName = isCustomRecipient
      ? customName
      : selectedRecipient.name;

    initializePaystack(
      {
        amount: parseFloat(amount),
        email: user?.email || `user_${user?.id}@tasktuges.app`,
        paymentMethod: selectedMethod,
        recipient: {
          name: recipientName,
        },
        description: description || `Payment to ${recipientName}`,
      },
      {
        onSuccess: (data) => {
          setPaystackReference(data.reference);
          setShowPaystack(true);
        },
        onError: (error) => {
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

  if (showPaystack && paystackReference) {
    return (
      <PaystackWebView
        paystackKey="pk_live_YOUR_PUBLIC_KEY_HERE"
        amount={parseFloat(amount) * 100}
        billingEmail={user?.email || `user_${user?.id}@tasktuges.app`}
        billingMobile={
          selectedMethod === "mobile_money" ? `+233${phoneNumber}` : undefined
        }
        billingName={user?.name || "User"}
        channels={
          selectedMethod === "mobile_money" ? ["mobile_money"] : ["card"]
        }
        onCancel={() => {
          Alert.alert("Cancelled", "Payment was cancelled");
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
          <Text className="text-2xl font-bold text-gray-800">Make Payment</Text>
          <View className="w-7" />
        </View>

        <View className="mx-5 mb-5 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <Text className="text-xs text-blue-600 font-semibold mb-1">
            AVAILABLE BALANCE
          </Text>
          <Text className="text-2xl font-bold text-gray-800">
            {formatAmount(balance)}
          </Text>
        </View>

        {selectedRecipient && (
          <View className="mx-5 mb-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className={`w-12 h-12 rounded-full justify-center items-center mr-3 ${selectedRecipient.color}`}
                >
                  <Ionicons
                    name={selectedRecipient.icon}
                    size={24}
                    color="#fff"
                  />
                </View>
                <View>
                  <Text className="text-sm font-bold text-gray-800">
                    {selectedRecipient.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
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
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!selectedRecipient && !isCustomRecipient && (
          <View className="mx-5 mb-6">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Quick Select Recipient
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="space-x-2"
            >
              {PAYMENT_RECIPIENTS.slice(0, 4).map((recipient) => (
                <TouchableOpacity
                  key={recipient.id}
                  className="items-center mr-4"
                  onPress={() => handleSelectRecipient(recipient)}
                >
                  <View
                    className={`w-16 h-16 rounded-2xl justify-center items-center mb-2 ${recipient.color} shadow-md`}
                  >
                    <Ionicons name={recipient.icon} size={28} color="#fff" />
                  </View>
                  <Text className="text-xs text-gray-700 font-semibold text-center w-16">
                    {recipient.name.split(" ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="items-center ml-2"
                onPress={() => setShowRecipientModal(true)}
              >
                <View className="w-16 h-16 rounded-2xl justify-center items-center mb-2 bg-gray-300 shadow-md">
                  <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
                </View>
                <Text className="text-xs text-gray-700 font-semibold text-center w-16">
                  More
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <Modal
          visible={showRecipientModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowRecipientModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-96">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-gray-800">
                  Select Recipient
                </Text>
                <TouchableOpacity onPress={() => setShowRecipientModal(false)}>
                  <Ionicons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              <ScrollView className="p-4">
                {PAYMENT_RECIPIENTS.map((recipient) => (
                  <TouchableOpacity
                    key={recipient.id}
                    className="flex-row items-center p-4 border-b border-gray-100"
                    onPress={() => handleSelectRecipient(recipient)}
                  >
                    <View
                      className={`w-12 h-12 rounded-full justify-center items-center mr-4 ${recipient.color}`}
                    >
                      <Ionicons name={recipient.icon} size={20} color="#fff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-800">
                        {recipient.name}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-1">
                        {recipient.category}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  className="flex-row items-center p-4 border-t-2 border-gray-200 mt-2"
                  onPress={() => {
                    setIsCustomRecipient(true);
                    setShowRecipientModal(false);
                  }}
                >
                  <View className="w-12 h-12 rounded-full justify-center items-center mr-4 bg-gray-400">
                    <Ionicons name="person-add" size={20} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-gray-800">
                      Custom Recipient
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      Enter custom recipient name
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {isCustomRecipient && (
          <View className="mx-5 mb-6 p-5 bg-white rounded-2xl border-2 border-gray-300">
            <Text className="text-sm font-semibold text-gray-700 mb-3">
              Recipient Name
            </Text>

            <View className="mb-4">
              <Text className="text-xs text-gray-600 mb-2">Name</Text>
              <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
                <Ionicons
                  name="person"
                  size={20}
                  color="#999"
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  placeholder="e.g. Bliss School"
                  placeholderTextColor="#ccc"
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>
            </View>

            <TouchableOpacity
              className="mt-3 p-2"
              onPress={() => {
                setIsCustomRecipient(false);
                setCustomName("");
              }}
            >
              <Text className="text-sm text-blue-600 font-semibold">
                Back to quick select
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mx-5 mb-6 p-5 bg-white rounded-2xl">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Payment Amount
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
            Payment Method
          </Text>
          <View className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.id}
                className={`flex-row items-center p-4 rounded-xl border-2 ${
                  selectedMethod === method.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => setSelectedMethod(method.id)}
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
                    selectedMethod === method.id
                      ? "border-green-500 bg-green-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedMethod === method.id && (
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
              agreedToTerms
                ? "bg-green-500 border-green-500"
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
            <Text className="text-green-600 font-semibold">
              Terms & Conditions
            </Text>{" "}
            for this payment.
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
                ? "bg-green-500"
                : "bg-gray-300"
            }`}
            onPress={handlePayment}
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
                  name="checkmark-circle"
                  size={20}
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

        <Modal
          visible={showMobileMoneyModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMobileMoneyModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-screen p-5">
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-gray-800">
                  Mobile Money Payment
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMobileMoneyModal(false)}
                >
                  <Ionicons name="close" size={24} color="#999" />
                </TouchableOpacity>
              </View>

              <ScrollView>
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Select Network
                  </Text>
                  <View className="flex-row justify-between gap-3">
                    {NETWORKS.map((network) => (
                      <TouchableOpacity
                        key={network.id}
                        className={`flex-1 py-4 px-3 rounded-xl border-2 items-center ${
                          selectedNetwork === network.id
                            ? "bg-blue-50 border-blue-600"
                            : "bg-gray-50 border-gray-300"
                        }`}
                        onPress={() => setSelectedNetwork(network.id)}
                      >
                        <Text className="text-2xl mb-2">📱</Text>
                        <Text
                          className={`font-semibold text-sm ${
                            selectedNetwork === network.id
                              ? "text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          {network.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Phone Number
                  </Text>
                  <View className="flex-row items-center border-2 border-gray-200 rounded-xl px-4 py-3">
                    <Text className="text-gray-700 font-semibold mr-2">
                      +233
                    </Text>
                    <TextInput
                      className="flex-1 text-base text-gray-900"
                      placeholder="24XXXXXXXX"
                      keyboardType="phone-pad"
                      maxLength={9}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  className={`p-4 rounded-xl items-center ${
                    phoneNumber.length === 9 &&
                    selectedNetwork &&
                    !isPending &&
                    !isPaystackInitializing
                      ? "bg-blue-600"
                      : "bg-gray-300"
                  }`}
                  onPress={handleMobileMoneyInitiate}
                  disabled={
                    phoneNumber.length !== 9 ||
                    !selectedNetwork ||
                    isPending ||
                    isPaystackInitializing
                  }
                >
                  {isPending || isPaystackInitializing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-lg">
                      Proceed to Payment
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  className="mt-3 p-3"
                  onPress={() => setShowMobileMoneyModal(false)}
                >
                  <Text className="text-center text-gray-600 font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <View className="mx-5 mb-10 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <View className="flex-row">
            <Ionicons
              name="shield-checkmark"
              size={20}
              color="#0284c7"
              style={{ marginRight: 10 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-blue-800 text-sm">
                Secure Payment
              </Text>
              <Text className="text-xs text-blue-700 mt-1">
                Your payment is protected with Paystack end-to-end encryption.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
