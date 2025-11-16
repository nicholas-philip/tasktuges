// ================== app/hooks/usePayment.js (COMPLETE FIX) ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// ✅ Initialize Paystack (shared for all payment types)
export function usePaystackInitialize() {
  return useMutation({
    mutationFn: async (paystackData) => {
      console.log("📤 Initializing Paystack:", {
        amount: paystackData.amount,
        paymentMethod: paystackData.paymentMethod,
      });

      const response = await apiFetch("/payments/paystack/initialize", {
        method: "POST",
        body: paystackData,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to initialize payment");
      }

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Paystack initialized:", data.reference);
    },
    onError: (error) => {
      console.error("❌ Initialization failed:", error.message);
    },
  });
}

// ✅ Verify Card/Wallet Payment (DEBITS account)
export function useVerifyCardPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      console.log("💳 Verifying card payment:", reference);

      const response = await apiFetch(
        `/payments/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Payment verification failed");
      }

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Card payment verified:", data.payment);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Payment verification failed:", error.message);
    },
  });
}

// ✅ Verify Mobile Money Deposit (CREDITS account)
export function useVerifyMobileMoneyDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      console.log("📱 Verifying mobile money deposit:", reference);

      const response = await apiFetch(
        `/payments/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Deposit verification failed");
      }

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Mobile money deposit verified:", data.payment);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Deposit verification failed:", error.message);
    },
  });
}

// ✅ Verify Bank Transfer (CREDITS/DEBITS both accounts)
export function useVerifyBankTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      console.log("🏦 Verifying bank transfer:", reference);

      const response = await apiFetch(
        `/payments/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      if (!response.success) {
        throw new Error(
          response.message || "Bank transfer verification failed"
        );
      }

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Bank transfer verified:", data.transaction);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Bank transfer verification failed:", error.message);
    },
  });
}

// ✅ Get payment history
export function useGetPaymentHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["payments", params],
    queryFn: async () => {
      console.log("📜 Fetching payment history...");

      const response = await apiFetch(
        `/payments/history${queryString ? `?${queryString}` : ""}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payments");
      }

      return response;
    },
    keepPreviousData: true,
    retry: 1,
  });
}

// ✅ Get payment by reference
export function useGetPaymentStatus(reference) {
  return useQuery({
    queryKey: ["paymentStatus", reference],
    queryFn: async () => {
      console.log("🔍 Checking payment status:", reference);

      const response = await apiFetch(`/payments/status/${reference}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payment status");
      }

      return response;
    },
    enabled: !!reference,
    retry: 1,
  });
}

// ✅ Get single payment by ID
export function useGetSinglePayment(paymentId) {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      console.log("📋 Fetching payment:", paymentId);

      const response = await apiFetch(`/payments/${paymentId}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payment");
      }

      return response;
    },
    enabled: !!paymentId,
    retry: 1,
  });
}

export default {
  usePaystackInitialize,
  useVerifyCardPayment,
  useVerifyMobileMoneyDeposit,
  useVerifyBankTransfer,
  useGetPaymentHistory,
  useGetPaymentStatus,
  useGetSinglePayment,
};
