// ================== app/hooks/usePayment.js ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// ✅ Initialize DEPOSIT (Paystack - CREDITS account)
export function usePaystackInitialize() {
  return useMutation({
    mutationFn: async (paystackData) => {
      const response = await apiFetch("/payments/paystack/initialize", {
        method: "POST",
        body: paystackData,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to initialize deposit");
      }

      return response;
    },
    onSuccess: (data) => {},
    onError: (error) => {},
  });
}

// ✅ Initialize PAYMENT (Paystack - DEBITS account)
export function usePaymentInitialize() {
  return useMutation({
    mutationFn: async (paystackData) => {
      const response = await apiFetch(
        "/payment-transaction/paystack/initialize",
        {
          method: "POST",
          body: paystackData,
        }
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to initialize payment");
      }

      return response;
    },
    onSuccess: (data) => {},
    onError: (error) => {},
  });
}

// ✅ Verify DEPOSIT (CREDITS account)
export function usePaystackVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      if (!reference || typeof reference !== "string" || reference.length < 5) {
        throw new Error("Invalid deposit reference");
      }

      const response = await apiFetch(
        `/payments/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      // ✅ CHECK response.payment.status
      const depositStatus = response.payment?.status || "unknown";

      if (depositStatus === "abandoned") {
        throw new Error("DEPOSIT_ABANDONED");
      }

      if (!response.success) {
        throw new Error(response.message || "Deposit verification failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Verify PAYMENT (DEBITS account) - FIXED STATUS CHECKING
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      // ✅ Validate reference
      if (!reference || typeof reference !== "string" || reference.length < 5) {
        throw new Error("Invalid payment reference");
      }

      let response;
      try {
        response = await apiFetch(
          `/payment-transaction/paystack/verify/${reference}`,
          {
            method: "POST",
            body: {},
          }
        );
      } catch (fetchError) {
        throw fetchError;
      }

      // ✅ Validate response exists
      if (!response) {
        throw new Error("No response from verification");
      }

      // ✅ CHECK response.payment.status (NOT response.data.status)
      const paymentStatus = response.payment?.status || "unknown";

      // ✅ CHECK IF SUCCESS FIRST
      if (response.success === true && paymentStatus === "completed") {
        return response;
      }

      // ✅ HANDLE DIFFERENT STATUSES
      if (paymentStatus === "abandoned") {
        throw new Error("PAYMENT_ABANDONED");
      }

      if (paymentStatus === "pending") {
        throw new Error("PAYMENT_PENDING");
      }

      if (paymentStatus === "failed") {
        throw new Error("PAYMENT_FAILED");
      }

      if (paymentStatus === "invalid") {
        throw new Error("PAYMENT_INVALID");
      }

      if (!response.success) {
        throw new Error(response.message || "Payment verification failed");
      }

      throw new Error(
        response.message || `Payment verification failed: ${paymentStatus}`
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Verify Card/Wallet Payment (DEBITS account)
export function useVerifyCardPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      if (!reference || typeof reference !== "string" || reference.length < 5) {
        throw new Error("Invalid reference");
      }

      const response = await apiFetch(
        `/payment-transaction/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      // ✅ CHECK response.payment.status
      const paymentStatus = response.payment?.status || "unknown";

      if (paymentStatus === "abandoned") {
        throw new Error("PAYMENT_ABANDONED");
      }

      if (!response.success) {
        throw new Error(response.message || "Payment verification failed");
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Get DEPOSIT history
export function useGetDepositHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["deposits", params],
    queryFn: async () => {
      const response = await apiFetch(
        `/payments/history${queryString ? `?${queryString}` : ""}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch deposits");
      }

      return response;
    },
    keepPreviousData: true,
    retry: 1,
  });
}

// ✅ Get PAYMENT history
export function useGetPaymentHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["payment-transactions", params],
    queryFn: async () => {
      const response = await apiFetch(
        `/payment-transaction/history${queryString ? `?${queryString}` : ""}`
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
      const response = await apiFetch(
        `/payment-transaction/status/${reference}`
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payment status");
      }

      return response;
    },
    enabled: !!reference,
    retry: 1,
  });
}

// ✅ Get deposit by reference
export function useGetDepositStatus(reference) {
  return useQuery({
    queryKey: ["depositStatus", reference],
    queryFn: async () => {
      const response = await apiFetch(`/payments/status/${reference}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch deposit status");
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
      const response = await apiFetch(`/payment-transaction/${paymentId}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch payment");
      }

      return response;
    },
    enabled: !!paymentId,
    retry: 1,
  });
}

// ✅ Get single deposit by ID
export function useGetSingleDeposit(depositId) {
  return useQuery({
    queryKey: ["deposit", depositId],
    queryFn: async () => {
      const response = await apiFetch(`/payments/${depositId}`);

      if (!response.success) {
        throw new Error(response.message || "Failed to fetch deposit");
      }

      return response;
    },
    enabled: !!depositId,
    retry: 1,
  });
}

// ✅ Verify Bank Transfer (DEBITS account for transfers)
export function useVerifyBankTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reference) => {
      if (!reference || typeof reference !== "string" || reference.length < 5) {
        throw new Error("Invalid reference");
      }

      const response = await apiFetch(
        `/payment-transaction/paystack/verify/${reference}`,
        {
          method: "POST",
          body: {},
        }
      );

      // ✅ CHECK response.payment.status
      const transferStatus = response.payment?.status || "unknown";

      if (transferStatus === "abandoned") {
        throw new Error("TRANSFER_ABANDONED");
      }

      if (!response.success) {
        throw new Error(
          response.message || "Bank transfer verification failed"
        );
      }

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {},
  });
}

// ✅ Default export
export default {
  usePaystackInitialize,
  usePaymentInitialize,
  usePaystackVerify,
  useVerifyPayment,
  useVerifyCardPayment,
  useVerifyBankTransfer,
  useGetDepositHistory,
  useGetPaymentHistory,
  useGetPaymentStatus,
  useGetDepositStatus,
  useGetSinglePayment,
  useGetSingleDeposit,
};
