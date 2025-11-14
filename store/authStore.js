// ================== store/authStore.js (WITH TIMEOUT FIX) ==================
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://react-native-app-mlpl.onrender.com/api";

// ✅ HELPER: Fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeout = 60000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw new Error("Request timeout - server took too long to respond");
    }
    throw error;
  }
};

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
      console.log("📍 Full URL:", `${API_URL}/auth/register`);

      const response = await fetchWithTimeout(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        },
        60000 // 60 second timeout
      );

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

      // ✅ Save to AsyncStorage
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
      console.log("📍 Full URL:", `${API_URL}/auth/verify-email`);

      const response = await fetchWithTimeout(
        `${API_URL}/auth/verify-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        },
        60000
      );

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(data?.message || "Email verification failed");
      }

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

  // ✅ RESEND VERIFICATION CODE - WITH BETTER ERROR HANDLING
  resendVerificationCode: async (email) => {
    set({ isLoading: true, error: null });

    const startTime = Date.now();
    console.log("⏱️ [RESEND] Request started at:", new Date().toISOString());

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      console.log("🔄 [RESEND] Resending code to:", email);
      console.log("📍 [RESEND] API URL:", API_URL);
      console.log(
        "📍 [RESEND] Full endpoint:",
        `${API_URL}/auth/resend-verification`
      );

      const requestBody = { email };
      console.log("📤 [RESEND] Request body:", JSON.stringify(requestBody));

      // ✅ Use fetch with timeout
      const response = await fetchWithTimeout(
        `${API_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
        60000 // 60 second timeout
      );

      const duration = Date.now() - startTime;
      console.log(`⏱️ [RESEND] Request completed in ${duration}ms`);
      console.log("📊 [RESEND] Response status:", response.status);
      console.log("📊 [RESEND] Response ok:", response.ok);

      let data;
      try {
        const responseText = await response.text();
        console.log("📝 [RESEND] Raw response:", responseText);
        data = JSON.parse(responseText);
        console.log("📦 [RESEND] Parsed data:", JSON.stringify(data));
      } catch (parseError) {
        console.error("⚠️ [RESEND] JSON parse error:", parseError.message);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        const errorMsg = data?.message || `Server error: ${response.status}`;
        console.error("❌ [RESEND] API Error:", errorMsg);
        throw new Error(errorMsg);
      }

      set({ isLoading: false, error: null });

      console.log("✅ [RESEND] Success! Code resent to:", email);

      return {
        success: true,
        message: data?.message || "Verification code resent successfully",
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [RESEND] Failed after ${duration}ms`);
      console.error("❌ [RESEND] Error type:", error.name);
      console.error("❌ [RESEND] Error message:", error.message);

      let userMessage = "Failed to resend verification code";

      // Provide specific error messages
      if (error.message.includes("timeout")) {
        userMessage = "Request timeout. Server is slow. Please try again.";
      } else if (error.message.includes("Network request failed")) {
        userMessage = "Network error. Check your internet connection.";
      } else if (error.message.includes("Invalid response")) {
        userMessage = "Server error. Please try again later.";
      } else {
        userMessage = error.message;
      }

      set({ isLoading: false, error: userMessage });
      return { success: false, message: userMessage };
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
      console.log("📍 Full URL:", `${API_URL}/auth/login`);

      const response = await fetchWithTimeout(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
        60000
      );

      console.log("📊 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(data?.message || `Login failed: ${response.status}`);
      }

      if (!data?.user || !data?.token) {
        throw new Error("Missing user or token in response");
      }

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

      const [userJson, accountJson, token] = await AsyncStorage.multiGet([
        "user",
        "account",
        "token",
      ]);

      let user = null;
      let account = null;

      if (userJson[1]) {
        user = JSON.parse(userJson[1]);
        console.log("✅ [checkAuth] User found:", user.email);
      }

      if (accountJson[1]) {
        account = JSON.parse(accountJson[1]);
        console.log("✅ [checkAuth] Account found:", account?.accountNumber);
      }

      if (user && token[1]) {
        set({
          user: { ...user, account },
          account,
          token: token[1],
          isLoading: false,
        });
        return { success: true, user: { ...user, account } };
      } else {
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
      console.log("🚀 [LOGOUT] Starting logout...");
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);

      set({
        user: null,
        account: null,
        token: null,
        isLoading: false,
        error: null,
      });

      console.log("✅ [LOGOUT] Logout successful");
      return { success: true };
    } catch (error) {
      console.error("❌ [LOGOUT] Error:", error.message);
      set({ isLoading: false, error: error.message });
      return { success: false, message: error.message };
    }
  },

  // Update user profile
  updateUserProfile: async (updates) => {
    try {
      const user = get().user;
      if (!user) throw new Error("Not authenticated");

      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      set({ user: updatedUser });

      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Update account data
  updateAccount: async (accountData) => {
    try {
      const account = { ...get().account, ...accountData };
      const user = get().user;

      await AsyncStorage.setItem("account", JSON.stringify(account));
      set({ account, user: { ...user, account } });

      return { success: true, account };
    } catch (error) {
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
          user: { ...user, account },
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
