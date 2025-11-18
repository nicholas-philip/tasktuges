// components/ThemeToggle.jsx
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../app/context/ThemeContext";
import { Sun, Moon, Smartphone } from "lucide-react-native";

export const ThemeToggle = () => {
  const { themeMode, setDarkMode, setLightMode, setSystemMode, colors } =
    useTheme();

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <View className="p-4 border-b" style={{ borderColor: colors.border }}>
        <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">
          Theme Preference
        </Text>

        <View className="gap-3">
          {/* Light Mode Button */}
          <TouchableOpacity
            onPress={setLightMode}
            style={{
              backgroundColor:
                themeMode === "light" ? colors.primary : colors.inputBackground,
              borderWidth: 2,
              borderColor:
                themeMode === "light" ? colors.primary : colors.border,
            }}
            className="flex-row items-center justify-between p-4 rounded-lg"
          >
            <View className="flex-row items-center gap-3">
              <Sun
                size={24}
                color={
                  themeMode === "light" ? colors.background : colors.primary
                }
              />
              <View>
                <Text
                  style={{
                    color:
                      themeMode === "light" ? colors.background : colors.text,
                  }}
                  className="text-base font-semibold"
                >
                  Light Mode
                </Text>
                <Text
                  style={{
                    color:
                      themeMode === "light"
                        ? colors.background
                        : colors.textTertiary,
                  }}
                  className="text-xs mt-1"
                >
                  Always use light theme
                </Text>
              </View>
            </View>
            {themeMode === "light" && (
              <View
                style={{
                  borderColor: colors.background,
                  backgroundColor: colors.background,
                }}
                className="w-5 h-5 rounded-full border-2"
              />
            )}
          </TouchableOpacity>

          {/* Dark Mode Button */}
          <TouchableOpacity
            onPress={setDarkMode}
            style={{
              backgroundColor:
                themeMode === "dark" ? colors.primary : colors.inputBackground,
              borderWidth: 2,
              borderColor:
                themeMode === "dark" ? colors.primary : colors.border,
            }}
            className="flex-row items-center justify-between p-4 rounded-lg"
          >
            <View className="flex-row items-center gap-3">
              <Moon
                size={24}
                color={
                  themeMode === "dark" ? colors.background : colors.primary
                }
              />
              <View>
                <Text
                  style={{
                    color:
                      themeMode === "dark" ? colors.background : colors.text,
                  }}
                  className="text-base font-semibold"
                >
                  Dark Mode
                </Text>
                <Text
                  style={{
                    color:
                      themeMode === "dark"
                        ? colors.background
                        : colors.textTertiary,
                  }}
                  className="text-xs mt-1"
                >
                  Always use dark theme
                </Text>
              </View>
            </View>
            {themeMode === "dark" && (
              <View
                style={{
                  borderColor: colors.background,
                  backgroundColor: colors.background,
                }}
                className="w-5 h-5 rounded-full border-2"
              />
            )}
          </TouchableOpacity>

          {/* System Mode Button */}
          <TouchableOpacity
            onPress={setSystemMode}
            style={{
              backgroundColor:
                themeMode === "system"
                  ? colors.primary
                  : colors.inputBackground,
              borderWidth: 2,
              borderColor:
                themeMode === "system" ? colors.primary : colors.border,
            }}
            className="flex-row items-center justify-between p-4 rounded-lg"
          >
            <View className="flex-row items-center gap-3">
              <Smartphone
                size={24}
                color={
                  themeMode === "system" ? colors.background : colors.primary
                }
              />
              <View>
                <Text
                  style={{
                    color:
                      themeMode === "system" ? colors.background : colors.text,
                  }}
                  className="text-base font-semibold"
                >
                  System
                </Text>
                <Text
                  style={{
                    color:
                      themeMode === "system"
                        ? colors.background
                        : colors.textTertiary,
                  }}
                  className="text-xs mt-1"
                >
                  Follow device setting
                </Text>
              </View>
            </View>
            {themeMode === "system" && (
              <View
                style={{
                  borderColor: colors.background,
                  backgroundColor: colors.background,
                }}
                className="w-5 h-5 rounded-full border-2"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Simple toggle for quick switching (light/dark only)
export const SimpleThemeToggle = () => {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={{
        backgroundColor: isDarkMode ? colors.primary : colors.primaryLight,
        padding: 12,
        borderRadius: 8,
      }}
      className="flex-row items-center justify-center gap-2"
    >
      {isDarkMode ? (
        <>
          <Moon size={20} color={colors.background} />
          <Text style={{ color: colors.background }} className="font-semibold">
            Dark
          </Text>
        </>
      ) : (
        <>
          <Sun size={20} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="font-semibold">
            Light
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};
