'use client';

import { useEffect, useState, useCallback } from 'react';
import { AgentCard } from '@/components/dashboard/AgentCard';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { PerformanceTable } from '@/components/dashboard/PerformanceTable';
import { Spinner } from '@/components/ui/Spinner';
import { RefreshCw } from 'lucide-react';
import type { AgentWithPerformance, Timeframe } from '@/types';

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentWithPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  const [chartSeries, setChartSeries] = useState<{ label: string; color: string; data: { date: string; value: number }[] }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
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

  const fetchChartData = useCallback(async (agentList: AgentWithPerformance[], tf: Timeframe) => {
    if (agentList.length === 0) return;
    setChartLoading(true);
    try {
      const series: { label: string; color: string; data: { date: string; value: number }[] }[] = [];
      let spyData: { date: string; value: number }[] = [];

      for (const agent of agentList) {
        const res = await fetch(`/api/portfolio/${agent.id}/performance?timeframe=${tf}`);
        const perf = await res.json();
        series.push({
          label: agent.name,
          color: agent.color,
          data: perf.snapshots || [],
        });
        if (perf.spySnapshots && perf.spySnapshots.length > 0) {
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
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setChartLoading(false);
    }
  }, []);

  // Auto-sync on mount + 15-min polling
  useEffect(() => {
    let cancelled = false;

    async function syncAndRefresh() {
      try {
        await fetch('/api/prices/sync', { method: 'POST' });
        if (cancelled) return;
        await fetchAgents();
      } catch (error) {
        console.error('Auto-sync failed:', error);
        // Still fetch agents even if sync fails — show stale data
        if (!cancelled) await fetchAgents();
      }
    }

    syncAndRefresh();

    const interval = setInterval(syncAndRefresh, 15 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchAgents]);

  useEffect(() => {
    if (agents.length > 0) {
      fetchChartData(agents, timeframe);
    }
  }, [agents, timeframe, fetchChartData]);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/prices/sync', { method: 'POST' });
      await fetchAgents();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Portfolio Tracker</h1>
          <p className="text-[var(--secondary-text)] text-sm mt-1">
            Tracking {agents.length} AI agent portfolios vs SPY benchmark
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg text-sm font-medium hover:bg-[var(--background)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Update Prices'}
        </button>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Performance Chart */}
      <PerformanceChart
        series={chartSeries}
        loading={chartLoading}
        title="Portfolio Performance"
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
      />

      {/* KPI Comparison Table */}
      <PerformanceTable />
    </div>
  );
}
