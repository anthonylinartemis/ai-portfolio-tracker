export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCurrencyPrecise(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getTimeframeStartDate(timeframe: string, inceptionDate?: string): string {
  const now = new Date();
  let start: Date;

  switch (timeframe) {
    case '1W':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case '1M':
      start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      break;
    case '3M':
      start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      break;
    case '6M':
      start = new Date(now);
      start.setMonth(start.getMonth() - 6);
      break;
    case '1Y':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      break;
    case 'YTD':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'ALL':
    default:
      if (inceptionDate) {
        return inceptionDate;
      }
      start = new Date('2026-02-10');
      break;
  }

  return start.toISOString().split('T')[0];
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
