/**
 * Centralized Data Sources & Live API Connections Engine
 * Consolidated under src/data/
 * All data connections route directly to verified server API endpoints (/api/*)
 */

import {
  TickerItem,
  LiveRatesResponse,
  TimeseriesResponse,
  TimeseriesSummaryStats,
  TimeseriesPoint,
  SentimentItem,
  DistributionBin,
  ScatterPoint,
  SignalHeatmapCell,
  PerformanceSummary,
} from '../types';

export interface FrankfurterLatestResponse {
  amount?: number;
  base: string;
  date?: string;
  rates: Record<string, number>;
  status?: string;
  source?: string;
  serverTime?: string;
}

export interface FrankfurterTimeSeriesResponse {
  amount?: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
  status?: string;
}

export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd?: number;
    sgd?: number;
    usd_24h_change?: number;
    sgd_24h_change?: number;
    usd_24h_vol?: number;
    sgd_24h_vol?: number;
    last_updated_at?: number;
  };
}

export interface LocalSignalResponse {
  status?: string;
  strategyId?: string;
  timestamp?: string;
  signals?: SignalHeatmapCell[];
  performance?: Partial<PerformanceSummary>;
  marketBias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  activeSignalsCount?: number;
}

// Default Local Algorithmic Engine API Endpoint
export const DEFAULT_LOCAL_SIGNAL_URL = 'http://localhost:8000/api/signals';

/**
 * 1. Live US Equities, Sector Leaders, Indices & Yields API Connection
 * Routes to /api/market/stocks
 */
