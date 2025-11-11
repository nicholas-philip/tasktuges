// ================== app/hooks/useWallet.js ==================
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// Get wallet balance
export function useGetBalance() {
  return useQuery({
    queryKey: ["wallet", "balance"],
    queryFn: () => apiFetch("/wallet/balance"),
    retry: 2,
  });
}

// Get wallet statistics (last 30 days)
export function useGetStats() {
  return useQuery({
    queryKey: ["wallet", "stats"],
    queryFn: () => apiFetch("/wallet/stats"),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// Get recent transactions (last 10)
export function useGetRecentTransactions() {
  return useQuery({
    queryKey: ["wallet", "recent"],
    queryFn: () => apiFetch("/wallet/recent"),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

export default {
  useGetBalance,
  useGetStats,
  useGetRecentTransactions,
};
