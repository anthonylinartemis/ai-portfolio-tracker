import type { KPIs } from '@/types';

const RISK_FREE_RATE = 0.05; // 5% annualized
const TRADING_DAYS_PER_YEAR = 252;
const DAILY_RF = RISK_FREE_RATE / TRADING_DAYS_PER_YEAR;

export function calculateKPIs(
  snapshots: { date: string; totalValue: number; dailyReturn: number | null }[],
  initialCapital: number,
  spySnapshots?: { date: string; totalValue: number; dailyReturn: number | null }[]
): KPIs {
  if (snapshots.length === 0) {
    return emptyKPIs(initialCapital);
  }

  const currentValue = snapshots[snapshots.length - 1].totalValue;
  const dailyReturns = snapshots
    .map((s) => s.dailyReturn)
    .filter((r): r is number => r != null);

  if (dailyReturns.length === 0) {
    return emptyKPIs(initialCapital);
  }

  // Total Return
  const totalReturn = ((currentValue - initialCapital) / initialCapital) * 100;

  // Annualized Return (only meaningful with 21+ trading days)
  const tradingDays = dailyReturns.length;
  const annualizedReturn =
    tradingDays >= 21
      ? (Math.pow(currentValue / initialCapital, TRADING_DAYS_PER_YEAR / tradingDays) - 1) * 100
      : totalReturn;

  // Mean daily return
  const meanDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;

  // Standard deviation of daily returns (need 2+ observations)
  let stdDev = 0;
  let volatility = 0;
  let sharpeRatio = 0;
  let sortinoRatio = 0;

  if (dailyReturns.length >= 2) {
    const variance =
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDailyReturn, 2), 0) /
      dailyReturns.length;
    stdDev = Math.sqrt(variance);

    // Volatility (annualized)
    volatility = stdDev * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100;

    // Sharpe Ratio
    sharpeRatio = stdDev > 0 ? ((meanDailyReturn - DAILY_RF) / stdDev) * Math.sqrt(TRADING_DAYS_PER_YEAR) : 0;

    // Sortino Ratio (only downside deviation)
    const negativeReturns = dailyReturns.filter((r) => r < 0);
    const downsideVariance =
      negativeReturns.length > 0
        ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / dailyReturns.length
        : 0;
    const downsideDev = Math.sqrt(downsideVariance);
    sortinoRatio =
      downsideDev > 0
        ? ((meanDailyReturn - DAILY_RF) / downsideDev) * Math.sqrt(TRADING_DAYS_PER_YEAR)
        : 0;
  }

  // Max Drawdown
  let peak = snapshots[0].totalValue;
  let maxDrawdown = 0;
  for (const snap of snapshots) {
    if (snap.totalValue > peak) peak = snap.totalValue;
    const drawdown = (peak - snap.totalValue) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  maxDrawdown *= 100;

  // Alpha and Beta (vs SPY)
  let alpha = 0;
  let beta = 1;

  if (spySnapshots && spySnapshots.length > 0 && tradingDays >= 21) {
    const spyReturns = spySnapshots
      .map((s) => s.dailyReturn)
      .filter((r): r is number => r != null);

    // Align lengths
    const minLen = Math.min(dailyReturns.length, spyReturns.length);
    const pReturns = dailyReturns.slice(-minLen);
    const sReturns = spyReturns.slice(-minLen);

    if (minLen > 1) {
      const meanP = pReturns.reduce((a, b) => a + b, 0) / minLen;
      const meanS = sReturns.reduce((a, b) => a + b, 0) / minLen;

      let cov = 0;
      let varS = 0;
      for (let i = 0; i < minLen; i++) {
        cov += (pReturns[i] - meanP) * (sReturns[i] - meanS);
        varS += Math.pow(sReturns[i] - meanS, 2);
      }
      cov /= minLen;
      varS /= minLen;

      beta = varS > 0 ? cov / varS : 1;

      // SPY annualized return
      const spyFirstVal = spySnapshots[0].totalValue;
      const spyLastVal = spySnapshots[spySnapshots.length - 1].totalValue;
      const spyAnnualized =
        (Math.pow(spyLastVal / spyFirstVal, TRADING_DAYS_PER_YEAR / minLen) - 1) * 100;

      alpha = annualizedReturn - (RISK_FREE_RATE * 100 + beta * (spyAnnualized - RISK_FREE_RATE * 100));
    }
  }

  // Win Rate
  const winningDays = dailyReturns.filter((r) => r > 0).length;
  const winRate = (winningDays / dailyReturns.length) * 100;

  // Best / Worst Day
  const bestDay = Math.max(...dailyReturns) * 100;
  const worstDay = Math.min(...dailyReturns) * 100;

  return {
    totalReturn,
    annualizedReturn,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    volatility,
    alpha,
    beta,
    winRate,
    bestDay,
    worstDay,
    currentValue,
  };
}

function emptyKPIs(initialCapital: number): KPIs {
  return {
    totalReturn: 0,
    annualizedReturn: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    maxDrawdown: 0,
    volatility: 0,
    alpha: 0,
    beta: 0,
    winRate: 0,
    bestDay: 0,
    worstDay: 0,
    currentValue: initialCapital,
  };
}
