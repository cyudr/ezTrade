/**
 * Dynamic Raw Currency Data, ECB Live Connections, & Formatting Engine
 * Consolidated under src/data/
 */

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';

/**
 * Live FX Rates from European Central Bank (ECB) via /api/market/latest
 */
export async function fetchLiveExchangeRates(
  base: string = 'USD',
  symbols: string[] = ['EUR', 'SGD', 'JPY', 'GBP', 'AUD', 'CHF', 'CAD', 'CNY', 'HKD']
): Promise<{ base: string; date: string; rates: Record<string, number> }> {
  const symStr = symbols.join(',');
  const res = await fetch(`/api/market/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symStr)}`);
  if (!res.ok) {
    throw new Error(`ECB FX API Offline: status ${res.status}`);
  }
  const data = await res.json();
  if (data.status === 'offline' || !data.rates || Object.keys(data.rates).length === 0) {
    throw new Error('ECB FX Rates endpoint returned offline status');
  }
  return {
    base: data.base || base,
    date: data.date || new Date().toISOString().slice(0, 10),
    rates: {
      [base]: 1.0,
      ...data.rates,
    },
  };
}

/**
 * Currency Conversion Engine
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return amount;

  // Assume rates are pegged to USD (1 USD = X Currency)
  const fromRate = rates[fromCurrency] || (fromCurrency === 'USD' ? 1.0 : undefined);
  const toRate = rates[toCurrency] || (toCurrency === 'USD' ? 1.0 : undefined);

  if (!fromRate || !toRate) {
    return amount;
  }

  // Convert from source to USD then to target
  const inUSD = fromCurrency === 'USD' ? amount : amount / fromRate;
  return toCurrency === 'USD' ? inUSD : inUSD * toRate;
}

/**
 * Dynamic Money Formatter
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = 'USD',
  options?: {
    symbol?: string;
    showCode?: boolean;
    decimals?: number;
    compact?: boolean;
  }
): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '--';

  const currencyObj = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
  const sym = options?.symbol ?? (currencyObj?.symbol || '$');
  const code = options?.showCode ? ` ${currencyCode}` : '';

  if (options?.compact) {
    const absVal = Math.abs(amount);
    let formattedNumber = '';
    if (absVal >= 1e9) {
      formattedNumber = (amount / 1e9).toFixed(options.decimals ?? 2) + 'B';
    } else if (absVal >= 1e6) {
      formattedNumber = (amount / 1e6).toFixed(options.decimals ?? 2) + 'M';
    } else if (absVal >= 1e3) {
      formattedNumber = (amount / 1e3).toFixed(options.decimals ?? 1) + 'K';
    } else {
      formattedNumber = amount.toFixed(options.decimals ?? 2);
    }
    return `${sym}${formattedNumber}${code}`;
  }

  const defaultDecimals = Math.abs(amount) > 1000 ? 2 : Math.abs(amount) < 1 && Math.abs(amount) > 0 ? 4 : 2;
  const dec = options?.decimals !== undefined ? options.decimals : defaultDecimals;

  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

  return `${sym}${formatted}${code}`;
}
