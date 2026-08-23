import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  CURRENCY_OPTIONS,
  CurrencyOption,
  fetchLiveExchangeRates,
  convertCurrency,
  formatCurrencyAmount,
  DEFAULT_CURRENCY_CODE,
} from '../data/currencies';

export type { CurrencyOption };
export { CURRENCY_OPTIONS };

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
      const data = await fetchLiveExchangeRates('USD', [
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
      if (data && data.rates) {
        setRates(data.rates);
      }
    } catch (err) {
      console.warn('Live FX rates fetch notice:', err);
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
    const target = targetCurrency || currency;
    return convertCurrency(amountInUSD, 'USD', target, rates);
  };

  const convertToUSD = (amountInTargetCurrency: number, sourceCurrency?: string): number => {
    const src = sourceCurrency || currency;
    return convertCurrency(amountInTargetCurrency, src, 'USD', rates);
  };

  const formatMoney = (
    amountInUSD: number,
    options?: { showCode?: boolean; decimals?: number; compact?: boolean }
  ): string => {
    const converted = convertFromUSD(amountInUSD);
    return formatCurrencyAmount(converted, currency, options);
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
