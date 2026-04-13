'use client';
import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Debt, DebtType } from '@/types';
import { generateId } from '@/lib/utils';
import { getCurrencyForCountry } from '@/lib/currencies';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

const DEBT_TYPES: { value: DebtType; label: string }[] = [
  { value: 'credit_card',   label: '💳 Credit Card' },
  { value: 'personal_loan', label: '🏦 Personal Loan' },
  { value: 'student_loan',  label: '🎓 Student Loan' },
  { value: 'auto_loan',     label: '🚗 Auto Loan' },
  { value: 'mortgage',      label: '🏠 Mortgage' },
  { value: 'medical',       label: '🏥 Medical Bill' },
  { value: 'other',         label: '📋 Other' },
];

function emptyDebt(): Omit<Debt, 'id'> {
  return {
    name: '', institution: '', type: 'credit_card',
    balance: 0, originalBalance: 0, minimumPayment: 0,
    apr: 0, dueDate: 15, lateFee: 0,
    isActive: true, createdAt: new Date().toISOString(),
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddDebtModal({ open, onClose }: Props) {
  const { addDebt } = useStore();
  const user = useStore(s => s.user);
  const sym = getCurrencyForCountry(user?.country ?? 'US').symbol;

  const [form, setForm] = useState(emptyDebt());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim())               e.name = 'Required';
    if (form.balance <= 0)               e.balance = 'Must be greater than 0';
    if (form.minimumPayment <= 0)        e.minimumPayment = 'Must be greater than 0';
    if (form.apr < 0)                    e.apr = 'Cannot be negative';
    if (form.dueDate < 1 || form.dueDate > 31) e.dueDate = 'Must be 1–31';
    return e;
  };

  const handleAdd = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    const id = generateId();
    const newDebt: Debt = {
      ...form,
      id,
      originalBalance: form.originalBalance || form.balance,
    };

    // 1. Optimistic update — UI reflects the new debt immediately
    addDebt(newDebt);

    // 2. Persist to PostgreSQL (fire-and-forget; localStorage is the fallback)
    fetch('/api/debts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': user?.id ?? '',
      },
      body: JSON.stringify(newDebt),
    }).catch(() => { /* DB unavailable — data lives in localStorage */ });

    setSaving(false);
    setForm(emptyDebt());
    setErrors({});
    setShowAdvanced(false);
    onClose();
  };

  const handleClose = () => {
    setForm(emptyDebt());
    setErrors({});
    setShowAdvanced(false);
    onClose();
  };

  // ── Field helper — plain function, NOT a component, to prevent remount on each keystroke
  const field = (opts: {
    label: string;
    name: keyof typeof form;
    type?: string;
    prefix?: string;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    hint?: string;
    required?: boolean;
  }) => {
    const { label, name: f, type = 'text', prefix, suffix, min, max, step, placeholder, hint, required } = opts;
    return (
      <div>
        <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3.5 text-slate-400 text-sm pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            type={type}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            value={(form[f] as any) || ''}
            onChange={e => {
              const v = type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value;
              set(f, v);
              if (errors[f]) setErrors(prev => { const n = { ...prev }; delete n[f]; return n; });
            }}
            className={`w-full bg-white/[0.05] border rounded-xl py-2.5 text-white text-sm
              placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors
              ${prefix ? 'pl-8' : 'pl-3.5'} ${suffix ? 'pr-8' : 'pr-3.5'}
              ${errors[f] ? 'border-red-500/60 bg-red-500/5' : 'border-white/10'}`}
          />
          {suffix && (
            <span className="absolute right-3.5 text-slate-400 text-sm pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {errors[f] && <p className="text-red-400 text-xs mt-1">{errors[f]}</p>}
        {hint && !errors[f] && <p className="text-slate-600 text-xs mt-1">{hint}</p>}
      </div>
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add a Debt" description="Enter your debt details to build an accurate payoff plan." size="lg">
      <div className="space-y-4 max-h-[72vh] overflow-y-auto scrollbar-thin pr-1">

        {/* ── Required fields ──────────────────────────────────────────────── */}
        {field({ label: 'Debt Name', name: 'name', placeholder: 'e.g. Chase Sapphire, Student Loan', required: true, hint: 'Give it a recognisable name' })}

        <div className="grid grid-cols-2 gap-3">
          {field({ label: 'Current Balance', name: 'balance', type: 'number', prefix: sym, min: 0, placeholder: '0', required: true })}
          {field({ label: 'APR', name: 'apr', type: 'number', suffix: '%', min: 0, max: 100, step: 0.01, placeholder: '0.00', required: true, hint: 'Annual interest rate' })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field({ label: 'Min. Monthly Payment', name: 'minimumPayment', type: 'number', prefix: sym, min: 1, placeholder: '0', required: true })}
          {field({ label: 'Due Day of Month', name: 'dueDate', type: 'number', min: 1, max: 31, placeholder: '15', required: true, hint: 'Day 1–31' })}
        </div>

        {/* ── Advanced (optional) ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAdvanced ? 'Hide optional fields' : 'Show optional fields (institution, late fee, credit limit…)'}
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 gap-3">
              {field({ label: 'Institution', name: 'institution', placeholder: 'e.g. Chase, Navient' })}
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider font-medium block mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => set('type', e.target.value as DebtType)}
                  className="w-full bg-[#1a1d27] border border-white/10 rounded-xl py-2.5 px-3.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {DEBT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field({ label: 'Original Balance', name: 'originalBalance', type: 'number', prefix: sym, min: 0, placeholder: '0', hint: 'Leave 0 to match current balance' })}
              {field({ label: 'Late Fee', name: 'lateFee', type: 'number', prefix: sym, min: 0, placeholder: '0', hint: 'Charged if you miss a payment' })}
            </div>
            {field({ label: 'Credit Limit', name: 'creditLimit', type: 'number', prefix: sym, min: 0, placeholder: '0', hint: 'Credit cards only — used for utilisation %' })}
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button className="flex-1" loading={saving} onClick={handleAdd}>
            <Plus className="w-4 h-4" /> Add Debt
          </Button>
        </div>
      </div>
    </Modal>
  );
}
