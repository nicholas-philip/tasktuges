// app/_layout.jsx (ROOT LAYOUT WITH THEME & HIDDEN NAV BAR)
import { Stack } from "expo-router";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";

import { useAuthStore } from "../store/authStore";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function RootLayoutContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);
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

  // ✅ HIDE ANDROID NAVIGATION BAR
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("overlay-swipe");
    }
  }, []);

  // Single effect: Initialize auth once on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const result = await checkAuth();

        if (mounted) {
          if (result?.user && result?.token) {
            // Refresh user from server when a token exists to avoid stale local data
            // (ensures account.status and profileCompleted are accurate)
            let fresh = null;
            try {
              const refreshed = await getCurrentUser();
              if (refreshed?.success && refreshed.user) {
                fresh = { user: refreshed.user, account: refreshed.account };
              }
            } catch (_e) {
              // ignore refresh errors and fall back to local result
              fresh = null;
            }

            const effective = fresh?.user
              ? { user: fresh.user, account: fresh.account }
              : { user: result.user, account: result.user.account };

            const needsEmailVerification = !effective.user.emailVerified;

            // If we couldn't refresh from server (fresh === null), be conservative
            // and require account setup so users are not routed into the app
            // based on possibly-stale local data.
            let needsAccountSetup =
              !effective.user.profileCompleted ||
              effective.user.account?.status === "pending" ||
              !effective.user.account;

            if (!fresh) {
              console.warn(
                "⚠️ [RootLayout] Server refresh failed — forcing requiresAccountSetup to true to avoid premature navigation"
              );
              needsAccountSetup = true;
            }

            setAuthState({
              user: effective.user,
              token: result.token,
              requiresEmailVerification: needsEmailVerification,
              requiresAccountSetup: needsAccountSetup,
            });
          }

          setIsInitialized(true);
        }
      } catch (_error) {
        if (mounted) {
          setIsInitialized(true);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [checkAuth, getCurrentUser]);

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
            // Provide top padding so stack content does not sit under the global TopNav
            contentStyle: {
              backgroundColor: colors.background,
            },
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
            contentStyle: {
              backgroundColor: colors.background,
            },
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
            contentStyle: {
              backgroundColor: colors.background,
            },
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
            contentStyle: {
              backgroundColor: colors.background,
              paddingTop: 72,
            },
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
