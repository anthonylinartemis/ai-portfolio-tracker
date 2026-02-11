'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatPercent, formatRatio, formatCurrency } from '@/lib/utils';
import type { KPIs } from '@/types';

interface AgentKPIs {
  agentId: string;
  name: string;
  color: string;
  kpis: KPIs;
}

export function PerformanceTable() {
  const [data, setData] = useState<AgentKPIs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const agentsRes = await fetch('/api/agents');
        const agents = await agentsRes.json();

        const kpiPromises = agents.map(async (agent: { id: string; name: string; color: string }) => {
          const res = await fetch(`/api/portfolio/${agent.id}/performance?timeframe=ALL`);
          const perf = await res.json();
          return {
            agentId: agent.id,
            name: agent.name,
            color: agent.color,
            kpis: perf.kpis,
          };
        });

        const results = await Promise.all(kpiPromises);
        setData(results);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="flex items-center justify-center h-48">
        <Spinner />
      </Card>
    );
  }

  if (data.length === 0) return null;

  const metrics = [
    { key: 'totalReturn', label: 'Total Return', format: formatPercent },
    { key: 'annualizedReturn', label: 'Ann. Return', format: formatPercent },
    { key: 'sharpeRatio', label: 'Sharpe', format: formatRatio },
    { key: 'sortinoRatio', label: 'Sortino', format: formatRatio },
    { key: 'maxDrawdown', label: 'Max Drawdown', format: (v: number) => `-${v.toFixed(2)}%` },
    { key: 'volatility', label: 'Volatility', format: formatPercent },
    { key: 'alpha', label: 'Alpha', format: formatPercent },
    { key: 'beta', label: 'Beta', format: formatRatio },
    { key: 'winRate', label: 'Win Rate', format: (v: number) => `${v.toFixed(1)}%` },
  ];

  return (
    <Card padding={false}>
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-lg">KPI Comparison</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--secondary-text)]">
                Metric
              </th>
              {data.map((d) => (
                <th key={d.agentId} className="text-right px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="font-medium">{d.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium text-[var(--secondary-text)]">
                  {metric.label}
                </td>
                {data.map((d) => {
                  const value = d.kpis[metric.key as keyof KPIs] as number;
                  const isReturn = ['totalReturn', 'annualizedReturn', 'alpha'].includes(metric.key);
                  return (
                    <td
                      key={d.agentId}
                      className={`text-right px-4 py-3 font-medium ${
                        isReturn ? (value >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]') : ''
                      }`}
                    >
                      {metric.format(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
