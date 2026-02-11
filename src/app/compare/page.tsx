'use client';

import { useEffect, useState, useCallback } from 'react';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { ComparisonBar } from '@/components/charts/ComparisonBar';
import { PortfolioBreakdown } from '@/components/dashboard/PortfolioBreakdown';
import { Spinner } from '@/components/ui/Spinner';
import type { AgentWithPerformance, KPIs, Timeframe } from '@/types';

interface AgentKPIs {
  agentId: string;
  name: string;
  color: string;
  kpis: KPIs;
}

export default function ComparePage() {
  const [agents, setAgents] = useState<AgentWithPerformance[]>([]);
  const [agentKPIs, setAgentKPIs] = useState<AgentKPIs[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [chartSeries, setChartSeries] = useState<{ label: string; color: string; data: { date: string; value: number }[] }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChartAndKPIs = useCallback(async (agentList: AgentWithPerformance[], tf: Timeframe) => {
    if (agentList.length === 0) return;
    setChartLoading(true);

    try {
      const series: { label: string; color: string; data: { date: string; value: number }[] }[] = [];
      let spyData: { date: string; value: number }[] = [];
      const kpis: AgentKPIs[] = [];

      for (const agent of agentList) {
        const res = await fetch(`/api/portfolio/${agent.id}/performance?timeframe=${tf}`);
        const perf = await res.json();

        series.push({
          label: agent.name,
          color: agent.color,
          data: perf.snapshots || [],
        });

        kpis.push({
          agentId: agent.id,
          name: agent.name,
          color: agent.color,
          kpis: perf.kpis,
        });

        if (perf.spySnapshots?.length > 0) {
          spyData = perf.spySnapshots;
        }
      }

      if (spyData.length > 0) {
        series.push({
          label: 'SPY',
          color: '#9CA3AF',
          data: spyData,
        });
      }

      setChartSeries(series);
      setAgentKPIs(kpis);
    } catch (error) {
      console.error('Failed to fetch performance:', error);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (agents.length > 0) {
      fetchChartAndKPIs(agents, timeframe);
    }
  }, [agents, timeframe, fetchChartAndKPIs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Build comparison bar data
  const comparisonMetrics = [
    { key: 'totalReturn', label: 'Total Return %' },
    { key: 'sharpeRatio', label: 'Sharpe' },
    { key: 'sortinoRatio', label: 'Sortino' },
    { key: 'maxDrawdown', label: 'Max DD %' },
    { key: 'alpha', label: 'Alpha %' },
  ];

  const barData = comparisonMetrics.map((metric) => ({
    metric: metric.label,
    agents: agentKPIs.map((a) => ({
      agentId: a.agentId,
      name: a.name,
      color: a.color,
      value: a.kpis[metric.key as keyof KPIs] as number,
    })),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Compare Portfolios</h1>
        <p className="text-[var(--secondary-text)] text-sm mt-1">
          Side-by-side comparison of all AI agent portfolios
        </p>
      </div>

      {/* Overlay Line Chart */}
      <PerformanceChart
        series={chartSeries}
        loading={chartLoading}
        title="All Portfolios vs SPY"
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* Comparison Bars */}
      {barData.length > 0 && (
        <ComparisonBar data={barData} title="KPI Comparison" />
      )}

      {/* Portfolio Breakdown — cross-agent holdings grid */}
      <PortfolioBreakdown />
    </div>
  );
}
