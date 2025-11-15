// ================== app/hooks/useTransactions.js (PAYSTACK TRANSFER) ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// ✅ Initialize Paystack payment/transfer (shared hook)
export function usePaystackInitialize() {
  return useMutation({
    mutationFn: (paystackData) =>
      apiFetch("/payments/paystack/initialize", {
        method: "POST",
        body: paystackData,
      }),
    onSuccess: (data) => {
      console.log("✅ Paystack initialized with reference:", data.reference);
    },
    onError: (error) => {
      console.error("❌ Paystack initialization failed:", error.message);
    },
  });
}

// ✅ Transfer money (Paystack verified)
export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transferData) =>
      apiFetch("/transactions/transfer", {
        method: "POST",
        body: transferData,
      }),
    onSuccess: () => {
      console.log("✅ Transfer successful");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Transfer failed:", error.message);
    },
  });
}

// Get transaction history with pagination
export function useGetTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () =>
      apiFetch(`/transactions/history${queryString ? `?${queryString}` : ""}`),
    keepPreviousData: true,
    retry: 1,
  });
}

// Get single transaction by ID
export function useGetSingleTransaction(transactionId) {
  return useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: () => apiFetch(`/transactions/${transactionId}`),
    enabled: !!transactionId,
    retry: 1,
  });
}

// Deposit money (Direct - no Paystack)
export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (depositData) =>
      apiFetch("/transactions/deposit", {
        method: "POST",
        body: depositData,
      }),
    onSuccess: () => {
      console.log("✅ Deposit successful");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Deposit failed:", error.message);
    },
  });
}

// Withdraw money
export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (withdrawData) =>
      apiFetch("/transactions/withdraw", {
        method: "POST",
        body: withdrawData,
      }),
    onSuccess: () => {
      console.log("✅ Withdrawal successful");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Withdrawal failed:", error.message);
    },
  });
}

export default {
  usePaystackInitialize,
  useTransfer,
  useGetTransactions,
  useGetSingleTransaction,
  useDeposit,
  useWithdraw,
};
