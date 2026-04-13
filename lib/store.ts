'use client';
/**
 * Client-side data store using Zustand + localStorage persistence.
 * In production this would hydrate from the backend API.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, BankAccount, Debt, UserProfile, Notification, Strategy } from '@/types';
import { MOCK_USER, MOCK_BANK_ACCOUNTS, MOCK_DEBTS, MOCK_NOTIFICATIONS } from './mock-data';

interface StoreActions {
  // Auth
  setUser: (user: UserProfile | null) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;

  // Bank accounts
  setBankAccounts: (accounts: BankAccount[]) => void;
  addBankAccount: (account: BankAccount) => void;
  removeBankAccount: (id: string) => void;
  updateBankAccount: (id: string, patch: Partial<BankAccount>) => void;

  // Debts
  setDebts: (debts: Debt[]) => void;
  addDebt: (debt: Debt) => void;
  removeDebt: (id: string) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Strategy
  setStrategy: (s: Strategy) => void;

  // Demo
  loadDemoData: () => void;
  reset: () => void;
}

const DEFAULT_STATE: AppState = {
  user: null,
  bankAccounts: [],
  debts: [],
  notifications: [],
  theme: 'dark',
};

export const useStore = create<AppState & StoreActions>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,

      setUser: (user) => set({ user }),
      updateProfile: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),

      setBankAccounts: (accounts) => set({ bankAccounts: accounts }),
      addBankAccount: (account) =>
        set((s) => ({
          bankAccounts: s.bankAccounts.some(a => a.id === account.id)
            ? s.bankAccounts
            : [...s.bankAccounts, account],
        })),
      removeBankAccount: (id) =>
        set((s) => ({ bankAccounts: s.bankAccounts.filter((a) => a.id !== id) })),
      updateBankAccount: (id, patch) =>
        set((s) => ({
          bankAccounts: s.bankAccounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      setDebts: (debts) => set({ debts }),
      addDebt: (debt) =>
        set((s) => ({
          debts: s.debts.some(d => d.id === debt.id) ? s.debts : [...s.debts, debt],
        })),
      removeDebt: (id) =>
        set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
      updateDebt: (id, patch) =>
        set((s) => ({
          debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
      clearAllNotifications: () => set({ notifications: [] }),

      setStrategy: (selectedStrategy) =>
        set((s) => ({
          user: s.user ? { ...s.user, selectedStrategy } : s.user,
        })),

      loadDemoData: () =>
        set({
          user: MOCK_USER,
          bankAccounts: MOCK_BANK_ACCOUNTS,
          debts: MOCK_DEBTS,
          notifications: MOCK_NOTIFICATIONS,
        }),

      reset: () => set(DEFAULT_STATE),
    }),
    {
      name: 'debt-optimizer-store',
      skipHydration: false,
    },
  ),
);

// Computed selectors (use outside of store to avoid re-render issues)
export const selectTotalDebt = (state: AppState) =>
  state.debts.filter((d) => d.isActive).reduce((s, d) => s + d.balance, 0);

export const selectTotalCash = (state: AppState) =>
  state.bankAccounts.reduce((s, a) => s + a.balance, 0);

export const selectAvailableBudget = (state: AppState) => {
  if (!state.user) return 0;
  return Math.max(0, state.user.monthlyIncome - state.user.monthlyExpenses);
};

export const selectUnreadCount = (state: AppState) =>
  state.notifications.filter((n) => !n.read).length;
