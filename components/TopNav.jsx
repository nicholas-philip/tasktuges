import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../app/context/ThemeContext";
import { useRouter } from "expo-router";

export default function TopNav({ title }) {
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();

  const height = (insets.top || 20) + 56;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
        paddingTop: insets.top || 20,
        // Make the nav transparent so the underlying page background (gradient
        // or color) shows through. Keep a subtle border using the theme's
        // overlay color to separate the nav from content when needed.
        backgroundColor: "transparent",
        borderBottomColor: colors.overlay || "rgba(0,0,0,0.06)",
        borderBottomWidth: 1,
        zIndex: 1000,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)/profile")}
          style={{ width: 44, alignItems: "flex-start" }}
        >
          <Ionicons
            name="person-circle-outline"
            size={28}
            color={isDarkMode ? "white" : "black"}
          />
        </TouchableOpacity>

        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
          {title || "Dashboard"}
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/utils/notifications")}
          style={{ width: 44, alignItems: "flex-end" }}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={isDarkMode ? "white" : "black"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
