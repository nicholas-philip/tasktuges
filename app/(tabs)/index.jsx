// src/(tabs)/index.jsx
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useGetBalance,
  useGetStats,
  useGetRecentTransactions,
} from "../hooks/useWallet";
import { useGetAccount } from "../hooks/useAccount";

export default function HomeScreen() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // React Query hooks
  const {
    data: balanceData,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useGetBalance();

  const {
    data: statsData,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useGetStats();

  const {
    data: recentTransactionsData,
    isLoading: recentLoading,
    refetch: refetchRecent,
  } = useGetRecentTransactions();

  const { data: accountData } = useGetAccount();

  // Determine if any data is loading
  const isLoading = balanceLoading || statsLoading || recentLoading;

  // Extract data with proper fallbacks
  const balance = balanceData?.balance || 0;
  const currency = balanceData?.currency || "USD";
  const accountNumber = balanceData?.accountNumber || "N/A";
  const recentTransactions = recentTransactionsData?.transactions || [];
  const stats = statsData?.last30Days || {};

  // Check if welcome message should be shown
  useEffect(() => {
    checkWelcomeStatus();
  }, []);

  const checkWelcomeStatus = async () => {
    try {
      const lastWelcomeTime = await AsyncStorage.getItem("lastWelcomeTime");
      const currentTime = Date.now();

      if (!lastWelcomeTime || currentTime - parseInt(lastWelcomeTime) > 60000) {
        setShowWelcome(true);
        await AsyncStorage.setItem("lastWelcomeTime", currentTime.toString());

        // Animate in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ]).start();

        // Hide after 1 minute
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -50,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowWelcome(false);
          });
        }, 60000);
      }
    } catch (error) {
      console.error("Error checking welcome status:", error);
    }
  };

  // Refetch all data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetchBalance();
      refetchStats();
      refetchRecent();
    }, [refetchBalance, refetchStats, refetchRecent])
  );

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBalance(), refetchStats(), refetchRecent()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Format currency
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount || 0);
  };

  // Format card number with spacing
  const formatCardNumber = (accNumber) => {
    if (!accNumber) return "•••• •••• •••• ••••";
    const str = accNumber.toString();
    return str.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    const icons = {
      deposit: "arrow-down",
      withdrawal: "arrow-up",
      transfer_in: "arrow-forward",
      transfer_out: "arrow-back",
      payment: "card",
    };
    return icons[type] || "swap-horizontal";
  };

  // Get transaction color
  const getTransactionColor = (type) => {
    return ["deposit", "transfer_in"].includes(type)
      ? "text-green-500"
      : "text-red-500";
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="bg-gradient-to-b from-blue-600 to-blue-800 pb-8 rounded-b-3xl shadow-lg">
        {/* Header */}
        <View className="p-3">
          <View className="flex-row justify-between items-center mt-8">
            {/* Profile Icon */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
            >
              <Ionicons name="person-outline" size={22} color="white" />
            </TouchableOpacity>

            {/* Notification Icon */}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/utils/notifications")}
              className="w-10 h-10 bg-white/20 rounded-full justify-center items-center"
            >
              <Ionicons name="notifications-outline" size={22} color="white" />
              {/* Notification Badge */}
              <View className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full justify-center items-center">
                <Text className="text-white text-xs font-bold">3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Animated Welcome Message */}
          {showWelcome && (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View className="bg-white/10 rounded-2xl p-4 mt-4 backdrop-blur-lg">
                <Text className="text-2xl font-bold text-black">
                  Welcome Back! 👋
                </Text>
                <Text className="text-sm text-black opacity-80 mt-1">
                  Manage your finances
                </Text>
              </View>
            </Animated.View>
          )}
        </View>

        {/* Visa Card */}
        <View className="mx-5 my-4">
          <LinearGradient
            colors={["#1e3a8a", "#3b82f6", "#60a5fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-8 shadow-2xl"
            style={{
              borderRadius: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
              padding: 24,
            }}
          >
            {/* Card Top Section */}
            <View className="flex-row justify-between items-start mb-6">
              <View>
                <Text className="text-white text-xs opacity-70 mb-1">
                  Balance
                </Text>
                <Text className="text-white text-3xl font-bold">
                  {visible ? formatAmount(balance) : "••••••"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(!visible)}>
                <Ionicons
                  name={visible ? "eye-off" : "eye"}
                  size={22}
                  color="white"
                />
              </TouchableOpacity>
            </View>

            {/* Card Chip */}
            <View className="mb-6">
              <View className="w-12 h-10 bg-amber-400/80 rounded-lg" />
            </View>

            {/* Card Number */}
            <View className="mb-6">
              <Text className="text-white text-lg font-mono tracking-widest">
                {visible
                  ? formatCardNumber(accountNumber)
                  : "•••• •••• •••• ••••"}
              </Text>
            </View>

            {/* Card Bottom Section */}
            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-white/70 text-xs mb-1">Card Holder</Text>
                <Text className="text-white text-sm font-semibold uppercase">
                  Account Holder
                </Text>
              </View>
              <View>
                <Text className="text-white/70 text-xs mb-1">Expires</Text>
                <Text className="text-white text-sm font-semibold">
                  {new Date().getMonth() + 1}/{new Date().getFullYear() + 5}
                </Text>
              </View>
              <View className="items-end">
                <View className="flex-row space-x-1">
                  <View className="w-8 h-8 bg-red-500/80 rounded-full" />
                  <View className="w-8 h-8 bg-amber-500/80 rounded-full -ml-3" />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex-row justify-around px-5 -mt-5 mb-5">
        <TouchableOpacity
          className="items-center"
          onPress={() => router.push("deposit")}
        >
          <View className="w-16 h-16 bg-white rounded-2xl justify-center items-center mb-2 shadow-md">
            <Ionicons name="add" size={28} color="#22c55e" />
          </View>
          <Text className="text-xs text-gray-700 font-semibold">Deposit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => router.push("withdraw")}
        >
          <View className="w-16 h-16 bg-white rounded-2xl justify-center items-center mb-2 shadow-md">
            <Ionicons name="remove" size={28} color="#ef4444" />
          </View>
          <Text className="text-xs text-gray-700 font-semibold">Withdraw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => router.push("transfer")}
        >
          <View className="w-16 h-16 bg-white rounded-2xl justify-center items-center mb-2 shadow-md">
            <Ionicons name="swap-horizontal" size={28} color="#3b82f6" />
          </View>
          <Text className="text-xs text-gray-700 font-semibold">Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center"
          onPress={() => router.push("payment")}
        >
          <View className="w-16 h-16 bg-white rounded-2xl justify-center items-center mb-2 shadow-md">
            <Ionicons name="card" size={28} color="#f97316" />
          </View>
          <Text className="text-xs text-gray-700 font-semibold">Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {Object.keys(stats).length > 0 && (
        <View className="mx-5 mb-5 p-5 bg-white rounded-2xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Last 30 Days
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-gray-600">Deposits</Text>
              <Text className="text-xl font-bold text-green-600 mt-1">
                {formatAmount(stats.deposits?.total || 0)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {stats.deposits?.count || 0} transactions
              </Text>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-600">Withdrawals</Text>
              <Text className="text-xl font-bold text-red-600 mt-1">
                {formatAmount(stats.withdrawals?.total || 0)}
              </Text>
              <Text className="text-xs text-gray-400 mt-1">
                {stats.withdrawals?.count || 0} transactions
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Transactions */}
      <View className="mx-5 mb-10 p-5 bg-white rounded-2xl shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-800">
            Recent Transactions
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/utils/transactions")}
          >
            <Text className="text-sm text-blue-600 font-semibold">See All</Text>
          </TouchableOpacity>
        </View>

        {!recentTransactions || recentTransactions.length === 0 ? (
          <Text className="text-center text-gray-400 py-5">
            No transactions yet
          </Text>
        ) : (
          recentTransactions.slice(0, 5).map((transaction) => (
            <TouchableOpacity
              key={transaction._id}
              className="flex-row items-center py-3 border-b border-gray-100"
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/utils/transaction-detail",
                  params: { id: transaction._id },
                })
              }
            >
              <View
                className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
                  ["deposit", "transfer_in"].includes(transaction.type)
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                <Ionicons
                  name={getTransactionIcon(transaction.type)}
                  size={20}
                  color={
                    ["deposit", "transfer_in"].includes(transaction.type)
                      ? "#22c55e"
                      : "#ef4444"
                  }
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800">
                  {transaction.type.replace(/_/g, " ").toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {new Date(transaction.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text
                className={`text-base font-bold ${getTransactionColor(
                  transaction.type
                )}`}
              >
                {["deposit", "transfer_in"].includes(transaction.type)
                  ? "+"
                  : "-"}
                {formatAmount(transaction.amount)}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
