'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { AccountType } from '@/types';
import { generateId } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import { ACCOUNT_TYPE_META } from '@/lib/mock-data';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking',   label: 'Checking',   icon: '🏦' },
  { value: 'savings',    label: 'Savings',     icon: '🐖' },
  { value: 'investment', label: 'Investment',  icon: '📈' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddAccountModal({ open, onClose }: Props) {
  const { addBankAccount } = useStore();
  const user = useStore(s => s.user);
  const sym = getCurrencyForCountry(user?.country ?? 'US').symbol;

  const emptyForm = () => ({ name: '', institution: '', type: 'checking' as AccountType, balance: 0 });
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name = 'Required';
    if (form.balance < 0)   e.balance = 'Cannot be negative';
    return e;
  };

  const handleAdd = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    const id = generateId();
    const newAccount = { ...form, id, lastUpdated: new Date().toISOString() };

    // 1. Optimistic update — UI reflects immediately
    addBankAccount(newAccount);

    // 2. Persist to PostgreSQL (fire-and-forget; localStorage is the fallback)
    fetch('/api/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user?.id ?? '',
      },
      body: JSON.stringify(newAccount),
    }).catch(() => { /* DB unavailable — data lives in localStorage */ });

    setSaving(false);
    setForm(emptyForm());
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(emptyForm());
    setErrors({});
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add a Bank Account" description="Enter your account balance to calculate your available cash buffer.">
      <div className="space-y-4">

        {/* Account Name */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Account Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Chase Checking, Emergency Fund"
            value={form.name}
            onChange={e => {
              setForm(p => ({ ...p, name: e.target.value }));
              if (errors.name) setErrors(p => { const n = { ...p }; delete n.name; return n; });
            }}
            autoFocus
            className={`w-full bg-white/[0.05] border rounded-xl py-2.5 px-3.5 text-white text-sm
              placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors
              ${errors.name ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'}`}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Institution */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Institution
          </label>
          <input
            type="text"
            placeholder="e.g. Chase Bank, Ally"
            value={form.institution}
            onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Account Type */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Account Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ACCOUNT_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t.value }))}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1
                  ${form.type === t.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] border border-white/10'
                  }`}
              >
                <span className="text-base">{t.icon}</span>
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Balance */}
        <div>
          <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
            Current Balance <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              {sym}
            </span>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={form.balance || ''}
              onChange={e => {
                setForm(p => ({ ...p, balance: parseFloat(e.target.value) || 0 }));
                if (errors.balance) setErrors(p => { const n = { ...p }; delete n.balance; return n; });
              }}
              className={`w-full bg-white/[0.05] border rounded-xl py-2.5 pl-8 pr-3.5 text-white text-sm
                placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors
                ${errors.balance ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'}`}
            />
          </div>
          {errors.balance && <p className="text-red-400 text-xs mt-1">{errors.balance}</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={handleAdd}>
            <Plus className="w-4 h-4" /> Add Account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
