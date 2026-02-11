'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface HoldingInput {
  ticker: string;
  allocationPct: string;
}

export function AddPortfolioForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [color, setColor] = useState('#0052FF');
  const [inceptionDate, setInceptionDate] = useState('2026-02-11');
  const [holdings, setHoldings] = useState<HoldingInput[]>([
    { ticker: '', allocationPct: '' },
  ]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalAllocation = holdings.reduce(
    (sum, h) => sum + (parseFloat(h.allocationPct) || 0),
    0
  );

  function addHolding() {
    setHoldings([...holdings, { ticker: '', allocationPct: '' }]);
  }

  function removeHolding(index: number) {
    setHoldings(holdings.filter((_, i) => i !== index));
  }

  function updateHolding(index: number, field: keyof HoldingInput, value: string) {
    const updated = [...holdings];
    updated[index] = { ...updated[index], [field]: value };
    setHoldings(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name || !id) {
      setError('Name and ID are required');
      return;
    }

    if (Math.abs(totalAllocation - 100) > 0.01) {
      setError(`Allocations must sum to 100% (currently ${totalAllocation.toFixed(1)}%)`);
      return;
    }

    const emptyTickers = holdings.filter((h) => !h.ticker.trim());
    if (emptyTickers.length > 0) {
      setError('All holdings must have a ticker');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.toLowerCase().replace(/\s+/g, '-'),
          name,
          color,
          inceptionDate,
          initialCapital: 100000,
          holdings: holdings.map((h) => ({
            ticker: h.ticker.toUpperCase().trim(),
            allocationPct: parseFloat(h.allocationPct),
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create agent');
        return;
      }

      // Trigger sync for the new agent
      await fetch('/api/prices/sync', { method: 'POST' });

      router.push('/');
    } catch {
      setError('Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Add AI Agent Portfolio</h2>
          <p className="text-sm text-[var(--secondary-text)]">
            Create a new portfolio starting at $100,000
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-[var(--negative)] text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!id) setId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              placeholder="e.g. DeepSeek"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent ID</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. deepseek"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-10 rounded-lg border border-[var(--border)] cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Inception Date</label>
            <input
              type="date"
              value={inceptionDate}
              onChange={(e) => setInceptionDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium">
              Holdings
              <span className={`ml-2 text-xs ${Math.abs(totalAllocation - 100) < 0.01 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}`}>
                ({totalAllocation.toFixed(1)}% / 100%)
              </span>
            </label>
            <button
              type="button"
              onClick={addHolding}
              className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              <Plus className="h-4 w-4" /> Add Holding
            </button>
          </div>

          <div className="space-y-2">
            {holdings.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.ticker}
                  onChange={(e) => updateHolding(i, 'ticker', e.target.value)}
                  placeholder="Ticker (e.g. AAPL)"
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                <div className="relative">
                  <input
                    type="number"
                    value={h.allocationPct}
                    onChange={(e) => updateHolding(i, 'allocationPct', e.target.value)}
                    placeholder="Alloc %"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-28 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  />
                </div>
                {holdings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHolding(i)}
                    className="p-2 text-[var(--secondary-text)] hover:text-[var(--negative)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Portfolio'}
        </button>
      </form>
    </Card>
  );
}
