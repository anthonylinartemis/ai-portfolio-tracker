import YahooFinance from 'yahoo-finance2';

const RATE_LIMIT_MS = 500;

let lastRequestTime = 0;
let _yf: InstanceType<typeof YahooFinance> | null = null;

function getYf() {
  if (!_yf) {
    _yf = new YahooFinance();
  }
  return _yf;
}

async function rateLimitedWait() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface HistoricalRow {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  adjClose: number | null;
  volume: number | null;
}

export async function fetchHistoricalPrices(
  ticker: string,
  startDate: string,
  endDate?: string
): Promise<HistoricalRow[]> {
  await rateLimitedWait();

  try {
    const yf = getYf();
    const result = await yf.chart(ticker, {
      period1: startDate,
      period2: endDate || new Date().toISOString().split('T')[0],
      interval: '1d',
      return: 'array' as const,
    });

    if (!result.quotes || result.quotes.length === 0) {
      return [];
    }

    return result.quotes
      .filter((q) => q.close != null)
      .map((q) => ({
        date: new Date(q.date).toISOString().split('T')[0],
        open: q.open ?? null,
        high: q.high ?? null,
        low: q.low ?? null,
        close: q.close!,
        adjClose: q.adjclose ?? q.close ?? null,
        volume: q.volume ?? null,
      }));
  } catch (error) {
    console.error(`Failed to fetch prices for ${ticker}:`, error);
    return [];
  }
}

export async function fetchQuote(ticker: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  await rateLimitedWait();

  try {
    const yf = getYf();
    const result = await yf.quote(ticker);
    return {
      price: result.regularMarketPrice ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${ticker}:`, error);
    return null;
  }
}
