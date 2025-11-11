// ================== app/_layout.jsx (ROOT LAYOUT UPDATED) ==================
import { Stack } from "expo-router";
import "../global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "../store/authStore";
import { queryClient } from "./lib/queryClient";

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

  // Single effect: Initialize auth once on mount
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("🔍 Initializing authentication...");
        const result = await checkAuth();
        console.log("✅ Auth check complete, user:", !!result?.user);
        console.log("📊 User data:", {
          emailVerified: result?.user?.emailVerified,
          profileCompleted: result?.user?.profileCompleted,
          accountStatus: result?.user?.account?.status,
          accountExists: !!result?.user?.account,
        });

        if (mounted) {
          if (result?.user && result?.token) {
            // Check email verification
            const needsEmailVerification = !result.user.emailVerified;

            // Check account setup
            const needsAccountSetup =
              !result.user.profileCompleted ||
              result.user.account?.status === "pending" ||
              !result.user.account;

            console.log(
              "🔧 Email verification required:",
              needsEmailVerification
            );
            console.log("🔧 Account setup required:", needsAccountSetup);

            setAuthState({
              user: result.user,
              token: result.token,
              requiresEmailVerification: needsEmailVerification,
              requiresAccountSetup: needsAccountSetup,
            });
          }

          setIsInitialized(true);
          console.log("🟢 Initialization complete");
        }
      } catch (error) {
        console.error("❌ Auth check error:", error);
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
      // Check email verification
      const needsEmailVerification = !user.emailVerified;

      // Check account setup
      const needsAccountSetup =
        !user.profileCompleted ||
        user.account?.status === "pending" ||
        !user.account;

      console.log("🔄 User state changed");
      console.log("   - emailVerified:", user.emailVerified);
      console.log("   - requiresEmailVerification:", needsEmailVerification);
      console.log("   - requiresAccountSetup:", needsAccountSetup);

      setAuthState({
        user,
        token,
        requiresEmailVerification: needsEmailVerification,
        requiresAccountSetup: needsAccountSetup,
      });
    } else {
      console.log("🔄 User logged out");
      setAuthState({
        user: null,
        token: null,
        requiresEmailVerification: false,
        requiresAccountSetup: false,
      });
    }
  }, [user, token]);

  console.log("📊 Current routing state:", {
    isInitialized,
    user: !!authState.user,
    token: !!authState.token,
    requiresEmailVerification: authState.requiresEmailVerification,
    requiresAccountSetup: authState.requiresAccountSetup,
  });

  // Show splash screen while checking auth
  if (!isInitialized) {
    console.log("⏳ Not initialized - showing splash screen");
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
          }}
        >
          <Stack.Screen name="(splashScreen)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // User not authenticated → Show auth stack
  if (!authState.user || !authState.token) {
    console.log("🔴 No auth - showing login/auth");
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
          }}
        >
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // ✅ User authenticated but email not verified → Show login/auth screen
  // (Let user manually navigate to verify email if needed)
  if (authState.requiresEmailVerification) {
    console.log("🟡 User authenticated but email not verified - showing auth");
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
          }}
        >
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeAreaProvider>
    );
  }

  // ✅ User authenticated, email verified, but account setup incomplete → Show setup
  if (authState.requiresAccountSetup) {
    console.log(
      "🟡 User authenticated, email verified, but needs account setup"
    );
    return (
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: false,
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

  // ✅ User fully authenticated and account complete → Show main app
  console.log(
    "🟢 User authenticated, email verified, account complete - showing tabs"
  );
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutContent />
    </QueryClientProvider>
  );
}
