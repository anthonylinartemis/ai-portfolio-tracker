import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  inceptionDate: text('inception_date').notNull(),
  initialCapital: real('initial_capital').notNull().default(100000),
  createdAt: text('created_at').notNull(),
});

export const holdings = sqliteTable('holdings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: text('agent_id').notNull().references(() => agents.id),
  ticker: text('ticker').notNull(),
  allocationPct: real('allocation_pct').notNull(),
  shares: real('shares'),
});

export const dailyPrices = sqliteTable('daily_prices', {
  ticker: text('ticker').notNull(),
  date: text('date').notNull(),
  open: real('open'),
  high: real('high'),
  low: real('low'),
  close: real('close').notNull(),
  adjClose: real('adj_close'),
  volume: integer('volume'),
}, (table) => ({
  pk: primaryKey({ columns: [table.ticker, table.date] }),
}));

export const portfolioSnapshots = sqliteTable('portfolio_snapshots', {
  agentId: text('agent_id').notNull().references(() => agents.id),
  date: text('date').notNull(),
  totalValue: real('total_value').notNull(),
  dailyReturn: real('daily_return'),
}, (table) => ({
  pk: primaryKey({ columns: [table.agentId, table.date] }),
}));
