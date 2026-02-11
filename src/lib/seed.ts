import { getDb, schema } from '@/lib/db';

const DEFAULT_AGENTS = [
  {
    id: 'gemini',
    name: 'Gemini',
    color: '#4285F4',
    inceptionDate: '2026-02-11',
    initialCapital: 100000,
    holdings: [
      { ticker: 'NVDA', allocationPct: 15 },
      { ticker: 'LLY', allocationPct: 13 },
      { ticker: 'VST', allocationPct: 12 },
      { ticker: 'VRT', allocationPct: 10 },
      { ticker: 'AMZN', allocationPct: 10 },
      { ticker: 'MSFT', allocationPct: 9 },
      { ticker: 'ETN', allocationPct: 9 },
      { ticker: 'BX', allocationPct: 8 },
      { ticker: 'MELI', allocationPct: 7 },
      { ticker: 'HWM', allocationPct: 7 },
    ],
  },
  {
    id: 'grok',
    name: 'Grok',
    color: '#1DA1F2',
    inceptionDate: '2026-02-11',
    initialCapital: 100000,
    holdings: [
      { ticker: 'NVDA', allocationPct: 15 },
      { ticker: 'MSFT', allocationPct: 12 },
      { ticker: 'AMZN', allocationPct: 12 },
      { ticker: 'TSM', allocationPct: 10 },
      { ticker: 'XOM', allocationPct: 10 },
      { ticker: 'AVGO', allocationPct: 9 },
      { ticker: 'BMY', allocationPct: 8 },
      { ticker: 'JNJ', allocationPct: 8 },
      { ticker: 'COST', allocationPct: 8 },
      { ticker: 'VRSK', allocationPct: 8 },
    ],
  },
  {
    id: 'claude',
    name: 'Claude',
    color: '#8B5CF6',
    inceptionDate: '2026-02-11',
    initialCapital: 100000,
    holdings: [
      { ticker: 'GOOGL', allocationPct: 15 },
      { ticker: 'LLY', allocationPct: 13 },
      { ticker: 'NEM', allocationPct: 12 },
      { ticker: 'VST', allocationPct: 12 },
      { ticker: 'GEV', allocationPct: 10 },
      { ticker: 'META', allocationPct: 10 },
      { ticker: 'AEM', allocationPct: 8 },
      { ticker: 'CEG', allocationPct: 8 },
      { ticker: 'GE', allocationPct: 7 },
      { ticker: 'FCX', allocationPct: 5 },
    ],
  },
  {
    id: 'gpt',
    name: 'GPT',
    color: '#10A37F',
    inceptionDate: '2026-02-11',
    initialCapital: 100000,
    holdings: [
      { ticker: 'NVDA', allocationPct: 12 },
      { ticker: 'MSFT', allocationPct: 12 },
      { ticker: 'AMZN', allocationPct: 10 },
      { ticker: 'ANET', allocationPct: 10 },
      { ticker: 'ETN', allocationPct: 10 },
      { ticker: 'LLY', allocationPct: 10 },
      { ticker: 'JPM', allocationPct: 10 },
      { ticker: 'RTX', allocationPct: 10 },
      { ticker: 'GOOGL', allocationPct: 8 },
      { ticker: 'GEV', allocationPct: 8 },
    ],
  },
];

export function seedDatabase() {
  const db = getDb();

  // Check if agents already exist
  const existing = db.select().from(schema.agents).all();
  if (existing.length > 0) return;

  const now = new Date().toISOString();

  for (const agent of DEFAULT_AGENTS) {
    db.insert(schema.agents)
      .values({
        id: agent.id,
        name: agent.name,
        color: agent.color,
        inceptionDate: agent.inceptionDate,
        initialCapital: agent.initialCapital,
        createdAt: now,
      })
      .run();

    for (const holding of agent.holdings) {
      db.insert(schema.holdings)
        .values({
          agentId: agent.id,
          ticker: holding.ticker,
          allocationPct: holding.allocationPct,
        })
        .run();
    }
  }
}
