// ================== store/authStore.js (FIXED WITH BETTER ERROR HANDLING) ==================
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://react-native-app-mlpl.onrender.com/api";

console.log("🔗 Auth API Base URL:", API_URL);

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

  // ✅ LOGIN WITH BETTER ERROR HANDLING
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
      console.log("📊 Response headers:", response.headers);

      // ✅ FIX: Check content type before parsing
      const contentType = response.headers.get("content-type");
      console.log("📝 Content-Type:", contentType);

      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Not JSON, likely HTML error page
        const text = await response.text();
        console.error("❌ Non-JSON response received:");
        console.error(
          "📄 Response text (first 500 chars):",
          text.substring(0, 500)
        );
        throw new Error(
          `Server returned ${response.status} - Check backend logs for errors`
        );
      }

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

  // ✅ REGISTER
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
      console.log("📍 Full URL:", `${API_URL}/auth/register`);

      const response = await fetchWithTimeout(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        },
        60000
      );

      console.log("📊 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("❌ Non-JSON response:", text.substring(0, 500));
        throw new Error(
          `Server returned ${response.status} - Check backend logs`
        );
      }

      console.log("📦 Response data:", data);

      if (!response.ok) {
        throw new Error(
          data?.message || `Registration failed: ${response.status}`
        );
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

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Server error: ${response.status}`);
      }

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

  // ✅ RESEND VERIFICATION CODE
  resendVerificationCode: async (email) => {
    set({ isLoading: true, error: null });

    const startTime = Date.now();
    console.log("⏱️ [RESEND] Request started at:", new Date().toISOString());

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      const response = await fetchWithTimeout(
        `${API_URL}/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
        60000
      );

      const duration = Date.now() - startTime;
      console.log(`⏱️ [RESEND] Request completed in ${duration}ms`);
      console.log("📊 [RESEND] Response status:", response.status);

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data?.message || `Server error: ${response.status}`);
      }

      set({ isLoading: false, error: null });
      console.log("✅ [RESEND] Code resent to:", email);

      return {
        success: true,
        message: data?.message || "Verification code resent successfully",
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [RESEND] Failed after ${duration}ms:`, error.message);

      let userMessage = error.message || "Failed to resend verification code";

      set({ isLoading: false, error: userMessage });
      return { success: false, message: userMessage };
    }
  },

  // ✅ GET CURRENT USER
  getCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetchWithTimeout(
        `${API_URL}/auth/me`,
        {
          method: "GET",
          headers: get().getAuthHeaders(),
        },
        60000
      );

      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        throw new Error(`Server error: ${response.status}`);
      }

      if (!response.ok)
        throw new Error(data?.message || "Failed to fetch user");

      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      if (data.account) {
        await AsyncStorage.setItem("account", JSON.stringify(data.account));
      }

      set({ user: data.user, account: data.account || null, isLoading: false });
      return { success: true, user: data.user, account: data.account };
    } catch (error) {
      set({ isLoading: false, error: error.message });
      console.error("❌ [getCurrentUser] Error:", error.message);
      return { success: false, message: error.message };
    }
  },

  // ✅ CHECK AUTH
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

  // ✅ LOGOUT
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

  // ✅ UPDATE USER PROFILE
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

  // ✅ GET AUTH HEADERS
  getAuthHeaders: () => {
    const token = get().token;
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  // ✅ REFRESH AUTH
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
