'use client';
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, hint, type = 'text', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-4 text-slate-400 font-medium text-sm pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full bg-white/[0.05] border rounded-xl py-3 text-white text-sm placeholder-slate-600',
              'focus:outline-none focus:border-indigo-500 focus:bg-white/[0.07] transition-all duration-150',
              error ? 'border-red-500/60' : 'border-white/10',
              prefix ? 'pl-9' : 'pl-4',
              suffix ? 'pr-9' : 'pr-4',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-4 text-slate-400 font-medium text-sm pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
export default Input;
