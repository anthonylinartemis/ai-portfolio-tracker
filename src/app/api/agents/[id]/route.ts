import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const agent = db
    .select()
    .from(schema.agents)
    .where(eq(schema.agents.id, id))
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const agentHoldings = db
    .select()
    .from(schema.holdings)
    .where(eq(schema.holdings.agentId, id))
    .all();

  const snapshots = db
    .select()
    .from(schema.portfolioSnapshots)
    .where(eq(schema.portfolioSnapshots.agentId, id))
    .all();

  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const currentValue = latestSnapshot?.totalValue ?? agent.initialCapital;
  const totalReturn = ((currentValue - agent.initialCapital) / agent.initialCapital) * 100;

  return NextResponse.json({
    ...agent,
    holdings: agentHoldings,
    currentValue,
    totalReturn,
    snapshotCount: snapshots.length,
  });
}
