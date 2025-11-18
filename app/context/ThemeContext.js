// app/context/ThemeContext.js
import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export const ThemeContext = createContext();

export const LIGHT_THEME = {
  mode: "light",
  colors: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    text: "#000000",
    textSecondary: "#666666",
    textTertiary: "#999999",
    border: "#E0E0E0",
    primary: "#3B82F6",
    primaryLight: "#DBEAFE",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    successLight: "#ECFDF5",
    warningLight: "#FFFBEB",
    card: "#FFFFFF",
    cardBorder: "#E5E7EB",
    overlay: "rgba(0, 0, 0, 0.5)",
    inputBackground: "#F9FAFB",
    inputBorder: "#D1D5DB",
    separator: "#E5E7EB",
  },
};

export const DARK_THEME = {
  mode: "dark",
  colors: {
    background: "#0F172A",
    surface: "#1E293B",
    text: "#FFFFFF",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    border: "#334155",
    primary: "#3B82F6",
    primaryLight: "#1E3A8A",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    errorLight: "#7F1D1D",
    successLight: "#064E3B",
    warningLight: "#78350F",
    card: "#1E293B",
    cardBorder: "#334155",
    overlay: "rgba(0, 0, 0, 0.8)",
    inputBackground: "#0F172A",
    inputBorder: "#334155",
    separator: "#334155",
  },
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState("system"); // "system", "light", "dark"

  // Load theme preference from AsyncStorage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem("appThemeMode");

        if (savedThemeMode) {
          // User has saved preference
          setThemeMode(savedThemeMode);
          if (savedThemeMode === "light") {
            setIsDarkMode(false);
            setTheme(LIGHT_THEME);
          } else if (savedThemeMode === "dark") {
            setIsDarkMode(true);
            setTheme(DARK_THEME);
          } else {
            // system mode - use device setting
            const isDark = systemColorScheme === "dark";
            setIsDarkMode(isDark);
            setTheme(isDark ? DARK_THEME : LIGHT_THEME);
          }
        } else {
          // No saved preference - use system
          setThemeMode("system");
          const isDark = systemColorScheme === "dark";
          setIsDarkMode(isDark);
          setTheme(isDark ? DARK_THEME : LIGHT_THEME);
        }
      } catch (error) {
        // Default to light theme on error
        setThemeMode("system");
        setIsDarkMode(false);
        setTheme(LIGHT_THEME);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Listen to system theme changes (only if in system mode)
  useEffect(() => {
    if (themeMode === "system" && systemColorScheme) {
      const isDark = systemColorScheme === "dark";
      setIsDarkMode(isDark);
      setTheme(isDark ? DARK_THEME : LIGHT_THEME);
    }
  }, [systemColorScheme, themeMode]);

  // Toggle theme (light/dark only)
  const toggleTheme = useCallback(async () => {
    try {
      const newIsDarkMode = !isDarkMode;
      setIsDarkMode(newIsDarkMode);
      setTheme(newIsDarkMode ? DARK_THEME : LIGHT_THEME);
      setThemeMode(newIsDarkMode ? "dark" : "light");

      await AsyncStorage.setItem(
        "appThemeMode",
        newIsDarkMode ? "dark" : "light"
      );
    } catch (error) {
      // Revert on error
      setIsDarkMode(isDarkMode);
      setTheme(isDarkMode ? DARK_THEME : LIGHT_THEME);
    }
  }, [isDarkMode]);

  // Set theme to dark mode
  const setDarkMode = useCallback(async () => {
    try {
      setIsDarkMode(true);
      setTheme(DARK_THEME);
      setThemeMode("dark");
      await AsyncStorage.setItem("appThemeMode", "dark");
    } catch (error) {
      setIsDarkMode(false);
      setTheme(LIGHT_THEME);
    }
  }, []);

  // Set theme to light mode
  const setLightMode = useCallback(async () => {
    try {
      setIsDarkMode(false);
      setTheme(LIGHT_THEME);
      setThemeMode("light");
      await AsyncStorage.setItem("appThemeMode", "light");
    } catch (error) {
      setIsDarkMode(true);
      setTheme(DARK_THEME);
    }
  }, []);

  // Set theme to system (follow device setting)
  const setSystemMode = useCallback(async () => {
    try {
      await AsyncStorage.setItem("appThemeMode", "system");
      setThemeMode("system");

      // Immediately apply system theme
      if (systemColorScheme) {
        const isDark = systemColorScheme === "dark";
        setIsDarkMode(isDark);
        setTheme(isDark ? DARK_THEME : LIGHT_THEME);
      }
    } catch (error) {
      // Fallback
    }
  }, [systemColorScheme]);

  if (isLoading || !theme) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        themeMode,
        toggleTheme,
        setDarkMode,
        setLightMode,
        setSystemMode,
        colors: theme.colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
