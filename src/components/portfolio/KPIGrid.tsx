'use client';

import { Card } from '@/components/ui/Card';
import { formatPercent, formatRatio } from '@/lib/utils';
import type { KPIs } from '@/types';
import {
  TrendingUp, TrendingDown, BarChart3, Shield,
  Activity, Target, Percent, Zap,
} from 'lucide-react';

interface KPIGridProps {
  kpis: KPIs;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  const items = [
    {
      label: 'Sharpe Ratio',
      value: formatRatio(kpis.sharpeRatio),
      icon: BarChart3,
      color: kpis.sharpeRatio >= 1 ? 'text-[var(--positive)]' : 'text-[var(--secondary-text)]',
    },
    {
      label: 'Sortino Ratio',
      value: formatRatio(kpis.sortinoRatio),
      icon: Shield,
      color: kpis.sortinoRatio >= 1 ? 'text-[var(--positive)]' : 'text-[var(--secondary-text)]',
    },
    {
      label: 'Max Drawdown',
      value: kpis.maxDrawdown > 0 ? `-${kpis.maxDrawdown.toFixed(2)}%` : `${kpis.maxDrawdown.toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-[var(--negative)]',
    },
    {
      label: 'Volatility',
      value: `${kpis.volatility.toFixed(2)}%`,
      icon: Activity,
      color: 'text-[var(--secondary-text)]',
    },
    {
      label: 'Alpha',
      value: formatPercent(kpis.alpha),
      icon: Target,
      color: kpis.alpha >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]',
    },
    {
      label: 'Beta',
      value: formatRatio(kpis.beta),
      icon: Zap,
      color: 'text-[var(--secondary-text)]',
    },
    {
      label: 'Win Rate',
      value: `${kpis.winRate.toFixed(1)}%`,
      icon: Percent,
      color: kpis.winRate >= 50 ? 'text-[var(--positive)]' : 'text-[var(--secondary-text)]',
    },
    {
      label: 'Best / Worst Day',
      value: `${kpis.bestDay >= 0 ? '+' : ''}${kpis.bestDay.toFixed(2)}% / ${kpis.worstDay >= 0 ? '+' : ''}${kpis.worstDay.toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-[var(--secondary-text)]',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wide">
              {item.label}
            </p>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </div>
          <p className={`text-xl font-bold ${item.color}`}>
            {item.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
