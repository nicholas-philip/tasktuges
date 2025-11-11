// ================== app/hooks/useApi.js (FIXED) ==================
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "https://react-native-app-mlpl.onrender.com/api";

console.log("🔗 API Base URL:", API_URL);

export async function getAuthToken() {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      return null;
    }
    return token;
  } catch (error) {
    console.error("❌ Error getting auth token:", error.message);
    return null;
  }
}

export async function apiFetch(endpoint, options = {}) {
  const { method = "GET", body, requiresAuth = true } = options;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add auth token if required
  if (requiresAuth) {
    try {
      const token = await getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("⚠️ Could not retrieve auth token");
    }
  }

  // ✅ FIX: Handle URL construction to avoid double slashes
  let fullUrl;
  if (endpoint.startsWith("/")) {
    // Endpoint has leading slash, just concatenate
    fullUrl = `${API_URL}${endpoint}`;
  } else {
    // Endpoint doesn't have leading slash, add it
    fullUrl = `${API_URL}/${endpoint}`;
  }

  // Remove any double slashes (except in protocol)
  fullUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");

  console.log("🔗 API Request:", {
    url: fullUrl,
    method,
    hasAuth: requiresAuth,
  });

  let requestBody = undefined;
  if (body) {
    requestBody = typeof body === "string" ? body : JSON.stringify(body);
    console.log("📦 Request body:", requestBody.substring(0, 100) + "...");
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
      timeout: 30000,
    });

    console.log("📊 API Response Status:", response.status);

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("❌ Failed to parse JSON response");
      throw new Error("Invalid server response");
    }

    if (!response.ok) {
      const errorMessage = data?.message || `API Error: ${response.status}`;
      console.error("❌ API Error:", errorMessage);
      throw new Error(errorMessage);
    }

    console.log("✅ API Success:", endpoint);
    return data;
  } catch (error) {
    console.error("❌ API Fetch Failed:", {
      endpoint,
      error: error.message,
      url: fullUrl,
    });
    throw error;
  }
}

export function useApiQuery(queryKey, url, options = {}) {
  return useQuery({
    queryKey,
    queryFn: () => apiFetch(url),
    retry: 1,
    ...options,
  });
}

export function useApiMutation(mutationUrl, invalidateKeys = [], options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiFetch(mutationUrl, {
        method: options.method || "POST",
        body: data,
      }),
    onSuccess: (response) => {
      console.log("✅ Mutation successful, invalidating keys:", invalidateKeys);
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      options.onSuccess?.(response);
    },
    onError: (error) => {
      console.error("❌ Mutation failed:", error.message);
      options.onError?.(error);
    },
  });
}
