// ================== hooks/useAccount.js ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// Check if account is setup
export function useCheckAccount() {
  return useQuery({
    queryKey: ["account", "check"],
    queryFn: () => apiFetch("/accounts/check"),
    retry: 1,
  });
}

// Setup account with full details
export function useSetupAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) =>
      apiFetch("/accounts/setup", {
        method: "POST",
        body: formData,
      }),
    onSuccess: (data) => {
      console.log("✅ Account created successfully");
      queryClient.setQueryData(["account", "details"], data);
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Account setup failed:", error.message);
    },
  });
}

// Get full account details
export function useGetAccountDetails() {
  return useQuery({
    queryKey: ["account", "details"],
    queryFn: () => apiFetch("/accounts/details"),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update account information (contact info, employment, etc)
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData) => {
      console.log("📤 [useUpdateAccount] Sending:", updateData);

      // Transform form data to backend structure if needed
      const payload = {
        contactInfo: {
          phoneNumber: updateData.phoneNumber,
          address: updateData.address,
          city: updateData.city,
          state: updateData.state,
          postalCode: updateData.postalCode,
        },
        employment: {
          occupation: updateData.occupation,
          monthlyIncome: parseFloat(updateData.monthlyIncome) || 0,
        },
      };

      return apiFetch("/accounts/update", {
        method: "PUT",
        body: payload,
      });
    },
    onSuccess: (data) => {
      console.log("✅ Account updated successfully");
      queryClient.setQueryData(["account", "details"], data);
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Account update failed:", error.message);
    },
  });
}

// Update account status (freeze/close)
export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status) =>
      apiFetch("/accounts/userAccountStatus", {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: (data) => {
      console.log("✅ Account status updated");
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

export default {
  useCheckAccount,
  useSetupAccount,
  useUpdateAccount,
  useGetAccountDetails,
  useUpdateAccountStatus,
};
