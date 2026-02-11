import { NextResponse } from 'next/server';
import { eq, and, max } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const db = getDb();

  const agent = db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, agentId))
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const agentHoldings = db
    .select()
    .from(schema.holdings)
    .where(eq(schema.holdings.agentId, agentId))
    .all();

  // For each holding, get inception price and latest price
  const holdingsWithPrices = agentHoldings.map((h) => {
    // Get inception price
    const inceptionRow = db
      .select()
      .from(schema.dailyPrices)
      .where(
        and(
          eq(schema.dailyPrices.ticker, h.ticker),
        )
      )
      .all();

    const inceptionPrice = inceptionRow.length > 0 ? inceptionRow[0].close : null;
    const latestPrice = inceptionRow.length > 0 ? inceptionRow[inceptionRow.length - 1].close : null;

    const dollarAmount = (h.allocationPct / 100) * agent.initialCapital;
    const shares = inceptionPrice ? dollarAmount / inceptionPrice : 0;
    const currentValue = latestPrice ? shares * latestPrice : dollarAmount;
    const returnPct = inceptionPrice && latestPrice
      ? ((latestPrice - inceptionPrice) / inceptionPrice) * 100
      : 0;

    return {
      ...h,
      shares,
      inceptionPrice,
      currentPrice: latestPrice,
      currentValue,
      returnPct,
    };
  });

  return NextResponse.json(holdingsWithPrices);
}
