export interface Agent {
  id: string;
  name: string;
  color: string;
  inceptionDate: string;
  initialCapital: number;
  createdAt: string;
}

export interface Holding {
  id: number;
  agentId: string;
  ticker: string;
  allocationPct: number;
  shares: number | null;
}

export interface DailyPrice {
  ticker: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  adjClose: number | null;
  volume: number | null;
}

export interface PortfolioSnapshot {
  agentId: string;
  date: string;
  totalValue: number;
  dailyReturn: number | null;
}

export interface KPIs {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
  alpha: number;
  beta: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
  currentValue: number;
}

export interface AgentWithPerformance extends Agent {
  currentValue: number;
  totalReturn: number;
  rank?: number;
}

export type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
