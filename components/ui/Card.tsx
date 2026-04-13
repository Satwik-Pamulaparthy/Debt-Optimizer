import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: 'indigo' | 'green' | 'red' | 'orange' | 'none';
  hover?: boolean;
}

export default function Card({ className, glow = 'none', hover = false, children, ...props }: CardProps) {
  const glowMap = {
    indigo: 'shadow-indigo-500/10',
    green: 'shadow-emerald-500/10',
    red: 'shadow-red-500/10',
    orange: 'shadow-orange-500/10',
    none: '',
  };

  return (
    <div
      className={cn(
        'rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm',
        glow !== 'none' && `shadow-xl ${glowMap[glow]}`,
        hover && 'transition-all duration-200 hover:-translate-y-1 hover:bg-white/[0.06] hover:border-white/[0.12] hover:shadow-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
