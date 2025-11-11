// src/(tabs)/wallet.jsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";

import { useGetBalance, useGetStats } from "../hooks/useWallet";
import { useGetAccount } from "../hooks/useAccount";

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");

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

  const { data: accountData } = useGetAccount();

  const isLoading = balanceLoading || statsLoading;

  // Extract data
  const balance = balanceData?.balance || 0;
  const currency = balanceData?.currency || "USD";
  const accountNumber = balanceData?.accountNumber || "N/A";
  const stats = statsData?.last30Days || {};

  // Refetch on screen focus
  useFocusEffect(
    useCallback(() => {
      refetchBalance();
      refetchStats();
    }, [refetchBalance, refetchStats])
  );

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBalance(), refetchStats()]);
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

  // Mock graph data - in production, you'd fetch this from backend
  const graphData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [4500, 4750, 5000, 4800, 5200, 5100, 5240],
      },
    ],
  };

  // Show loading
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0066cc" />
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
      {/* Header */}
      <View className="bg-gradient-to-b from-blue-600 to-blue-800 pb-8 pt-4 rounded-b-3xl shadow-lg">
        <View className="px-5">
          <Text className="text-white text-3xl font-bold">Wallet</Text>
          <Text className="text-blue-100 text-sm mt-1">
            Your financial overview
          </Text>
        </View>
      </View>

      {/* Balance Graph Section */}
      <View className="px-5 py-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Balance Trend (Last 7 Days)
        </Text>

        {/* Graph Card */}
        <View className="bg-white rounded-2xl p-4 shadow-sm mb-6 items-center">
          <LineChart
            data={graphData}
            width={340}
            height={200}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "#3b82f6",
              },
              propsForBackgroundLines: {
                strokeDasharray: "0",
                stroke: "#e5e7eb",
              },
            }}
            style={{
              borderRadius: 16,
            }}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>

        {/* Time Range Selector */}
        <View className="flex-row bg-gray-200 rounded-xl p-1 gap-2 mb-6">
          {[
            { key: "7days", label: "7D" },
            { key: "30days", label: "30D" },
            { key: "90days", label: "90D" },
            { key: "1year", label: "1Y" },
          ].map((range) => (
            <TouchableOpacity
              key={range.key}
              onPress={() => setTimeRange(range.key)}
              className={`flex-1 py-2 rounded-lg ${
                timeRange === range.key
                  ? "bg-white shadow-sm"
                  : "bg-transparent"
              }`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  timeRange === range.key ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Statistics Section */}
      {Object.keys(stats).length > 0 && (
        <View className="px-5 pb-6">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Last 30 Days Summary
          </Text>

          {/* Main Stats Cards */}
          <View className="flex-row mb-3 gap-3">
            {/* Deposits Card */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border-t-4 border-green-500">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-600 font-medium">
                  Deposits
                </Text>
                <View className="bg-green-100 p-2 rounded-lg">
                  <Ionicons name="arrow-down" size={16} color="#22c55e" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-green-600">
                {formatAmount(stats.deposits?.total || 0)}
              </Text>
              <Text className="text-xs text-gray-500 mt-2">
                {stats.deposits?.count || 0} transactions
              </Text>
            </View>

            {/* Withdrawals Card */}
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border-t-4 border-red-500">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-600 font-medium">
                  Withdrawals
                </Text>
                <View className="bg-red-100 p-2 rounded-lg">
                  <Ionicons name="arrow-up" size={16} color="#ef4444" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-red-600">
                {formatAmount(stats.withdrawals?.total || 0)}
              </Text>
              <Text className="text-xs text-gray-500 mt-2">
                {stats.withdrawals?.count || 0} transactions
              </Text>
            </View>
          </View>

          {/* Transfers Card */}
          <View className="bg-white rounded-2xl p-4 shadow-sm border-t-4 border-orange-500 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-600 font-medium">
                Transfers
              </Text>
              <View className="bg-orange-100 p-2 rounded-lg">
                <Ionicons name="send" size={16} color="#f97316" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-orange-600">
              {formatAmount(stats.transfers?.total || 0)}
            </Text>
            <Text className="text-xs text-gray-500 mt-2">
              {stats.transfers?.count || 0} transactions
            </Text>
          </View>

          {/* Net Summary Card */}
          <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-blue-200 mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs text-gray-600 font-medium">
                Net Activity
              </Text>
              <Ionicons
                name={
                  (stats.deposits?.total || 0) -
                    (stats.withdrawals?.total || 0) >
                  0
                    ? "trending-up"
                    : "trending-down"
                }
                size={16}
                color={
                  (stats.deposits?.total || 0) -
                    (stats.withdrawals?.total || 0) >
                  0
                    ? "#22c55e"
                    : "#ef4444"
                }
              />
            </View>
            <Text
              className={`text-2xl font-bold ${
                (stats.deposits?.total || 0) - (stats.withdrawals?.total || 0) >
                0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatAmount(
                (stats.deposits?.total || 0) - (stats.withdrawals?.total || 0)
              )}
            </Text>
            <Text className="text-xs text-gray-500 mt-2">
              Inflow vs Outflow
            </Text>
          </View>

          {/* Transaction Count */}
          <View className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-600 font-medium mb-1">
                  Total Transactions
                </Text>
                <Text className="text-3xl font-bold text-gray-900">
                  {stats.totalTransactions || 0}
                </Text>
              </View>
              <View className="bg-blue-100 p-3 rounded-full">
                <Ionicons name="list" size={24} color="#3b82f6" />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Info Section */}
      <View className="mx-5 mb-10 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <View className="flex-row">
          <Ionicons
            name="information-circle"
            size={20}
            color="#0284c7"
            style={{ marginRight: 10 }}
          />
          <View className="flex-1">
            <Text className="font-semibold text-blue-800 text-sm">
              Wallet Insights
            </Text>
            <Text className="text-xs text-blue-700 mt-1">
              View detailed transactions on the Home screen. Track your spending
              patterns with our analytics.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
