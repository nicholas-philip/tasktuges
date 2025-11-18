// app/_layout.jsx (ROOT LAYOUT WITH THEME)
import { Stack } from "expo-router";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "../store/authStore";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function RootLayoutContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [isInitialized, setIsInitialized] = useState(false);
  const [authState, setAuthState] = useState({
    user: null,
    token: null,
    requiresEmailVerification: false,
    requiresAccountSetup: false,
  });

  const { isDarkMode, colors } = useTheme();

  // Single effect: Initialize auth once on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const result = await checkAuth();

        if (mounted) {
          if (result?.user && result?.token) {
            const needsEmailVerification = !result.user.emailVerified;

            const needsAccountSetup =
              !result.user.profileCompleted ||
              result.user.account?.status === "pending" ||
              !result.user.account;

            setAuthState({
              user: result.user,
              token: result.token,
              requiresEmailVerification: needsEmailVerification,
              requiresAccountSetup: needsAccountSetup,
            });
          }

          setIsInitialized(true);
        }
      } catch (error) {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  // Effect: Re-check auth state when user/token changes
  useEffect(() => {
    if (user && token) {
      const needsEmailVerification = !user.emailVerified;

      const needsAccountSetup =
        !user.profileCompleted ||
        user.account?.status === "pending" ||
        !user.account;

      setAuthState({
        user,
        token,
        requiresEmailVerification: needsEmailVerification,
        requiresAccountSetup: needsAccountSetup,
      });
    } else {
      setAuthState({
        user: null,
        token: null,
        requiresEmailVerification: false,
        requiresAccountSetup: false,
      });
    }
  }, [user, token]);

  // Show splash screen while checking auth
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(splashScreen)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // User not authenticated → Show auth stack
  if (!authState.user || !authState.token) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // User authenticated but email not verified
  if (authState.requiresEmailVerification) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // User authenticated, email verified, but account setup incomplete
  if (authState.requiresAccountSetup) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="(auth)/account-setup"
            options={{
              gestureEnabled: false,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // User fully authenticated and account complete
  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RootLayoutContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
