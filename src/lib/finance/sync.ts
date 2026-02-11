import { getDb, schema } from '@/lib/db';
import { eq, and, max } from 'drizzle-orm';
import { fetchHistoricalPrices } from './yahoo';
import { toISODate } from '@/lib/utils';

export async function syncPricesForTicker(ticker: string): Promise<number> {
  const db = getDb();

  // Find the last date we have for this ticker
  const [lastRow] = await db
    .select({ maxDate: max(schema.dailyPrices.date) })
    .from(schema.dailyPrices)
    .where(eq(schema.dailyPrices.ticker, ticker));

  const lastDate = lastRow?.maxDate;
  const today = toISODate(new Date());

  // If we already have today's data, skip
  if (lastDate === today) return 0;

  // Fetch from day after last date (or inception if no data)
  const startDate = lastDate
    ? (() => {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + 1);
        return toISODate(d);
      })()
    : '2026-02-10';

  if (startDate > today) return 0;

  // Use tomorrow as period2 since Yahoo's API treats it as exclusive
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endDate = toISODate(tomorrow);

  const rows = await fetchHistoricalPrices(ticker, startDate, endDate);

  if (rows.length === 0) return 0;

  // Insert new rows, skip existing
  let inserted = 0;
  for (const row of rows) {
    try {
      await db.insert(schema.dailyPrices)
        .values({
          ticker,
          date: row.date,
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          adjClose: row.adjClose,
          volume: row.volume,
        })
        .onConflictDoNothing();
      inserted++;
    } catch {
      // Skip duplicates
    }
  }

  return inserted;
}

export async function syncAllPrices(): Promise<{ ticker: string; inserted: number }[]> {
  const db = getDb();

  // Get all unique tickers from holdings + SPY
  const holdingRows = await db
    .select({ ticker: schema.holdings.ticker })
    .from(schema.holdings);

  const tickers = [...new Set([...holdingRows.map((h) => h.ticker), 'SPY'])];

  const results: { ticker: string; inserted: number }[] = [];

  // Sequential fetching to respect rate limits
  for (const ticker of tickers) {
    const inserted = await syncPricesForTicker(ticker);
    results.push({ ticker, inserted });
  }

  return results;
}

export async function computeSnapshots(agentId: string): Promise<void> {
  const db = getDb();

  const [agent] = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, agentId));

  if (!agent) return;

  const agentHoldings = await db
    .select()
    .from(schema.holdings)
    .where(eq(schema.holdings.agentId, agentId));

  if (agentHoldings.length === 0) return;

  // Get all dates where we have price data for all tickers
  const tickers = agentHoldings.map((h) => h.ticker);

  // For each ticker, get their prices
  const pricesByTicker: Record<string, Record<string, number>> = {};
  for (const ticker of tickers) {
    const prices = await db
      .select({ date: schema.dailyPrices.date, close: schema.dailyPrices.close })
      .from(schema.dailyPrices)
      .where(
        and(
          eq(schema.dailyPrices.ticker, ticker),
        )
      );

    pricesByTicker[ticker] = {};
    for (const p of prices) {
      pricesByTicker[ticker][p.date] = p.close;
    }
  }

  // Find all dates where ALL tickers have data
  const allDates = new Set<string>();
  for (const ticker of tickers) {
    for (const date of Object.keys(pricesByTicker[ticker] || {})) {
      allDates.add(date);
    }
  }

  const sortedDates = Array.from(allDates).sort();
  const validDates = sortedDates.filter((date) =>
    date >= agent.inceptionDate &&
    tickers.every((t) => pricesByTicker[t]?.[date] != null)
  );

  if (validDates.length === 0) return;

  // Calculate initial shares for each holding
  const inceptionDate = validDates[0];
  const initialShares: Record<string, number> = {};
  for (const h of agentHoldings) {
    const inceptionPrice = pricesByTicker[h.ticker]?.[inceptionDate];
    if (inceptionPrice) {
      const dollarAmount = (h.allocationPct / 100) * agent.initialCapital;
      initialShares[h.ticker] = dollarAmount / inceptionPrice;

      // Update shares in DB
      await db.update(schema.holdings)
        .set({ shares: initialShares[h.ticker] })
        .where(eq(schema.holdings.id, h.id));
    }
  }

  // Compute daily portfolio values
  let prevValue: number | null = null;

  for (const date of validDates) {
    let totalValue = 0;
    for (const h of agentHoldings) {
      const price = pricesByTicker[h.ticker]?.[date];
      const shares = initialShares[h.ticker];
      if (price && shares) {
        totalValue += price * shares;
      }
    }

    const dailyReturn = prevValue != null ? (totalValue - prevValue) / prevValue : null;

    await db.insert(schema.portfolioSnapshots)
      .values({
        agentId,
        date,
        totalValue,
        dailyReturn,
      })
      .onConflictDoNothing();

    prevValue = totalValue;
  }
}

export async function syncAndCompute(): Promise<void> {
  const db = getDb();

  // Sync prices
  await syncAllPrices();

  // Recompute snapshots for all agents
  const allAgents = await db.select().from(schema.agents);
  for (const agent of allAgents) {
    await computeSnapshots(agent.id);
  }
}
