'use client';

import type { Timeframe } from '@/types';

const timeframes: { id: Timeframe; label: string }[] = [
  { id: '1W', label: '1W' },
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '6M', label: '6M' },
  { id: '1Y', label: '1Y' },
  { id: 'YTD', label: 'YTD' },
  { id: 'ALL', label: 'All' },
];

interface TimeframeSelectorProps {
  selected: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export function TimeframeSelector({ selected, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-[var(--background)] rounded-lg p-1">
      {timeframes.map((tf) => (
        <button
          key={tf.id}
          onClick={() => onChange(tf.id)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            selected === tf.id
              ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--secondary-text)] hover:text-[var(--foreground)]'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
