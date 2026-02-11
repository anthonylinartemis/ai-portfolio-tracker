'use client';

import { cn } from '@/lib/utils';

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 bg-[var(--background)] rounded-lg p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--secondary-text)] hover:text-[var(--foreground)]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
