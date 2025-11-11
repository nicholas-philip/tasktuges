import React from "react";
import { View, Text, TouchableOpacity, StatusBar } from "react-native";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "expo-router";

export default function Home() {
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)");
  };

  return (
    <View className="flex-1 bg-gray-900 justify-center items-center px-6">
      <StatusBar barStyle="light-content" />
      <View className="w-full bg-gray-800 py-6 px-8 rounded-2xl shadow-lg">
        <Text className="text-white text-2xl font-bold mb-4 text-center">
          Welcome, {user?.username || "User"} 👋
        </Text>

        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 py-4 rounded-2xl active:opacity-80"
        >
          <Text className="text-white text-center text-lg font-semibold">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
