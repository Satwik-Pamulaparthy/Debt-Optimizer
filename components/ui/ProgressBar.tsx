'use client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  className?: string;
  height?: 'xs' | 'sm' | 'md';
  animated?: boolean;
  showLabel?: boolean;
}

const heightMap = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
};

export default function ProgressBar({
  value,
  color = 'from-indigo-500 to-violet-500',
  className,
  height = 'sm',
  animated = true,
  showLabel,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex-1 rounded-full bg-white/[0.07] overflow-hidden',
          heightMap[height],
        )}
      >
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={animated ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums w-10 text-right">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
