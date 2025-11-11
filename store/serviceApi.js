// import { create } from "zustand";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const API_URL = "https://react-native-app-mlpl.onrender.com/api";

// // ============ ACCOUNT STORE ============
// export const useAccountStore = create((set) => ({
//   account: null,
//   isLoading: false,

//   // 🔹 Get Account
//   getAccount: async () => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/accounts/getUserAccount`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       const data = await response.json();

//       set({ account: data, isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Setup Account
//   setupAccount: async (formData) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/accounts/setup`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(formData),
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       const data = await response.json();

//       set({ account: data, isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Update Account Info
//   updateAccountInfo: async (updateData) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/accounts/update`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(updateData),
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       const data = await response.json();

//       set({ account: data, isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },
// }));

// // ============ WALLET STORE ============
// export const useWalletStore = create((set) => ({
//   balance: 0,
//   stats: null,
//   recentTransactions: [],
//   isLoading: false,

//   // 🔹 Get Balance
//   getBalance: async () => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/wallet/balance`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to fetch balance");
//       }

//       set({ balance: data.balance || 0, isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Get Stats
//   getStats: async () => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/wallet/stats`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to fetch stats");
//       }

//       set({ stats: data, isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Get Recent Transactions
//   getRecent: async () => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/transactions/recent`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to fetch recent transactions");
//       }

//       set({ recentTransactions: data.transactions || [], isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },
// }));

// // ============ TRANSACTION STORE ============
// export const useTransactionStore = create((set) => ({
//   transactions: [],
//   isLoading: false,

//   // 🔹 Get Transactions
//   getTransactions: async (params = {}) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const query = new URLSearchParams(params).toString();
//       const response = await fetch(`${API_URL}/transactions?${query}`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to fetch transactions");
//       }

//       set({ transactions: data || [], isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Deposit
//   deposit: async (depositData) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/transactions/deposit`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(depositData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to deposit");
//       }

//       set({ isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Withdraw
//   withdraw: async (withdrawData) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/transactions/withdraw`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(withdrawData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to withdraw");
//       }

//       set({ isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },

//   // 🔹 Transfer
//   transfer: async (transferData) => {
//     set({ isLoading: true });
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) throw new Error("No token found");

//       const response = await fetch(`${API_URL}/transactions/transfer`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(transferData),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data?.message || "Failed to transfer");
//       }

//       set({ isLoading: false });
//       return { success: true, data };
//     } catch (error) {
//       set({ isLoading: false });
//       return { success: false, message: error.message };
//     }
//   },
// }));
