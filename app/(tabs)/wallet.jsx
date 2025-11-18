// ================== src/(tabs)/wallet.jsx - WITH THEME ==================
import React, { useState, useCallback, useMemo } from "react";
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

import {
  useGetBalance,
  useGetStats,
  useGetRecentTransactions,
} from "../hooks/useWallet";
import { useGetAccountDetails } from "../hooks/useAccount";
import SafeScreen from "../../components/SafeScreen";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

const screenWidth = Dimensions.get("window").width - 40;

export default function WalletScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("30days");

  // ✅ GET THEME
  const { colors, isDarkMode } = useTheme();

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
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useGetRecentTransactions();

  const { data: accountData } = useGetAccountDetails();

  const isLoading = balanceLoading || statsLoading;

  const balance = balanceData?.balance || 0;
  const currency = balanceData?.currency || "USD";
  const stats = statsData?.last30Days || {};
  const transactions = recentTransactionsData?.transactions || [];

  useFocusEffect(
    useCallback(() => {
      refetchBalance();
      refetchStats();
      refetchTransactions();
    }, [refetchBalance, refetchStats, refetchTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchBalance(),
        refetchStats(),
        refetchTransactions(),
      ]);
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

  // ✅ GENERATE DYNAMIC GRAPH DATA FROM TRANSACTIONS
  const graphData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
      };
    }

    // Calculate daily balances for last 7 days
    const last7Days = [];
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        label: dayLabels[d.getDay()],
        balance: balance,
      });
    }

    // Calculate running balance for each day
    let runningBalance = balance;
    const balances = [];

    // Sort transactions by date (oldest first)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Work backwards from today to calculate historical balances
    for (let i = last7Days.length - 1; i >= 0; i--) {
      const dayStart = last7Days[i].date;
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      // Find transactions for this day
      const dayTransactions = sortedTransactions.filter((t) => {
        const tDate = new Date(t.createdAt);
        return tDate >= dayStart && tDate < dayEnd;
      });

      // Calculate day's net change
      let dayChange = 0;
      dayTransactions.forEach((t) => {
        if (t.type === "deposit" || t.type === "transfer_in") {
          dayChange += t.amount;
        } else if (
          t.type === "withdrawal" ||
          t.type === "payment" ||
          t.type === "transfer_out"
        ) {
          dayChange -= t.amount;
        }
      });

      // Subtract to get historical balance (work backwards)
      runningBalance -= dayChange;
      balances.unshift(Math.max(0, runningBalance));
    }

    // Adjust to current balance
    if (balances.length > 0) {
      const diff = balance - balances[balances.length - 1];
      balances.forEach((_, i) => {
        balances[i] += diff;
      });
    }

    return {
      labels: last7Days.map((d) => d.label),
      datasets: [
        {
          data: balances.map((b) => Math.round(b)),
        },
      ],
    };
  }, [transactions, balance]);

  if (isLoading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: colors.background }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* HEADER */}
        <View
          className="pb-10 pt-10 rounded-b-3xl"
          style={{ backgroundColor: colors.primary }}
        >
          <View className="px-6">
            <Text className="text-4xl font-bold" style={{ color: colors.card }}>
              Wallet
            </Text>
            <Text
              className="text-sm mt-1"
              style={{ color: colors.primaryLight }}
            >
              All your account details in one place
            </Text>

            <View
              className="mt-5 rounded-2xl p-5 shadow-md"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                style={{ color: colors.textSecondary }}
                className="text-sm font-semibold"
              >
                AVAILABLE BALANCE
              </Text>
              <Text
                className="text-4xl font-extrabold mt-1"
                style={{ color: colors.text }}
              >
                {formatAmount(balance)}
              </Text>
            </View>
          </View>
        </View>

        {/* GRAPH SECTION */}
        <View className="px-5 mt-8">
          <Text
            className="text-lg font-bold mb-4"
            style={{ color: colors.text }}
          >
            Balance Overview (Last 7 Days)
          </Text>

          {transactions && transactions.length > 0 ? (
            <View
              className="rounded-2xl p-4 shadow-sm mb-6"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <LineChart
                data={graphData}
                width={screenWidth}
                height={220}
                chartConfig={{
                  backgroundColor: colors.card,
                  backgroundGradientFrom: colors.card,
                  backgroundGradientTo: colors.card,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) =>
                    isDarkMode
                      ? `rgba(203, 213, 225, ${opacity})`
                      : `rgba(100, 116, 139, ${opacity})`,
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: colors.primary,
                  },
                  propsForBackgroundLines: {
                    stroke: colors.separator,
                    strokeDasharray: "0",
                  },
                  propsForLabels: {
                    fontSize: 12,
                  },
                }}
                bezier
                style={{
                  borderRadius: 16,
                }}
              />
              <Text
                className="text-xs mt-3 text-center"
                style={{ color: colors.textSecondary }}
              >
                Balance trend over the last 7 days
              </Text>
            </View>
          ) : (
            <View
              className="rounded-2xl p-8 mb-6 items-center justify-center border-2 border-dashed"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.separator,
              }}
            >
              <Ionicons
                name="bar-chart-outline"
                size={40}
                color={colors.textTertiary}
                style={{ marginBottom: 8 }}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.textSecondary }}
              >
                No transaction data yet
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textTertiary }}
              >
                Your balance history will appear here
              </Text>
            </View>
          )}

          {/* TIME RANGE - FOR FUTURE USE */}
          <View
            className="rounded-xl p-2 gap-2 mb-8 flex-row"
            style={{ backgroundColor: colors.surface }}
          >
            {[
              { key: "7days", label: "7D" },
              { key: "30days", label: "30D" },
              { key: "90days", label: "90D" },
              { key: "1year", label: "1Y" },
            ].map((range) => (
              <TouchableOpacity
                key={range.key}
                onPress={() => setTimeRange(range.key)}
                className="flex-1 py-2 rounded-lg"
                style={{
                  backgroundColor:
                    timeRange === range.key ? colors.card : colors.surface,
                }}
              >
                <Text
                  className="text-center text-sm font-semibold"
                  style={{
                    color:
                      timeRange === range.key
                        ? colors.primary
                        : colors.textSecondary,
                  }}
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
            <Text
              className="text-lg font-bold mb-4"
              style={{ color: colors.text }}
            >
              Last 30 Days Summary
            </Text>

            <View className="flex-row mb-4 gap-4">
              {/* DEPOSITS */}
              <View
                className="flex-1 rounded-2xl p-5 shadow-sm border-l-4"
                style={{
                  backgroundColor: colors.card,
                  borderLeftColor: colors.success,
                }}
              >
                <Text
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Deposits
                </Text>
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.success }}
                >
                  {formatAmount(stats.deposits?.total || 0)}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  {stats.deposits?.count || 0} transactions
                </Text>
              </View>

              {/* WITHDRAWALS */}
              <View
                className="flex-1 rounded-2xl p-5 shadow-sm border-l-4"
                style={{
                  backgroundColor: colors.card,
                  borderLeftColor: colors.error,
                }}
              >
                <Text
                  className="text-xs mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  Withdrawals
                </Text>
                <Text
                  className="text-xl font-bold"
                  style={{ color: colors.error }}
                >
                  {formatAmount(stats.withdrawals?.total || 0)}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{ color: colors.textSecondary }}
                >
                  {stats.withdrawals?.count || 0} transactions
                </Text>
              </View>
            </View>

            {/* TRANSFERS */}
            <View
              className="rounded-2xl p-5 shadow-sm border-l-4 mb-4"
              style={{
                backgroundColor: colors.card,
                borderLeftColor: colors.warning,
              }}
            >
              <Text
                className="text-xs mb-1"
                style={{ color: colors.textSecondary }}
              >
                Transfers
              </Text>
              <Text
                className="text-xl font-bold"
                style={{ color: colors.warning }}
              >
                {formatAmount(stats.transfers?.total || 0)}
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                {stats.transfers?.count || 0} transactions
              </Text>
            </View>

            {/* NET ACTIVITY */}
            <View
              className="rounded-2xl p-5 shadow-sm border mb-4"
              style={{
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              }}
            >
              <Text
                className="text-xs mb-1"
                style={{ color: colors.textSecondary }}
              >
                Net Activity
              </Text>
              <Text
                className="text-2xl font-bold"
                style={{
                  color:
                    (stats.deposits?.total || 0) -
                      (stats.withdrawals?.total || 0) >
                    0
                      ? colors.success
                      : colors.error,
                }}
              >
                {formatAmount(
                  (stats.deposits?.total || 0) - (stats.withdrawals?.total || 0)
                )}
              </Text>
              <Text
                className="text-xs mt-1"
                style={{ color: colors.textSecondary }}
              >
                Inflow vs Outflow
              </Text>
            </View>

            {/* TRANSACTION COUNT */}
            <View
              className="p-5 rounded-2xl shadow-sm border mb-8"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <Text
                className="text-xs mb-1"
                style={{ color: colors.textSecondary }}
              >
                Total Transactions
              </Text>
              <Text
                className="text-3xl font-bold"
                style={{ color: colors.text }}
              >
                {stats.totalTransactions || 0}
              </Text>
            </View>
          </View>
        )}

        {/* INFO BOX */}
        <View
          className="mx-5 mb-10 p-4 rounded-xl border"
          style={{
            backgroundColor: colors.primaryLight,
            borderColor: colors.primary,
          }}
        >
          <View className="flex-row">
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={colors.primary}
              style={{ marginRight: 10 }}
            />
            <View className="flex-1">
              <Text
                className="font-semibold text-sm"
                style={{ color: colors.text }}
              >
                Wallet Insights
              </Text>
              <Text
                className="text-xs mt-1 leading-5"
                style={{ color: colors.textSecondary }}
              >
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
