import { create } from 'zustand';
import { getWalletBalance, getWalletTransactions } from '@/actions/wallet-actions';

interface WalletState {
  balance: number;
  currency: string;
  transactions: any[];
  loading: boolean;
  error: string | null;
  fetchWallet: (userId: string) => Promise<void>;
  fetchTransactions: (userId: string) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  currency: 'NGN',
  transactions: [],
  loading: false,
  error: null,
  
  fetchWallet: async (userId) => {
    set({ loading: true, error: null });
    try {
      const res = await getWalletBalance(userId);
      if (res.success) {
        set({ balance: res.balance, currency: res.currency });
      } else {
        set({ error: res.error });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (userId) => {
    set({ loading: true, error: null });
    try {
      const res = await getWalletTransactions(userId);
      if (res.success) {
        set({ transactions: res.transactions || [] });
      } else {
        set({ error: res.error });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ loading: false });
    }
  },
}));
