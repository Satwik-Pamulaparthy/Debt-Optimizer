'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, Loader2, AlertCircle } from 'lucide-react';
import type { Debt, BankAccount } from '@/types';

interface Props {
  onSuccess: (debts: Debt[], accounts: BankAccount[], institution: string) => void;
}

// Inner component — only rendered once we have a link token (hook requires non-null token)
function PlaidButton({ token, onSuccess }: { token: string; onSuccess: Props['onSuccess'] }) {
  const [syncing, setSyncing] = useState(false);
  const [err,     setErr]     = useState('');

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    setSyncing(true);
    setErr('');
    try {
      const res  = await fetch('/api/plaid/exchange', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ public_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Exchange failed');
      onSuccess(data.debts ?? [], data.accounts ?? [], data.institution ?? 'Bank');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSyncing(false);
    }
  }, [onSuccess]);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess: (pub_tok) => onPlaidSuccess(pub_tok),
    onExit: (e) => { if (e) setErr(e.display_message ?? 'Connection cancelled'); },
  });

  return (
    <div className="space-y-2">
      <button
        onClick={() => open()}
        disabled={!ready || syncing}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl
          bg-blue-500/15 border border-blue-500/30 text-blue-300
          hover:bg-blue-500/25 hover:border-blue-400/50
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm font-medium transition-all w-full justify-center"
      >
        {syncing
          ? <><Loader2 className="w-4 h-4 animate-spin" />Syncing accounts…</>
          : <><Building2 className="w-4 h-4" />Connect with Plaid</>
        }
      </button>
      {err && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{err}
        </p>
      )}
    </div>
  );
}

// Outer component — fetches the link token, then renders PlaidButton
export default function PlaidLinkButton({ onSuccess }: Props) {
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState('');

  useEffect(() => {
    fetch('/api/plaid/link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => d.link_token ? setToken(d.link_token) : setErr('Could not initialise Plaid'))
      .catch(() => setErr('Could not connect to Plaid'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl
        bg-blue-500/10 border border-blue-500/20 text-blue-400/60 text-sm w-full justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />Initialising Plaid…
      </button>
    );
  }

  if (err) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-red-400 p-3 rounded-xl
        bg-red-500/10 border border-red-500/20">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{err}
      </p>
    );
  }

  return <PlaidButton token={token!} onSuccess={onSuccess} />;
}
