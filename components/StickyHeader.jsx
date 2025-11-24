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
    >
      <View className="flex-row justify-between items-center px-5 py-8 mt-4">
        {/* Back Button or Spacer */}
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View className="w-7" />
        )}

        {/* Title */}
        <Text style={{ color: colors.text }} className="text-lg font-bold">
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
    </View>
  );
};

export default StickyHeader;
