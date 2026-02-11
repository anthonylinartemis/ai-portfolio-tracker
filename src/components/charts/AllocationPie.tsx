'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/Card';

interface AllocationData {
  ticker: string;
  allocationPct: number;
  currentValue?: number;
}

interface AllocationPieProps {
  data: AllocationData[];
  title?: string;
}

const COLORS = [
  '#0052FF', '#8B5CF6', '#10A37F', '#F59E0B',
  '#EF4444', '#06B6D4', '#EC4899', '#84CC16',
];

export function AllocationPie({ data, title = 'Allocation' }: AllocationPieProps) {
  return (
    <Card>
      <h2 className="font-semibold text-lg mb-4">{title}</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="allocationPct"
              nameKey="ticker"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Allocation']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #2B3139',
                backgroundColor: '#1E2329',
                color: '#EAECEF',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item, index) => (
          <div key={item.ticker} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-[var(--secondary-text)] truncate">
              {item.ticker}
            </span>
            <span className="text-sm font-medium ml-auto">
              {item.allocationPct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
