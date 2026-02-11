import { NextResponse } from 'next/server';
import { eq, and, gte } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { calculateKPIs } from '@/lib/finance/calculations';
import { getTimeframeStartDate } from '@/lib/utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'ALL';

  const db = getDb();

  const agent = db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, agentId))
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const startDate = getTimeframeStartDate(timeframe, agent.inceptionDate);

  // Get agent snapshots
  const snapshots = db
    .select()
    .from(schema.portfolioSnapshots)
    .where(
      and(
        eq(schema.portfolioSnapshots.agentId, agentId),
        gte(schema.portfolioSnapshots.date, startDate)
      )
    )
    .all();

  // Get SPY snapshots for benchmark (compute SPY as a virtual portfolio)
  const spyPrices = db
    .select()
    .from(schema.dailyPrices)
    .where(
      and(
        eq(schema.dailyPrices.ticker, 'SPY'),
        gte(schema.dailyPrices.date, startDate)
      )
    )
    .all();

  // Convert SPY prices to snapshot-like format
  const spyInitialPrice = spyPrices.length > 0 ? spyPrices[0].close : 1;
  const spyInitialValue = agent.initialCapital;
  let prevSpyValue: number | null = null;

  const spySnapshots = spyPrices.map((p) => {
    const totalValue = (p.close / spyInitialPrice) * spyInitialValue;
    const dailyReturn = prevSpyValue != null ? (totalValue - prevSpyValue) / prevSpyValue : null;
    prevSpyValue = totalValue;
    return { date: p.date, totalValue, dailyReturn };
  });

  const kpis = calculateKPIs(snapshots, agent.initialCapital, spySnapshots);

  return NextResponse.json({
    kpis,
    snapshots: snapshots.map((s) => ({
      date: s.date,
      value: s.totalValue,
    })),
    spySnapshots: spySnapshots.map((s) => ({
      date: s.date,
      value: s.totalValue,
    })),
    timeframe,
  });
}
