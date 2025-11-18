// ================== app/hooks/useApi.js ==================
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
      // Continue without auth if token retrieval fails
    }
  }

  // Handle URL construction to avoid double slashes
  let fullUrl;
  if (endpoint.startsWith("/")) {
    fullUrl = `${API_URL}${endpoint}`;
  } else {
    fullUrl = `${API_URL}/${endpoint}`;
  }

  // Remove any double slashes (except in protocol)
  fullUrl = fullUrl.replace(/([^:]\/)\/+/g, "$1");

  let requestBody = undefined;
  if (body) {
    requestBody = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: requestBody,
      timeout: 30000,
    });

    const statusCode = response.status;

    // Parse JSON response
    let data;
    try {
      const responseText = await response.text();

      if (!responseText) {
        data = { success: true };
      } else {
        data = JSON.parse(responseText);
      }
    } catch (parseError) {
      throw new Error("Invalid server response");
    }

    // Check for 2xx status codes
    if (statusCode >= 200 && statusCode < 300) {
      return data;
    } else {
      const errorMessage = data?.message || data?.error || `HTTP ${statusCode}`;
      throw new Error(errorMessage);
    }
  } catch (error) {
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
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      options.onSuccess?.(response);
    },
    onError: (error) => {
      options.onError?.(error);
    },
  });
}
