import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const styles: Record<BadgeVariant, string> = {
  default:  'bg-slate-500/15 text-slate-300 border-slate-500/20',
  success:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:   'bg-red-500/15 text-red-400 border-red-500/20',
  info:     'bg-blue-500/15 text-blue-400 border-blue-500/20',
  purple:   'bg-violet-500/15 text-violet-400 border-violet-500/20',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger:  'bg-red-400',
  info:    'bg-blue-400',
  purple:  'bg-violet-400',
};

export default function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        styles[variant],
        className,
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />}
      {children}
    </span>
  );
}
