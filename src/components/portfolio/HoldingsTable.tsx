'use client';

import { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrencyPrecise, formatPercent } from '@/lib/utils';

interface HoldingRow {
  ticker: string;
  allocationPct: number;
  shares: number;
  currentPrice: number | null;
  currentValue: number;
  returnPct: number;
}

const columnHelper = createColumnHelper<HoldingRow>();

const columns = [
  columnHelper.accessor('ticker', {
    header: 'Ticker',
    cell: (info) => (
      <span className="font-medium">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor('allocationPct', {
    header: 'Allocation',
    cell: (info) => `${info.getValue().toFixed(1)}%`,
  }),
  columnHelper.accessor('shares', {
    header: 'Shares',
    cell: (info) => info.getValue()?.toFixed(2) ?? '—',
  }),
  columnHelper.accessor('currentPrice', {
    header: 'Price',
    cell: (info) => {
      const val = info.getValue();
      return val != null ? formatCurrencyPrecise(val) : '—';
    },
  }),
  columnHelper.accessor('currentValue', {
    header: 'Value',
    cell: (info) => formatCurrencyPrecise(info.getValue()),
  }),
  columnHelper.accessor('returnPct', {
    header: 'Return',
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className={val >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
          {formatPercent(val)}
        </span>
      );
    },
  }),
];

interface HoldingsTableProps {
  agentId: string;
}

export function HoldingsTable({ agentId }: HoldingsTableProps) {
  const [data, setData] = useState<HoldingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    async function fetchHoldings() {
      try {
        const res = await fetch(`/api/portfolio/${agentId}/holdings`);
        const holdings = await res.json();
        setData(holdings);
      } catch (error) {
        console.error('Failed to fetch holdings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchHoldings();
  }, [agentId]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <Card className="flex items-center justify-center h-48">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="font-semibold text-lg">Holdings</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 font-medium text-[var(--secondary-text)] cursor-pointer hover:text-[var(--foreground)]"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
