'use client';

import { Card } from '@/components/ui/Card';
import Image from 'next/image';

const AGENTS = [
  {
    id: 'gemini',
    name: 'Gemini',
    color: '#4285F4',
    holdings: [
      { ticker: 'NVDA', weight: 15 },
      { ticker: 'LLY', weight: 13 },
      { ticker: 'VST', weight: 12 },
      { ticker: 'VRT', weight: 10 },
      { ticker: 'AMZN', weight: 10 },
      { ticker: 'MSFT', weight: 9 },
      { ticker: 'ETN', weight: 9 },
      { ticker: 'BX', weight: 8 },
      { ticker: 'MELI', weight: 7 },
      { ticker: 'HWM', weight: 7 },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    color: '#1DA1F2',
    holdings: [
      { ticker: 'NVDA', weight: 15 },
      { ticker: 'MSFT', weight: 12 },
      { ticker: 'AMZN', weight: 12 },
      { ticker: 'TSM', weight: 10 },
      { ticker: 'XOM', weight: 10 },
      { ticker: 'AVGO', weight: 9 },
      { ticker: 'BMY', weight: 8 },
      { ticker: 'JNJ', weight: 8 },
      { ticker: 'COST', weight: 8 },
      { ticker: 'VRSK', weight: 8 },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    color: '#8B5CF6',
    holdings: [
      { ticker: 'GOOGL', weight: 15 },
      { ticker: 'LLY', weight: 13 },
      { ticker: 'NEM', weight: 12 },
      { ticker: 'VST', weight: 12 },
      { ticker: 'GEV', weight: 10 },
      { ticker: 'META', weight: 10 },
      { ticker: 'AEM', weight: 8 },
      { ticker: 'CEG', weight: 8 },
      { ticker: 'GE', weight: 7 },
      { ticker: 'FCX', weight: 5 },
    ],
  },
  {
    id: 'gpt',
    name: 'GPT',
    color: '#10A37F',
    holdings: [
      { ticker: 'NVDA', weight: 12 },
      { ticker: 'MSFT', weight: 12 },
      { ticker: 'AMZN', weight: 10 },
      { ticker: 'ANET', weight: 10 },
      { ticker: 'ETN', weight: 10 },
      { ticker: 'LLY', weight: 10 },
      { ticker: 'JPM', weight: 10 },
      { ticker: 'RTX', weight: 10 },
      { ticker: 'GOOGL', weight: 8 },
      { ticker: 'GEV', weight: 8 },
    ],
  },
];

export function PortfolioBreakdown() {
  return (
    <Card padding={false}>
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-lg">Portfolio Holdings</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--border)]">
        {AGENTS.map((agent) => (
          <div key={agent.id}>
            {/* Agent header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
              <Image
                src={`/logos/${agent.id}.png`}
                alt={agent.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span className="font-semibold text-sm" style={{ color: agent.color }}>
                {agent.name}
              </span>
            </div>

            {/* Column headers */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] text-xs text-[var(--secondary-text)]">
              <span>Ticker</span>
              <span>Weight%</span>
            </div>

            {/* Holdings list */}
            {agent.holdings.map((h) => (
              <div
                key={h.ticker}
                className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] last:border-0 text-sm"
              >
                <span className="font-medium">{h.ticker}</span>
                <span className="text-[var(--secondary-text)]">{h.weight.toFixed(0)}</span>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] text-sm font-bold">
              <span>Total</span>
              <span>100%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
