// ================== app/(auth)/_layout.jsx ==================
import { Stack } from "expo-router";
import { useTheme } from "../context/ThemeContext";

export default function AuthLayout() {
  const { colors, isDarkMode } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary, // ✅ USE THEME PRIMARY COLOR
        tabBarInactiveTintColor: colors.textTertiary, // ✅ USE THEME TERTIARY TEXT COLOR
        tabBarStyle: {
          backgroundColor: colors.card, // ✅ USE THEME CARD COLOR
          borderTopColor: colors.border, // ✅ USE THEME BORDER COLOR
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />
      <Stack.Screen name="account-setup" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