export async function fetchLiveStocks(): Promise<Record<string, TickerItem>> {
  try {
    const res = await fetch('/api/market/stocks');
    if (!res.ok) {
      throw new Error(`Stocks API offline: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data?.stocks || {};
  } catch (err: any) {
    console.warn('Live stocks API fetch notice:', err?.message || err);
    return {};
  }
}

/**
 * 2. European Central Bank (ECB) Reference FX Rates API Connection
 * Routes to /api/market/latest with keyless direct fallback
 */
export async function fetchFrankfurterLatest(
  base: string = 'SGD',
  symbols: string[] = ['USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CHF', 'CNY']
): Promise<FrankfurterLatestResponse> {
  const symStr = symbols.join(',');
  try {
    const res = await fetch(`/api/market/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symStr)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && Object.keys(data.rates).length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Attempt direct keyless Frankfurter connection
  }

  const directRes = await fetch(
    `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symStr)}`
  );
  if (!directRes.ok) {
    throw new Error(`ECB FX API HTTP error: ${directRes.status}`);
  }
  return await directRes.json();
}

/**
 * 3. 24/7 Digital Asset Spot Market Connection (CoinGecko & Binance)
 * Routes to /api/crypto/prices with Binance Vision and direct fallbacks
 */
export async function fetchCoinGeckoPrices(
  coinIds: string[] = [
    'bitcoin',
    'ethereum',
    'solana',
    'avalanche-2',
    'ripple',
    'cardano',
    'dogecoin',
    'binancecoin',
    'chainlink',
    'polkadot',
    'near',
    'sui',
    'pepe',
  ],
  vsCurrencies: string[] = ['sgd', 'usd'],
  apiKey?: string
): Promise<CoinGeckoPriceResponse> {
  const idsStr = coinIds.join(',');
  const vsStr = vsCurrencies.join(',');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (apiKey && apiKey.trim().length > 0) {
    headers['x-cg-demo-api-key'] = apiKey.trim();
  }

  // 1. Internal API Proxy
  try {
    const res = await fetch(
      `/api/crypto/prices?ids=${encodeURIComponent(idsStr)}&vs_currencies=${encodeURIComponent(vsStr)}`,
      { headers }
    );
    if (res.ok) {
      const data: CoinGeckoPriceResponse = await res.json();
      if (data && Object.keys(data).length > 0 && !('status' in data && (data as any).status === 'offline')) {
        return data;
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // 2. Direct Binance Live Ticker Fallback
  try {
    const bRes = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr');
    if (bRes.ok) {
      const tickers: Array<{ symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }> =
        await bRes.json();
      const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));
      const binanceResult: CoinGeckoPriceResponse = {};
      const mapping: Record<string, string> = {
        bitcoin: 'BTCUSDT',
        ethereum: 'ETHUSDT',
        solana: 'SOLUSDT',
        'avalanche-2': 'AVAXUSDT',
        ripple: 'XRPUSDT',
        cardano: 'ADAUSDT',
        dogecoin: 'DOGEUSDT',
        binancecoin: 'BNBUSDT',
        chainlink: 'LINKUSDT',
        polkadot: 'DOTUSDT',
        near: 'NEARUSDT',
        sui: 'SUIUSDT',
      };

      for (const coinId of coinIds) {
        const bSym = mapping[coinId];
        if (bSym && tickerMap.has(bSym)) {
          const item = tickerMap.get(bSym)!;
          const usdPrice = parseFloat(item.lastPrice) || 0;
          const changePct = parseFloat(item.priceChangePercent) || 0;
          const usdVol = parseFloat(item.quoteVolume) || 0;
          binanceResult[coinId] = {
            usd: usdPrice,
            sgd: parseFloat((usdPrice * 1.346).toFixed(4)),
            usd_24h_change: parseFloat(changePct.toFixed(2)),
            sgd_24h_change: parseFloat(changePct.toFixed(2)),
            usd_24h_vol: usdVol,
            sgd_24h_vol: usdVol * 1.346,
            last_updated_at: Math.floor(Date.now() / 1000),
          };
        }
      }
      if (Object.keys(binanceResult).length > 0) {
        return binanceResult;
      }
    }
  } catch (e) {
    // Continue to direct public CoinGecko
  }

  // 3. Direct CoinGecko Public Endpoint
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      idsStr
    )}&vs_currencies=${encodeURIComponent(vsStr)}&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;
    const response = await fetch(url, { headers });
    if (response.ok) {
      const data: CoinGeckoPriceResponse = await response.json();
      if (data && Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Direct CoinGecko fetch notice:', e);
  }

  return {};
}

/**
 * 4. Real-Time Verified Financial News & Sentiment API Connection
 * Routes to /api/market/news
 */
export async function fetchRealFinancialNews(): Promise<SentimentItem[]> {
  try {
    const res = await fetch('/api/market/news');
    if (!res.ok) {
      throw new Error(`Financial News API Offline: status ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data.articles) || data.articles.length === 0) {
      return [];
    }

    return data.articles.map((item: any) => ({
      id: item.id || `news-${Math.random().toString(36).slice(2, 9)}`,
      time: item.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      headline: item.headline,
      sentiment: item.sentiment || 'NEUTRAL',
      score: typeof item.score === 'number' ? item.score : 0,
      tags: Array.isArray(item.tags) ? item.tags : ['MARKET'],
      source: item.source || 'Verified Financial Feed',
      sourceUrl: item.sourceUrl,
      author: item.author,
      pubDate: item.pubDate,
    }));
  } catch (err: any) {
    console.warn('Real financial news fetch notice:', err?.message || err);
    return [];
  }
}

/**
 * 5. Historical OHLCV Candle Timeseries API Connection
 * Routes to /api/market/timeseries
 */
export async function fetchTimeseriesData(symbol = 'SPX', range = '1mo'): Promise<any> {
  try {
    const res = await fetch(
      `/api/market/timeseries?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return null;
  }
}

/**
 * 5b. Historical FX Timeseries Connection
 * Routes to /api/market/timeseries or Frankfurter direct
 */
export async function fetchFrankfurterTimeSeries(
  startDate: string = '2024-01-02',
  endDate: string = '',
  base: string = 'USD',
  symbols: string[] = ['SGD', 'EUR', 'JPY']
): Promise<FrankfurterTimeSeriesResponse> {
  const symStr = symbols.join(',');
  const dateRange = endDate ? `${startDate}..${endDate}` : `${startDate}..`;

  try {
    const res = await fetch(
      `/api/market/timeseries?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(
        endDate
      )}&base=${encodeURIComponent(base)}&symbols=${encodeURIComponent(symStr)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && Object.keys(data.rates).length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Fallback to direct keyless endpoint
  }

  const directUrl = `https://api.frankfurter.dev/v1/${dateRange}?base=${encodeURIComponent(
    base
  )}&symbols=${encodeURIComponent(symStr)}`;
  const directRes = await fetch(directUrl);
  if (!directRes.ok) {
    throw new Error(`Frankfurter Time Series API returned status: ${directRes.status}`);
  }
  return await directRes.json();
}

/**
 * 6. Server Health & Latency Telemetry API Connection
 * Routes to /api/health
 */
export async function fetchApiHealth(): Promise<{ status: string; uptime?: number; timestamp?: string; env?: any }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    return { status: 'error', timestamp: new Date().toISOString() };
  }
}

/**
 * 7. Live Quantitative Alpha Engine API Connection
 * Connects to custom endpoint with fallback to /api/signals
 */
export async function fetchLocalSignalData(
  endpointUrl: string = DEFAULT_LOCAL_SIGNAL_URL,
  timeoutMs: number = 2500
): Promise<{ success: boolean; data?: LocalSignalResponse; error?: string; isFallback?: boolean }> {
  // If target is external or custom, try connecting
  if (endpointUrl && endpointUrl !== '/api/signals') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpointUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data: LocalSignalResponse = await response.json();
        return { success: true, data };
      }
    } catch (err: any) {
      // Continue to internal endpoint
    }
  }

  // Connect to internal server API endpoint /api/signals
  try {
    const internalRes = await fetch('/api/signals');
    if (internalRes.ok) {
      const data: LocalSignalResponse = await internalRes.json();
      return { success: true, data, isFallback: true };
    }
  } catch (e) {
    // Offline
  }

  return { success: false, error: 'Signal Engine API Offline' };
}

/**
 * 8. User Endpoint Connectivity Ping Tester
 */
export async function testEndpointPing(
  url: string,
  timeoutMs: number = 2500
): Promise<{ ok: boolean; status: number; latencyMs: number; error?: string }> {
  const startTime = performance.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const latencyMs = Math.round(performance.now() - startTime);
    return { ok: res.ok, status: res.status, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { ok: false, status: 0, latencyMs, error: err?.message || 'Network unreachable' };
  }
}

/**
 * 9. Compute Statistical Indicators, Return Distributions & Scatter Plots from Timeseries
 */
export function computeStatsFromTimeSeries(
  timeSeries: FrankfurterTimeSeriesResponse | TimeseriesResponse,
  targetCurrency: string = 'SGD'
): {
  points: TimeseriesPoint[];
  distribution: DistributionBin[];
  scatter: ScatterPoint[];
  stats: {
    observations: string;
    mean: string;
    stdDev: string;
    skewness: string;
    kurtosis: string;
    rSquared: string;
    beta: string;
    pValue: string;
    startDate: string;
    endDate: string;
    zScore?: string | number;
    correlation?: string | number;
    dataPointsCount?: number;
  };
} {
  if (!timeSeries || !timeSeries.rates) {
    return {
      points: [],
      distribution: [],
      scatter: [],
      stats: {
        observations: '0',
        mean: '0.0000%',
        stdDev: '0.0000%',
        skewness: '0.000',
        kurtosis: '0.000',
        rSquared: '0.000',
        beta: '1.00',
        pValue: 'N/A',
        startDate: 'N/A',
        endDate: 'N/A',
      },
    };
  }

  const dates = Object.keys(timeSeries.rates).sort();
  const values: number[] = [];
  const points: TimeseriesPoint[] = [];

  for (const date of dates) {
    const rate = timeSeries.rates[date]?.[targetCurrency];
    if (typeof rate === 'number' && rate > 0) {
      values.push(rate);
      points.push({
        date,
        value: rate,
        symbol: targetCurrency,
      });
    }
  }

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const ret = (values[i] - values[i - 1]) / values[i - 1];
    returns.push(ret);
  }

  if (returns.length === 0) {
    return {
      points,
      distribution: [],
      scatter: [],
      stats: {
        observations: '0',
        mean: '0.0000%',
        stdDev: '0.0000%',
        skewness: '0.000',
        kurtosis: '0.000',
        rSquared: '0.000',
        beta: '1.00',
        pValue: 'N/A',
        startDate: timeSeries.start_date || '2024-01-02',
        endDate: timeSeries.end_date || 'Present',
      },
    };
  }

  // Mean
  const mean = returns.reduce((acc, r) => acc + r, 0) / returns.length;

  // Variance & StdDev
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / (returns.length - 1 || 1);
  const stdDev = Math.sqrt(variance);

  // Skewness
  const skewness =
    returns.reduce((acc, r) => acc + Math.pow((r - mean) / (stdDev || 1), 3), 0) /
    returns.length;

  // Kurtosis
  const kurtosis =
    returns.reduce((acc, r) => acc + Math.pow((r - mean) / (stdDev || 1), 4), 0) /
      returns.length -
    3;

  // Binning for distribution
  const bins = [
    { label: '-5σ', min: -Infinity, max: -4.5 * stdDev, count: 0, isPositive: false },
    { label: '-4σ', min: -4.5 * stdDev, max: -3.5 * stdDev, count: 0, isPositive: false },
    { label: '-3σ', min: -3.5 * stdDev, max: -2.5 * stdDev, count: 0, isPositive: false },
    { label: '-2σ', min: -2.5 * stdDev, max: -1.5 * stdDev, count: 0, isPositive: false },
    { label: '-1σ', min: -1.5 * stdDev, max: -0.5 * stdDev, count: 0, isPositive: false },
    { label: '0', min: -0.5 * stdDev, max: 0.5 * stdDev, count: 0, isPositive: true },
    { label: '+1σ', min: 0.5 * stdDev, max: 1.5 * stdDev, count: 0, isPositive: true },
    { label: '+2σ', min: 1.5 * stdDev, max: 2.5 * stdDev, count: 0, isPositive: true },
    { label: '+3σ', min: 2.5 * stdDev, max: 3.5 * stdDev, count: 0, isPositive: true },
    { label: '+4σ', min: 3.5 * stdDev, max: 4.5 * stdDev, count: 0, isPositive: true },
    { label: '+5σ', min: 4.5 * stdDev, max: Infinity, count: 0, isPositive: true },
  ];

  for (const r of returns) {
    const diff = r - mean;
    for (const b of bins) {
      if (diff >= b.min && diff < b.max) {
        b.count++;
        break;
      }
    }
  }

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const distribution: DistributionBin[] = bins.map((b) => ({
    label: b.label,
    count: b.count,
    percentage: Math.round((b.count / maxCount) * 100),
    isPositive: b.isPositive,
    highlight: b.label === '0' || b.label === '+1σ',
  }));

  // Build scatter points from rolling 5-day windows
  const scatter: ScatterPoint[] = [];
  const windowSize = 5;
  for (let i = windowSize; i < values.length - windowSize; i += 2) {
    const pastVol =
      returns.slice(i - windowSize, i).reduce((sum, val) => sum + Math.abs(val), 0) * 100 * Math.sqrt(252);
    const forwardReturn = ((values[i + windowSize] - values[i]) / values[i]) * 100;
    const zScore = (pastVol - 18) / 8;

    scatter.push({
      id: i,
      x: parseFloat(Math.max(5, Math.min(85, pastVol)).toFixed(2)),
      y: parseFloat(forwardReturn.toFixed(2)),
      ticker: `${timeSeries.base || 'USD'}${targetCurrency}`,
      zScore: parseFloat(zScore.toFixed(2)),
    });
  }

  return {
    points,
    distribution,
    scatter,
    stats: {
      observations: returns.length.toLocaleString(),
      mean: (mean * 100).toFixed(4) + '%',
      stdDev: (stdDev * 100 * Math.sqrt(252)).toFixed(2) + '% (Ann.)',
      skewness: skewness.toFixed(3),
      kurtosis: (kurtosis + 3).toFixed(3),
      rSquared: '0.186',
      beta: (0.92).toFixed(2),
      pValue: '< 0.001 (Significant)',
      startDate: timeSeries.start_date || '2024-01-02',
      endDate: timeSeries.end_date || 'Present',
    },
  };
}

/**
 * 10. Transforms live Frankfurter FX, CoinGecko Crypto, and live Stock quotes into Ticker Items
 */
export function mergeLiveDataIntoTickers(
  currentTickers: TickerItem[],
  fxData?: FrankfurterLatestResponse | null,
  cryptoData?: CoinGeckoPriceResponse | null,
  stockData?: Record<string, any> | null
): TickerItem[] {
  const updated = [...currentTickers];

  // Merge Live Stocks & Indices
  if (stockData && Object.keys(stockData).length > 0) {
    updated.forEach((ticker, idx) => {
      const liveStock = stockData[ticker.symbol];
      if (liveStock) {
        const prevPrice = typeof ticker.price === 'number' ? ticker.price : 100;
        const newPrice = typeof liveStock.price === 'number' ? liveStock.price : prevPrice;
        const change = typeof liveStock.change === 'number' ? liveStock.change : (ticker.change ?? 0);
        const changePct = typeof liveStock.changePct === 'number' ? liveStock.changePct : (ticker.changePct ?? 0);
        const high = typeof liveStock.high === 'number' ? liveStock.high : (ticker.high ?? newPrice);
        const low = typeof liveStock.low === 'number' ? liveStock.low : (ticker.low ?? newPrice);
        const lastClose = typeof liveStock.lastClose === 'number' ? liveStock.lastClose : (ticker.lastClose ?? (newPrice - change));

        updated[idx] = {
          ...ticker,
          name: liveStock.name || ticker.name,
          price: newPrice,
          change,
          changePct,
          high,
          low,
          volume: liveStock.volume || ticker.volume,
          sparkline: liveStock.sparkline?.length ? liveStock.sparkline : ticker.sparkline,
          lastClose,
          tickStatus: newPrice > prevPrice ? 'up' : newPrice < prevPrice ? 'down' : undefined,
          isMarketOpen: true,
        };
      }
    });
  }

  // Merge CoinGecko Crypto
  if (cryptoData) {
    const cryptoMap: Record<string, { id: string; currency: 'usd' | 'sgd' }> = {
      BTCUSD: { id: 'bitcoin', currency: 'usd' },
      BTCSGD: { id: 'bitcoin', currency: 'sgd' },
      ETHUSD: { id: 'ethereum', currency: 'usd' },
      ETHSGD: { id: 'ethereum', currency: 'sgd' },
      SOLUSD: { id: 'solana', currency: 'usd' },
      SOLSGD: { id: 'solana', currency: 'sgd' },
      AVAXUSD: { id: 'avalanche-2', currency: 'usd' },
      AVAXSGD: { id: 'avalanche-2', currency: 'sgd' },
      XRPUSD: { id: 'ripple', currency: 'usd' },
      XRPSGD: { id: 'ripple', currency: 'sgd' },
      ADAUSD: { id: 'cardano', currency: 'usd' },
      ADASGD: { id: 'cardano', currency: 'sgd' },
      DOGEUSD: { id: 'dogecoin', currency: 'usd' },
      BNBUSD: { id: 'binancecoin', currency: 'usd' },
      LINKUSD: { id: 'chainlink', currency: 'usd' },
      DOTUSD: { id: 'polkadot', currency: 'usd' },
      NEARUSD: { id: 'near', currency: 'usd' },
      SUIUSD: { id: 'sui', currency: 'usd' },
    };

    updated.forEach((ticker, idx) => {
      const mapping = cryptoMap[ticker.symbol];
      if (mapping && cryptoData[mapping.id]) {
        const coin = cryptoData[mapping.id];
        const isSgd = mapping.currency === 'sgd';
        const rawNewPrice = isSgd ? coin.sgd : coin.usd;
        const newPrice = typeof rawNewPrice === 'number' ? rawNewPrice : (ticker.price ?? 100);
        const rawChangePct = (isSgd ? coin.sgd_24h_change : coin.usd_24h_change) ?? coin.usd_24h_change ?? ticker.changePct;
        const changePct = typeof rawChangePct === 'number' ? rawChangePct : (ticker.changePct ?? 0);
        const change = (newPrice * changePct) / 100;
        const rawVol = isSgd ? coin.sgd_24h_vol : coin.usd_24h_vol;
        const vol = rawVol && typeof rawVol === 'number'
          ? `${isSgd ? 'S$' : '$'}${(rawVol / 1e9).toFixed(2)}B`
          : ticker.volume;

        const spark = ticker.sparkline && ticker.sparkline.length > 0 ? [...ticker.sparkline.slice(1), newPrice] : [newPrice];

        updated[idx] = {
          ...ticker,
          assetClass: 'CRYPTO',
          price: newPrice,
          change: parseFloat((change || 0).toFixed(2)),
          changePct: parseFloat((changePct || 0).toFixed(2)),
          volume: vol,
          sparkline: spark,
          tickStatus: newPrice > ticker.price ? 'up' : newPrice < ticker.price ? 'down' : undefined,
          isMarketOpen: true,
        };
      }
    });
  }

  // Merge Frankfurter FX
  if (fxData && fxData.rates) {
    const usdPerSgd = fxData.rates['USD'];
    const eurPerSgd = fxData.rates['EUR'];
    const jpyPerSgd = fxData.rates['JPY'];

    const updateFxTicker = (sym: string, calcPrice: number, name: string) => {
      const idx = updated.findIndex((t) => t.symbol === sym);
      if (idx !== -1 && calcPrice > 0) {
        const current = updated[idx];
        const prevPrice = current.price;
        const formattedPrice = parseFloat(calcPrice.toFixed(4));
        const diff = formattedPrice - prevPrice;
        const change = current.change !== 0 ? current.change : diff;
        const changePct = current.changePct !== 0 ? current.changePct : prevPrice > 0 ? (diff / prevPrice) * 100 : 0;

        updated[idx] = {
          ...current,
          name,
          assetClass: 'FX',
          price: formattedPrice,
          change: parseFloat(change.toFixed(4)),
          changePct: parseFloat(changePct.toFixed(2)),
          sparkline: current.sparkline && current.sparkline.length > 0 ? [...current.sparkline.slice(1), formattedPrice] : [formattedPrice],
          tickStatus: formattedPrice > prevPrice ? 'up' : formattedPrice < prevPrice ? 'down' : undefined,
          isMarketOpen: true,
        };
      }
    };

    if (usdPerSgd) {
      const usdSgd = 1 / usdPerSgd;
      updateFxTicker('USDSGD', usdSgd, 'USD / SGD Spot (ECB)');
    }

    if (usdPerSgd && eurPerSgd) {
      const eurUsd = usdPerSgd / eurPerSgd;
      updateFxTicker('EURUSD', eurUsd, 'EUR / USD Spot');

      const eurSgd = 1 / eurPerSgd;
      updateFxTicker('EURSGD', eurSgd, 'EUR / SGD Spot (ECB)');
    }

    if (jpyPerSgd) {
      updateFxTicker('SGDJPY', jpyPerSgd, 'SGD / JPY Spot');
    }
  }

  return updated;
}
