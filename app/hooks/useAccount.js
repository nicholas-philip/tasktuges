// ================== app/hooks/useAccount.js ==================
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./useApi";

// Get user's account details
export function useGetAccount() {
  return useQuery({
    queryKey: ["account"],
    queryFn: () => apiFetch("/accounts/getUserAccount"),
    retry: 2,
  });
}

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
      queryClient.setQueryData(["account"], data);
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (error) => {
      console.error("❌ Account setup failed:", error.message);
    },
  });
}

// Update account information
export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData) =>
      apiFetch("/accounts/update", {
        method: "PUT",
        body: updateData,
      }),
    onSuccess: (data) => {
      console.log("✅ Account updated successfully");
      queryClient.setQueryData(["account"], data);
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
  });
}

// Get full account details
export function useGetAccountDetails() {
  return useQuery({
    queryKey: ["account", "details"],
    queryFn: () => apiFetch("/accounts/details"),
    retry: 1,
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
  useGetAccount,
  useCheckAccount,
  useSetupAccount,
  useUpdateAccount,
  useGetAccountDetails,
  useUpdateAccountStatus,
};
