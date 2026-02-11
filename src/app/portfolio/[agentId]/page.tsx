'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { AllocationPie } from '@/components/charts/AllocationPie';
import { KPIGrid } from '@/components/portfolio/KPIGrid';
import { HoldingsTable } from '@/components/portfolio/HoldingsTable';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { Agent, KPIs, Timeframe } from '@/types';

interface AgentDetail extends Agent {
  holdings: { ticker: string; allocationPct: number }[];
  currentValue: number;
  totalReturn: number;
}

export default function PortfolioDetailPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [chartSeries, setChartSeries] = useState<{ label: string; color: string; data: { date: string; value: number }[] }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAgent(data);
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  const fetchPerformance = useCallback(async (tf: Timeframe) => {
    setChartLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${agentId}/performance?timeframe=${tf}`);
      const perf = await res.json();

      setKpis(perf.kpis);

      const series: { label: string; color: string; data: { date: string; value: number }[] }[] = [];

      if (perf.snapshots?.length > 0 && agent) {
        series.push({
          label: agent.name,
          color: agent.color,
          data: perf.snapshots,
        });
      }

      if (perf.spySnapshots?.length > 0) {
        series.push({
          label: 'SPY',
          color: '#9CA3AF',
          data: perf.spySnapshots,
        });
      }

      setChartSeries(series);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    } finally {
      setChartLoading(false);
    }
  }, [agentId, agent]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  useEffect(() => {
    if (agent) {
      fetchPerformance(timeframe);
    }
  }, [agent, timeframe, fetchPerformance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--secondary-text)]">Agent not found</p>
        <Link href="/" className="text-[var(--primary)] text-sm mt-2 inline-block">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const isPositive = agent.totalReturn >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[var(--secondary-text)] hover:text-[var(--foreground)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={`/logos/${agent.id}.png`}
              alt={agent.name}
              width={56}
              height={56}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <p className="text-sm text-[var(--secondary-text)]">
                Since {agent.inceptionDate} &middot; Started at {formatCurrency(agent.initialCapital)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold">{formatCurrency(agent.currentValue)}</p>
            <div className="flex items-center justify-end gap-2 mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-[var(--positive)]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[var(--negative)]" />
              )}
              <Badge variant={isPositive ? 'positive' : 'negative'}>
                {formatPercent(agent.totalReturn)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <PerformanceChart
        series={chartSeries}
        loading={chartLoading}
        title="Performance vs SPY"
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* KPIs */}
      {kpis && <KPIGrid kpis={kpis} />}

      {/* Holdings + Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HoldingsTable agentId={agentId} />
        </div>
        <div>
          <AllocationPie data={agent.holdings} title="Portfolio Allocation" />
        </div>
      </div>
    </div>
  );
}
