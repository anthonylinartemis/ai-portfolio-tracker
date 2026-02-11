import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';

const DB_PATH = path.join(process.cwd(), 'data', 'portfolio.db');

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    _db = drizzle(sqlite, { schema });

    // Auto-create tables on first connection
    migrate(sqlite);
  }
  return _db;
}

function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      inception_date TEXT NOT NULL,
      initial_capital REAL NOT NULL DEFAULT 100000,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      ticker TEXT NOT NULL,
      allocation_pct REAL NOT NULL,
      shares REAL
    );

    CREATE TABLE IF NOT EXISTS daily_prices (
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL NOT NULL,
      adj_close REAL,
      volume INTEGER,
      PRIMARY KEY (ticker, date)
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      agent_id TEXT NOT NULL REFERENCES agents(id),
      date TEXT NOT NULL,
      total_value REAL NOT NULL,
      daily_return REAL,
      PRIMARY KEY (agent_id, date)
    );
  `);
}

export { schema };
