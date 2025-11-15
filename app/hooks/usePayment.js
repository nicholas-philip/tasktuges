// ================== app/hooks/usePayment.js (PAYSTACK) ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// ✅ Initialize Paystack payment/transfer
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

// ✅ Verify Paystack payment (handles payment, transfer, and deposits)
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData) =>
      apiFetch(`/payments/paystack/verify/${paymentData.reference}`, {
        method: "POST",
        body: paymentData,
      }),
    onSuccess: () => {
      console.log("✅ Payment verified successfully");
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

// ✅ Verify Paystack payment (for deposits)
export function usePaystackVerify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reference) =>
      apiFetch(`/payments/paystack/verify/${reference}`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      console.log("✅ Payment verified successfully");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Payment verification failed:", error.message);
    },
  });
}

export default {
  usePaystackInitialize,
  useInitiatePayment,
  usePaystackVerify,
  useGetPaymentHistory,
  useGetPaymentStatus,
  useGetSinglePayment,
};
