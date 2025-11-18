// ================== src/(tabs)/_layout.jsx - WITH THEME ==================
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext"; // ✅ IMPORT THEME

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme(); // ✅ GET THEME

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // ✅ USE THEME PRIMARY COLOR
        tabBarInactiveTintColor: colors.textTertiary, // ✅ USE THEME TERTIARY TEXT COLOR
        tabBarStyle: {
          backgroundColor: colors.card, // ✅ USE THEME CARD COLOR
          borderTopColor: colors.border, // ✅ USE THEME BORDER COLOR
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          height: 30,
        },
      }}
    >
      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-sharp" size={24} color={color} />
          ),
          tabBarLabel: "Home",
        }}
      />

      <Tabs.Screen
        name="withdraw"
        options={{
          href: null,
          title: "withdraw",
        }}
      />

      {/* Wallet tab */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" size={24} color={color} />
          ),
          tabBarLabel: "Wallet",
        }}
      />

      {/* Profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
          tabBarLabel: "Profile",
        }}
      />

      {/* Hidden Deposit screen (accessed by navigation only) */}
      <Tabs.Screen
        name="deposit"
        options={{
          href: null,
          title: "Deposit",
        }}
      />

      <Tabs.Screen
        name="transfer"
        options={{
          href: null,
          title: "transfer",
        }}
      />

      <Tabs.Screen
        name="payment"
        options={{
          href: null,
          title: "payment",
        }}
      />
    </Tabs>
  );
}
