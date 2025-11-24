// ================== src/(tabs)/_layout.jsx - WITH THEME & BG COLOR ==================
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

export default function TabLayout() {
  const { colors, isDarkMode } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // ✅ ADD THIS - Set background color for the entire tab container
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 75,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
          tabBarLabel: "Home",
        }}
      />

      {/* Wallet tab */}
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" color={color} size={size} />
          ),
          tabBarLabel: "Wallet",
        }}
      />

      {/* Profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
          tabBarLabel: "Profile",
        }}
      />

      {/* Hidden screens (accessed by navigation only) */}
      <Tabs.Screen
        name="deposit"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="withdraw"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="transfer"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
