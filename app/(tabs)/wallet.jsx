// src/(tabs)/wallet.jsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LineChart } from "react-native-chart-kit";

import { useGetBalance, useGetStats } from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import SafeScreen from "../../components/SafeScreen";

const screenWidth = Dimensions.get("window").width - 40;

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");

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

  const { data: accountData } = useGetAccountDetails();

  const isLoading = balanceLoading || statsLoading;

  const balance = balanceData?.balance || 0;
  const currency = balanceData?.currency || "USD";
  const stats = statsData?.last30Days || {};

  useFocusEffect(
    useCallback(() => {
      refetchBalance();
      refetchStats();
    }, [refetchBalance, refetchStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchBalance(), refetchStats()]);
    } finally {
      setRefreshing(false);
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount || 0);
  };

  const graphData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [4500, 4750, 5000, 4800, 5200, 5100, 5240],
      },
    ],
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1 bg-white"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View className="bg-blue-600 pb-10 pt-10 rounded-b-3xl">
          <View className="px-6">
            <Text className="text-4xl font-bold text-white">Wallet</Text>
            <Text className="text-blue-100 text-sm mt-1">
              All your account details in one place
            </Text>

            <View className="mt-5 bg-white rounded-2xl p-5 shadow-md">
              <Text className="text-gray-500 text-sm">Available Balance</Text>
              <Text className="text-4xl font-extrabold mt-1 text-gray-900">
                {formatAmount(balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* GRAPH SECTION */}
        <View className="px-5 mt-8">
          <Text className="text-lg font-bold text-gray-900 mb-4">
            Balance Overview
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <LineChart
              data={graphData}
              width={screenWidth}
              height={200}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                propsForDots: {
                  r: "5",
                  strokeWidth: "2",
                  stroke: "#2563eb",
                },
                propsForBackgroundLines: {
                  stroke: "#e5e7eb",
                  strokeDasharray: "0",
                },
              }}
              style={{
                borderRadius: 16,
              }}
            />
          </View>

          {/* TIME RANGE */}
          <View className="flex-row bg-gray-200 rounded-xl p-2 gap-2 mb-8">
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

        {/* STATS SECTION */}
        {Object.keys(stats).length > 0 && (
          <View className="px-5 mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Last 30 Days Summary
            </Text>

            <View className="flex-row mb-4 gap-4">
              {/* DEPOSITS */}
              <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border-l-4 border-green-500">
                <Text className="text-gray-500 text-xs mb-1">Deposits</Text>
                <Text className="text-2xl font-bold text-green-600">
                  {formatAmount(stats.deposits?.total || 0)}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {stats.deposits?.count || 0} transactions
                </Text>
              </View>

              {/* WITHDRAWALS */}
              <View className="flex-1 bg-white rounded-2xl p-5 shadow-sm border-l-4 border-red-500">
                <Text className="text-gray-500 text-xs mb-1">Withdrawals</Text>
                <Text className="text-2xl font-bold text-red-600">
                  {formatAmount(stats.withdrawals?.total || 0)}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  {stats.withdrawals?.count || 0} transactions
                </Text>
              </View>
            </View>

            {/* TRANSFERS */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-orange-500 mb-4">
              <Text className="text-gray-500 text-xs mb-1">Transfers</Text>
              <Text className="text-2xl font-bold text-orange-600">
                {formatAmount(stats.transfers?.total || 0)}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                {stats.transfers?.count || 0} transactions
              </Text>
            </View>

            {/* NET ACTIVITY */}
            <View className="bg-blue-50 rounded-2xl p-5 shadow-sm border border-blue-200 mb-4">
              <Text className="text-gray-600 text-xs mb-1">Net Activity</Text>
              <Text
                className={`text-2xl font-bold ${
                  (stats.deposits?.total || 0) -
                    (stats.withdrawals?.total || 0) >
                  0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatAmount(
                  (stats.deposits?.total || 0) - (stats.withdrawals?.total || 0)
                )}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">
                Inflow vs Outflow
              </Text>
            </View>

            {/* TRANSACTION COUNT */}
            <View className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
              <Text className="text-gray-600 text-xs mb-1">
                Total Transactions
              </Text>
              <Text className="text-3xl font-bold text-gray-900">
                {stats.totalTransactions || 0}
              </Text>
            </View>
          </View>
        )}

        {/* INFO BOX */}
        <View className="mx-5 mb-12 p-5 bg-blue-50 rounded-xl border border-blue-200">
          <View className="flex-row">
            <Ionicons
              name="information-circle"
              size={22}
              color="#0284c7"
              style={{ marginRight: 10 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-blue-800 text-sm">
                Wallet Insights
              </Text>
              <Text className="text-xs text-blue-700 mt-1 leading-5">
                Track your spending, monitor transfers, and stay updated with
                SkyPay's smart financial insights.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
