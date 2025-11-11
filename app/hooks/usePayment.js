// ================== app/hooks/usePayment.js ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// Get payment history with pagination
export function useGetPaymentHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();

  return useQuery({
    queryKey: ["payments", params],
    queryFn: () =>
      apiFetch(`/payments/history${queryString ? `?${queryString}` : ""}`),
    keepPreviousData: true,
    retry: 1,
  });
}

// Get payment status by reference
export function useGetPaymentStatus(reference) {
  return useQuery({
    queryKey: ["paymentStatus", reference],
    queryFn: () => apiFetch(`/payments/status/${reference}`),
    enabled: !!reference,
    retry: 1,
  });
}

// Get single payment by ID
export function useGetSinglePayment(paymentId) {
  return useQuery({
    queryKey: ["payment", paymentId],
    queryFn: () => apiFetch(`/payments/${paymentId}`),
    enabled: !!paymentId,
    retry: 1,
  });
}

// Initiate payment (wallet, card, or transfer)
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData) =>
      apiFetch("/payments/initiate", {
        method: "POST",
        body: paymentData,
      }),
    onSuccess: () => {
      console.log("✅ Payment initiated successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Payment initiation failed:", error.message);
    },
  });
}

// Initialize Paystack mobile money payment
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

// Verify Paystack payment
export function usePaystackVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference) =>
      apiFetch(`/payments/paystack/verify/${reference}`, {
        method: "POST",
      }),
    onSuccess: () => {
      console.log("✅ Payment verified successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => {
      console.error("❌ Payment verification failed:", error.message);
    },
  });
}

// Cancel pending payment
export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId) =>
      apiFetch(`/payments/${paymentId}/cancel`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      console.log("✅ Payment cancelled");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Payment cancellation failed:", error.message);
    },
  });
}

export default {
  useGetPaymentHistory,
  useGetPaymentStatus,
  useGetSinglePayment,
  useInitiatePayment,
  usePaystackInitialize,
  usePaystackVerify,
  useCancelPayment,
};
