import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variant === 'positive' && 'bg-green-900/30 text-[var(--positive)]',
        variant === 'negative' && 'bg-red-900/30 text-[var(--negative)]',
        variant === 'neutral' && 'bg-[var(--background)] text-[var(--secondary-text)]',
        className
      )}
    >
      {children}
    </span>
  );
}
