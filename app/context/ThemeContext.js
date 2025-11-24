// app/context/ThemeContext.js - ENHANCED
import React, { createContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";

export const ThemeContext = createContext();

export const LIGHT_THEME = {
  mode: "light",
  colors: {
    // Base colors
    background: "#FFFFFF",
    surface: "#F9FAFB",
    text: "#000000ff",
    textSecondary: "#000000ff",
    textTertiary: "#000000ff",
    border: "#c8ccd4ff",
    separator: "#D1D5DB",

    // Primary colors
    primary: "#3B82F6",
    primaryLight: "#DBEAFE",

    // Status colors
    success: "#10B981",
    successLight: "#D1FAE5",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
    error: "#EF4444",
    errorLight: "#FEE2E2",

    // Component colors
    card: "#FFFFFF",
    cardBorder: "#E5E7EB",
    overlay: "rgba(0, 0, 0, 0.5)",
    inputBackground: "#F3F4F6",
    inputBorder: "#D1D5DB",

    // Auth specific
    authBackground: "#FFFFFF",
    authCard: "#FFFFFF",
    authCardBorder: "#ffffffff",
  },
};

export const DARK_THEME = {
  mode: "dark",
  colors: {
    // Base colors
    background: "#07050eff",
    surface: "#07050eff",
    text: "#fdfdfdff",
    textSecondary: "#ffffffff",
    textTertiary: "#ffffffff",
    border: "#504f4fff",
    separator: "#ffffffff",

    // Primary colors
    primary: "#60A5FA",
    primaryLight: "#1E3A8A",

    // Status colors
    success: "#10B981",
    successLight: "#064E3B",
    warning: "#F59E0B",
    warningLight: "#78350F",
    error: "#EF4444",
    errorLight: "#7F1D1D",

    // Component colors
    card: "#03030eff",
    cardBorder: "#797474ff",
    overlay: "rgba(0, 0, 0, 0.8)",
    inputBackground: "#0c0b0bff",
    inputBorder: "#1d1c1cff",

    // Auth specific
    authBackground: "#000000ff",
    authCard: "#000000ff",
    authCardBorder: "#000000ff",
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
        console.error("Theme loading error:", error);
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
      console.error("Theme toggle error:", error);
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
      console.error("Dark mode error:", error);
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
      console.error("Light mode error:", error);
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
      console.error("System mode error:", error);
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
