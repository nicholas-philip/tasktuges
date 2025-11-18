// ================== app/hooks/useTransactions.js ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// ✅ Transfer Mobile Money (DIRECT - no Paystack needed)
// For bank transfers, use usePaystackInitialize + useVerifyBankTransfer
export function useTransferMobileMoneyDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferData) => {
      const response = await apiFetch("/transactions/transfer", {
        method: "POST",
        body: transferData,
      });

      if (!response.success) {
        throw new Error(response.message || "Transfer failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Transfer via Paystack (BANK + MOBILE MONEY)
// Step 1: Initialize Paystack
// Step 2: User completes payment on Paystack
// Step 3: Verify with backend
export function useTransferViaPaystack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferData) => {
      // For bank transfers, call verify endpoint
      const reference = transferData.reference;
      if (!reference) {
        throw new Error("Paystack reference is required");
      }

      const response = await apiFetch(
        `/payments/paystack/verify/${reference}`,
        {
          method: "POST",
          body: transferData,
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Transfer verification failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Get transaction history
export function useGetTransactions(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const response = await apiFetch(
        `/transactions/history${queryString ? `?${queryString}` : ""}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch transactions");
      }

      return response;
    },
    keepPreviousData: true,
    retry: 1,
  });
}

// ✅ Get single transaction
export function useGetSingleTransaction(transactionId) {
  return useQuery({
    queryKey: ["transaction", transactionId],
    queryFn: async () => {
      const response = await apiFetch(`/transactions/${transactionId}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch transaction");
      }

      return response;
    },
    enabled: !!transactionId,
    retry: 1,
  });
}

// ✅ Deposit (DIRECT - no Paystack)
export function useDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (depositData) => {
      const response = await apiFetch("/transactions/deposit", {
        method: "POST",
        body: depositData,
      });

      if (!response.success) {
        throw new Error(response.message || "Deposit failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Withdraw (DIRECT - no Paystack)
export function useWithdraw() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (withdrawData) => {
      const response = await apiFetch("/transactions/withdraw", {
        method: "POST",
        body: withdrawData,
      });

      if (!response.success) {
        throw new Error(response.message || "Withdrawal failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

export default {
  useTransferMobileMoneyDirect,
  useTransferViaPaystack,
  useGetTransactions,
  useGetSingleTransaction,
  useDeposit,
  useWithdraw,
};
