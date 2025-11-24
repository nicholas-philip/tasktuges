// ================== src/components/StickyHeader.jsx ==================
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../app/context/ThemeContext";

const StickyHeader = ({ title, showBack = true, rightIcon = null }) => {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }}
      className="flex-row justify-between items-center px-5 py-4 shadow-lg mt-2"
    >
      {/* Back Button or Spacer */}
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} className="mt-6">
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View className="w-7" />
      )}

      {/* Title */}
      <Text style={{ color: colors.text }} className="text-lg font-bold mt-6">
        {title}
      </Text>

      {/* Right Icon or Spacer */}
      {rightIcon ? (
        <TouchableOpacity onPress={rightIcon.onPress}>
          <Ionicons name={rightIcon.icon} size={28} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View className="w-7" />
      )}
    </View>
  );
};

export default StickyHeader;
