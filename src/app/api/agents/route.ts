import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  await seedDatabase();
  const db = getDb();

  const agents = await db.select().from(schema.agents);

  // Get latest snapshot for each agent
  const agentsWithPerformance = await Promise.all(agents.map(async (agent) => {
    const snapshots = await db
      .select()
      .from(schema.portfolioSnapshots)
      .where(eq(schema.portfolioSnapshots.agentId, agent.id));

    const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const currentValue = latestSnapshot?.totalValue ?? agent.initialCapital;
    const totalReturn = ((currentValue - agent.initialCapital) / agent.initialCapital) * 100;

    return {
      ...agent,
      currentValue,
      totalReturn,
    };
  }));

  // Sort by total return (desc) and add rank
  agentsWithPerformance.sort((a, b) => b.totalReturn - a.totalReturn);
  const ranked = agentsWithPerformance.map((a, i) => ({ ...a, rank: i + 1 }));

  return NextResponse.json(ranked);
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json();

  const { id, name, color, inceptionDate, initialCapital, holdings } = body;

  if (!id || !name || !color || !inceptionDate || !holdings || !Array.isArray(holdings)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate allocations sum to 100
  const totalAlloc = holdings.reduce((sum: number, h: { allocationPct: number }) => sum + h.allocationPct, 0);
  if (Math.abs(totalAlloc - 100) > 0.01) {
    return NextResponse.json({ error: 'Allocations must sum to 100%' }, { status: 400 });
  }

  try {
    await db.insert(schema.agents)
      .values({
        id,
        name,
        color,
        inceptionDate,
        initialCapital: initialCapital || 100000,
        createdAt: new Date().toISOString(),
      });

    for (const holding of holdings) {
      await db.insert(schema.holdings)
        .values({
          agentId: id,
          ticker: holding.ticker.toUpperCase(),
          allocationPct: holding.allocationPct,
        });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
