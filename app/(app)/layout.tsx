'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { getCurrencyForCountry } from '@/lib/currencies';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useStore();

  useEffect(() => {
    const supabase = createClient();

    // Get current session and set user in store
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (!sbUser) {
        router.replace('/login');
        return;
      }

      // Only set if not already loaded (avoids overwriting optimistic state)
      if (!user || user.id !== sbUser.id) {
        const meta = sbUser.user_metadata ?? {};
        const country = meta.country ?? 'US';
        const currency = meta.currency ?? getCurrencyForCountry(country).code;
        setUser({
          id: sbUser.id,
          email: sbUser.email ?? '',
          name: meta.name ?? sbUser.email?.split('@')[0] ?? '',
          monthlyIncome: meta.monthly_income ?? 0,
          monthlyExpenses: meta.monthly_expenses ?? 0,
          goal: meta.goal ?? 'balanced',
          selectedStrategy: meta.selected_strategy ?? 'avalanche',
          onboardingComplete: meta.onboarding_complete ?? false,
          createdAt: sbUser.created_at,
          country,
          currency,
        });
      }

      // Always sync fresh data from Supabase (clears any stale localStorage state)
      const store = useStore.getState();
      fetch('/api/debts')
        .then(r => r.json())
        .then(({ debts: rows }) => store.setDebts(rows ?? []))
        .catch(() => store.setDebts([]));

      fetch('/api/accounts')
        .then(r => r.json())
        .then(({ accounts: rows }) => store.setBankAccounts(rows ?? []))
        .catch(() => store.setBankAccounts([]));
    });

    // Listen for auth state changes (sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        useStore.getState().reset();
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#07080f]">
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden h-14 flex-shrink-0" />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
