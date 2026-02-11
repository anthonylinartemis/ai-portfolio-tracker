'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/Card';

interface AgentMetric {
  agentId: string;
  name: string;
  color: string;
  value: number;
}

interface ComparisonBarProps {
  data: { metric: string; agents: AgentMetric[] }[];
  title?: string;
}

export function ComparisonBar({ data, title = 'Comparison' }: ComparisonBarProps) {
  // Transform data for Recharts grouped bar
  const chartData = data.map((d) => {
    const row: Record<string, string | number> = { metric: d.metric };
    for (const agent of d.agents) {
      row[agent.name] = Number(agent.value.toFixed(2));
    }
    return row;
  });

  // Get unique agent names and colors
  const agents = data[0]?.agents.map((a) => ({ name: a.name, color: a.color })) || [];

  return (
    <Card>
      <h2 className="font-semibold text-lg mb-4">{title}</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
            <XAxis
              dataKey="metric"
              tick={{ fill: '#848E9C', fontSize: 12 }}
              axisLine={{ stroke: '#2B3139' }}
            />
            <YAxis
              tick={{ fill: '#848E9C', fontSize: 12 }}
              axisLine={{ stroke: '#2B3139' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #2B3139',
                backgroundColor: '#1E2329',
                color: '#EAECEF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            />
            <Legend />
            {agents.map((agent) => (
              <Bar
                key={agent.name}
                dataKey={agent.name}
                fill={agent.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
