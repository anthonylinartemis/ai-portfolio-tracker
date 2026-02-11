import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--card-bg)] rounded-xl border border-[var(--border)] shadow-sm',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}
