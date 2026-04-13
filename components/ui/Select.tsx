'use client';
import { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ className, label, error, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full bg-[#1a1d27] border rounded-xl py-3 px-4 text-white text-sm appearance-none cursor-pointer',
          'focus:outline-none focus:border-indigo-500 transition-all duration-150',
          error ? 'border-red-500/60' : 'border-white/10',
          className,
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
