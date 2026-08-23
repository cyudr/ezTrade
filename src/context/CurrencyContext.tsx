import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { fetchFrankfurterLatest } from '../services/apiService';

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

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  activeCurrencyOption: CurrencyOption;
  rates: Record<string, number>;
  formatMoney: (
    amountInUSD: number,
    options?: { showCode?: boolean; decimals?: number; compact?: boolean }
  ) => string;
  convertFromUSD: (amountInUSD: number, targetCurrency?: string) => number;
  convertToUSD: (amountInTargetCurrency: number, sourceCurrency?: string) => number;
  currencySymbol: string;
  isRatesLoading: boolean;
  refreshRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Initial live benchmark ECB rates relative to USD (1 USD = X Currency)
const DEFAULT_RATES_FROM_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 0.9075,
  SGD: 1.3185,
  GBP: 0.7682,
  JPY: 146.85,
  CAD: 1.352,
  AUD: 1.485,
  CHF: 0.852,
  HKD: 7.795,
  CNY: 7.125,
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('quant_terminal_currency');
      if (saved && CURRENCY_OPTIONS.some((c) => c.code === saved)) {
        return saved;
      }
      return 'USD'; // Default to USD as required
    } catch {
      return 'USD';
    }
  });

  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES_FROM_USD);
  const [isRatesLoading, setIsRatesLoading] = useState(false);

  const setCurrency = (code: string) => {
    if (CURRENCY_OPTIONS.some((c) => c.code === code)) {
      setCurrencyState(code);
      try {
        localStorage.setItem('quant_terminal_currency', code);
      } catch (e) {
        console.warn('Could not persist currency to localStorage:', e);
      }
    }
  };

  const activeCurrencyOption = useMemo(() => {
    return CURRENCY_OPTIONS.find((c) => c.code === currency) || CURRENCY_OPTIONS[0];
  }, [currency]);

  // Fetch live rates relative to USD from Frankfurter / ECB
  const refreshRates = async () => {
    setIsRatesLoading(true);
    try {
      const fxData = await fetchFrankfurterLatest('USD', [
        'EUR',
        'SGD',
        'JPY',
        'GBP',
        'AUD',
        'CHF',
        'CAD',
        'CNY',
        'HKD',
      ]);
      if (fxData && fxData.rates) {
        setRates({
          USD: 1.0,
          ...fxData.rates,
        });
      }
    } catch (err) {
      console.warn('Live FX rates fetch error, using live fallback ECB rates:', err);
    } finally {
      setIsRatesLoading(false);
    }
  };

  useEffect(() => {
    refreshRates();
    const interval = setInterval(refreshRates, 60000); // 1-minute live refresh
    return () => clearInterval(interval);
  }, []);

  const convertFromUSD = (amountInUSD: number, targetCurrency?: string): number => {
    if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return 0;
    const target = targetCurrency || currency;
    if (target === 'USD') return amountInUSD;
    const rate = rates[target] || DEFAULT_RATES_FROM_USD[target] || 1.0;
    return amountInUSD * rate;
  };

  const convertToUSD = (amountInTargetCurrency: number, sourceCurrency?: string): number => {
    if (typeof amountInTargetCurrency !== 'number' || isNaN(amountInTargetCurrency)) return 0;
    const src = sourceCurrency || currency;
    if (src === 'USD') return amountInTargetCurrency;
    const rate = rates[src] || DEFAULT_RATES_FROM_USD[src] || 1.0;
    return rate !== 0 ? amountInTargetCurrency / rate : amountInTargetCurrency;
  };

  const formatMoney = (
    amountInUSD: number,
    options?: { showCode?: boolean; decimals?: number; compact?: boolean }
  ): string => {
    if (typeof amountInUSD !== 'number' || isNaN(amountInUSD)) return '--';

    const converted = convertFromUSD(amountInUSD);
    const sym = activeCurrencyOption.symbol;
    const code = activeCurrencyOption.code;

    if (options?.compact) {
      const absVal = Math.abs(converted);
      let formattedNumber = '';
      if (absVal >= 1e9) {
        formattedNumber = (converted / 1e9).toFixed(options.decimals ?? 2) + 'B';
      } else if (absVal >= 1e6) {
        formattedNumber = (converted / 1e6).toFixed(options.decimals ?? 2) + 'M';
      } else if (absVal >= 1e3) {
        formattedNumber = (converted / 1e3).toFixed(options.decimals ?? 1) + 'K';
      } else {
        formattedNumber = converted.toFixed(options.decimals ?? 2);
      }
      return `${sym}${formattedNumber}${options?.showCode ? ' ' + code : ''}`;
    }

    const defaultDecimals = converted > 1000 ? 2 : converted < 1 ? 4 : 2;
    const dec = options?.decimals !== undefined ? options.decimals : defaultDecimals;

    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    });

    return `${sym}${formatted}${options?.showCode ? ' ' + code : ''}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        activeCurrencyOption,
        rates,
        formatMoney,
        convertFromUSD,
        convertToUSD,
        currencySymbol: activeCurrencyOption.symbol,
        isRatesLoading,
        refreshRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
