import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;
  const db = getDb();

  const [agent] = await db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, agentId));

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const agentHoldings = await db
    .select()
    .from(schema.holdings)
    .where(eq(schema.holdings.agentId, agentId));

  // For each holding, get inception price and latest price
  const holdingsWithPrices = await Promise.all(agentHoldings.map(async (h) => {
    // Get all prices for this ticker
    const priceRows = await db
      .select()
      .from(schema.dailyPrices)
      .where(
        and(
          eq(schema.dailyPrices.ticker, h.ticker),
        )
      );

    const inceptionPrice = priceRows.length > 0 ? priceRows[0].close : null;
    const latestPrice = priceRows.length > 0 ? priceRows[priceRows.length - 1].close : null;

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
  }));

  return NextResponse.json(holdingsWithPrices);
}
