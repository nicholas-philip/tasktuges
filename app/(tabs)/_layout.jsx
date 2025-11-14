// src/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      {/* Home tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "index",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-sharp" size={24} color={color} />
          ),
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
        }}
      />

      {/* Profile tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color="black" />
          ),
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
