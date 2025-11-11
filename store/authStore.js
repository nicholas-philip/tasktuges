// ================== store/authStore.js (RESEND VERIFICATION FIXED) ==================
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://react-native-app-mlpl.onrender.com/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  account: null,
  token: null,
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Register user
  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!username || username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }
      if (!email || !email.includes("@")) {
        throw new Error("Invalid email format");
      }
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      console.log("🔗 Registering user:", username);
      console.log("📍 API URL:", API_URL);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(
          data?.message || `Registration failed: ${response.status}`
        );
      }

      if (!data?.user || !data?.token) {
        throw new Error("Missing user or token in response");
      }

      // ✅ Save to AsyncStorage (including account)
      await AsyncStorage.multiSet([
        ["user", JSON.stringify(data.user)],
        ["account", JSON.stringify(data.account || {})],
        ["token", data.token],
      ]);

      set({
        user: {
          ...data.user,
          account: data.account,
        },
        account: data.account,
        token: data.token,
        isLoading: false,
        error: null,
      });

      console.log("✅ Registration successful:", data.user.email);
      console.log("✅ Account status:", data.account?.status);
      console.log("📧 Email verification code sent - check inbox");

      return {
        success: true,
        user: {
          ...data.user,
          account: data.account,
        },
      };
    } catch (error) {
      const message = error.message || "Network request failed";
      set({ isLoading: false, error: message });
      console.error("❌ Registration error:", message);
      return { success: false, message };
    }
  },

  // ✅ VERIFY EMAIL
  verifyEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      if (!email || !code) {
        throw new Error("Email and verification code are required");
      }

      console.log("🔗 Verifying email:", email);
      console.log("🔐 Code:", code);
      console.log("📍 API URL:", API_URL);

      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Email verification failed");
      }

      // ✅ Update user in store with emailVerified: true
      const currentUser = get().user;
      const updatedUser = {
        ...currentUser,
        emailVerified: true,
      };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });

      console.log("✅ Email verified successfully!");
      console.log("✅ User emailVerified:", updatedUser.emailVerified);

      return {
        success: true,
        user: updatedUser,
      };
    } catch (error) {
      const message = error.message || "Email verification failed";
      set({ isLoading: false, error: message });
      console.error("❌ Email verification error:", message);
      return { success: false, message };
    }
  },

  // ✅ RESEND VERIFICATION CODE - SIMPLIFIED WITHOUT ABORT CONTROLLER
  resendVerificationCode: async (email) => {
    set({ isLoading: true, error: null });
    try {
      if (!email) {
        throw new Error("Email is required");
      }

      console.log("🔗 Resending verification code to:", email);
      console.log("📍 API URL:", API_URL);
      console.log("📍 Full endpoint:", `${API_URL}/auth/resend-verification`);

      const requestBody = { email };
      console.log("📤 Request body:", JSON.stringify(requestBody));

      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📊 Response received");
      console.log("📊 Response status:", response.status);
      console.log("📊 Response ok:", response.ok);

      let data;
      try {
        data = await response.json();
        console.log("📦 Response data:", JSON.stringify(data));
      } catch (parseError) {
        console.error("⚠️ Failed to parse response as JSON");
        console.log("📝 Parse error:", parseError.message);
        data = { message: "Invalid response from server" };
      }

      if (!response.ok) {
        const errorMsg = data?.message || `HTTP ${response.status}`;
        console.error("❌ API Error:", errorMsg);
        throw new Error(errorMsg);
      }

      set({ isLoading: false, error: null });

      console.log("✅ Verification code resent successfully to:", email);

      return {
        success: true,
        message: "Verification code resent successfully",
      };
    } catch (error) {
      const message = error?.message || "Failed to resend verification code";
      set({ isLoading: false, error: message });
      console.error("❌ Resend error:", message);
      return { success: false, message };
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      console.log("🔗 Logging in user:", email);
      console.log("📍 API URL:", API_URL);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(data?.message || `Login failed: ${response.status}`);
      }

      if (!data?.user || !data?.token) {
        throw new Error("Missing user or token in response");
      }

      // ✅ Save to AsyncStorage (including account)
      await AsyncStorage.multiSet([
        ["user", JSON.stringify(data.user)],
        ["account", JSON.stringify(data.account || {})],
        ["token", data.token],
      ]);

      set({
        user: {
          ...data.user,
          account: data.account,
        },
        account: data.account,
        token: data.token,
        isLoading: false,
        error: null,
      });

      console.log("✅ Login successful:", data.user.email);
      console.log("✅ Email verified:", data.user.emailVerified);
      console.log("✅ Profile completed:", data.user.profileCompleted);
      console.log("✅ Account status:", data.account?.status);

      return {
        success: true,
        user: {
          ...data.user,
          account: data.account,
        },
      };
    } catch (error) {
      const message = error.message || "Network request failed";
      set({ isLoading: false, error: message });
      console.error("❌ Login error:", message);
      return { success: false, message };
    }
  },

  // Check auth status on app startup
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      console.log("🔍 [checkAuth] Starting auth check...");

      const allKeys = await AsyncStorage.getAllKeys();
      console.log("📦 [checkAuth] All stored keys:", allKeys);

      const [userJson, accountJson, token] = await AsyncStorage.multiGet([
        "user",
        "account",
        "token",
      ]);

      console.log("📊 [checkAuth] Raw storage data:");
      console.log("   - userJson[0]:", userJson[0]);
      console.log("   - userJson[1] exists:", !!userJson[1]);
      console.log("   - accountJson[0]:", accountJson[0]);
      console.log("   - accountJson[1] exists:", !!accountJson[1]);
      console.log("   - token[0]:", token[0]);
      console.log("   - token[1] exists:", !!token[1]);

      let user = null;
      let account = null;

      if (userJson[1]) {
        try {
          user = JSON.parse(userJson[1]);
          console.log("✅ [checkAuth] User parsed successfully:", user.email);
          console.log("   - profileCompleted:", user.profileCompleted);
          console.log("   - emailVerified:", user.emailVerified);
        } catch (e) {
          console.error("❌ [checkAuth] Error parsing user data:", e.message);
          throw new Error("Invalid user data stored");
        }
      } else {
        console.log("⚠️ [checkAuth] No user data found in storage");
      }

      if (accountJson[1]) {
        try {
          account = JSON.parse(accountJson[1]);
          console.log("✅ [checkAuth] Account parsed successfully");
          console.log("   - status:", account?.status);
          console.log("   - accountNumber:", account?.accountNumber);
        } catch (e) {
          console.error(
            "⚠️ [checkAuth] Error parsing account data:",
            e.message
          );
        }
      } else {
        console.log("⚠️ [checkAuth] No account data found in storage");
      }

      if (user && token[1]) {
        console.log("✅ [checkAuth] User and token found - setting state");
        set({
          user: {
            ...user,
            account,
          },
          account,
          token: token[1],
          isLoading: false,
        });
        console.log("✅ [checkAuth] Auth state set successfully");
        console.log("📊 [checkAuth] Final auth state:");
        console.log("   - user:", user.email);
        console.log("   - profileCompleted:", user.profileCompleted);
        console.log("   - emailVerified:", user.emailVerified);
        console.log("   - account.status:", account?.status);

        return {
          success: true,
          user: {
            ...user,
            account,
          },
        };
      } else {
        console.log("❌ [checkAuth] User or token missing - clearing auth");
        console.log("   - user exists:", !!user);
        console.log("   - token exists:", !!token[1]);
        set({ user: null, account: null, token: null, isLoading: false });
        return { success: false };
      }
    } catch (error) {
      console.error("❌ [checkAuth] Error:", error.message);
      set({ isLoading: false, error: error.message });
      return { success: false, message: error.message };
    }
  },

  // Logout user
  logout: async () => {
    set({ isLoading: true });
    try {
      console.log("🚀 [LOGOUT] Starting hard reset...");

      // Get all keys first
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("📦 [LOGOUT] Removing keys:", allKeys);

      // Remove all keys
      await AsyncStorage.multiRemove(allKeys);

      console.log("✅ [LOGOUT] All data cleared from storage");

      // Reset state
      set({
        user: null,
        account: null,
        token: null,
        isLoading: false,
        error: null,
      });

      console.log("✅ [LOGOUT] Auth state reset");
      return { success: true };
    } catch (error) {
      console.error("❌ [LOGOUT] Error:", error.message);
      set({ isLoading: false, error: error.message });
      return { success: false, message: error.message };
    }
  },

  // ✅ Update user profile
  updateUserProfile: async (updates) => {
    try {
      const user = get().user;
      if (!user) {
        throw new Error("Not authenticated");
      }

      const updatedUser = { ...user, ...updates };

      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });

      console.log("✅ User profile updated");
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error("❌ Profile update error:", error.message);
      return { success: false, message: error.message };
    }
  },

  // ✅ Update account data
  updateAccount: async (accountData) => {
    try {
      const account = { ...get().account, ...accountData };
      const user = get().user;

      await AsyncStorage.setItem("account", JSON.stringify(account));
      set({
        account,
        user: {
          ...user,
          account,
        },
      });

      console.log("✅ Account data updated");
      return { success: true, account };
    } catch (error) {
      console.error("❌ Account update error:", error.message);
      return { success: false, message: error.message };
    }
  },

  // Get auth headers for API calls
  getAuthHeaders: () => {
    const token = get().token;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  // Refresh auth from storage
  refreshAuth: async () => {
    try {
      const [userJson, accountJson, token] = await AsyncStorage.multiGet([
        "user",
        "account",
        "token",
      ]);

      if (userJson[1] && token[1]) {
        const user = JSON.parse(userJson[1]);
        const account = accountJson[1] ? JSON.parse(accountJson[1]) : null;

        set({
          user: {
            ...user,
            account,
          },
          account,
          token: token[1],
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Error refreshing auth:", error.message);
      return false;
    }
  },
}));
