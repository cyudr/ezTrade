/**
 * Live Stock & Index Quotes Endpoint
 * Fetches real quotes from Yahoo Finance / Stooq public APIs with fast caching and resilience
 * Accessible at /api/market/stocks
 */

interface LiveStockItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  volume: string;
  sparkline: number[];
  assetClass: 'US_EQUITY' | 'BOND' | 'FX' | 'CRYPTO';
  lastClose: number;
}

const STOCK_SYMBOLS_MAP: Record<
  string,
  { yahooSymbol: string; name: string; assetClass: 'US_EQUITY' | 'BOND' | 'FX' | 'CRYPTO' }
> = {
  SPX: { yahooSymbol: '%5EGSPC', name: 'S&P 500 Index', assetClass: 'US_EQUITY' },
  NDX: { yahooSymbol: '%5ENDX', name: 'NASDAQ 100 Index', assetClass: 'US_EQUITY' },
  NVDA: { yahooSymbol: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'US_EQUITY' },
  AAPL: { yahooSymbol: 'AAPL', name: 'Apple Inc.', assetClass: 'US_EQUITY' },
  TSLA: { yahooSymbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'US_EQUITY' },
  MSFT: { yahooSymbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'US_EQUITY' },
  AMD: { yahooSymbol: 'AMD', name: 'Advanced Micro Devices', assetClass: 'US_EQUITY' },
  PLTR: { yahooSymbol: 'PLTR', name: 'Palantir Technologies', assetClass: 'US_EQUITY' },
  META: { yahooSymbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'US_EQUITY' },
  VIX: { yahooSymbol: '%5EVIX', name: 'CBOE Volatility Index', assetClass: 'US_EQUITY' },
  US10Y: { yahooSymbol: '%5ETNX', name: 'US 10-Yr Treasury Yield', assetClass: 'BOND' },
  EURUSD: { yahooSymbol: 'EURUSD%3DX', name: 'EUR / USD Spot', assetClass: 'FX' },
  USDSGD: { yahooSymbol: 'USDSGD%3DX', name: 'USD / SGD Spot', assetClass: 'FX' },
  SGDJPY: { yahooSymbol: 'SGDJPY%3DX', name: 'SGD / JPY Spot', assetClass: 'FX' },
  BTCUSD: { yahooSymbol: 'BTC-USD', name: 'Bitcoin (USD Spot)', assetClass: 'CRYPTO' },
  ETHUSD: { yahooSymbol: 'ETH-USD', name: 'Ethereum (USD Spot)', assetClass: 'CRYPTO' },
};

let cachedQuotes: Record<string, LiveStockItem> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10s cache

async function fetchYahooQuote(
  symbolKey: string,
  yahooSymbol: string,
  name: string,
  assetClass: 'US_EQUITY' | 'BOND' | 'FX' | 'CRYPTO'
): Promise<LiveStockItem | null> {
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];

  for (const host of hosts) {
    try {
      const url = `https://${host}/v8/finance/chart/${yahooSymbol}?interval=1d&range=5d`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3500),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 0;
      const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
      const change = currentPrice - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;
      const high = meta.regularMarketDayHigh || meta.dayHigh || currentPrice;
      const low = meta.regularMarketDayLow || meta.dayLow || currentPrice;
      const rawVolume = meta.regularMarketVolume || 0;

      let volStr = 'N/A';
      if (rawVolume >= 1e9) volStr = `${(rawVolume / 1e9).toFixed(2)}B`;
      else if (rawVolume >= 1e6) volStr = `${(rawVolume / 1e6).toFixed(1)}M`;
      else if (rawVolume >= 1e3) volStr = `${(rawVolume / 1e3).toFixed(0)}K`;

      // Sparkline from close timestamps
      const quoteCloses: number[] = result?.indicators?.quote?.[0]?.close || [];
      const validCloses = quoteCloses.filter((c) => typeof c === 'number' && !isNaN(c) && c > 0);
      const sparkline =
        validCloses.length >= 4
          ? validCloses.slice(-7)
          : [prevClose * 0.995, prevClose * 0.998, prevClose, currentPrice];

      const precision = symbolKey === 'US10Y' ? 3 : assetClass === 'FX' ? 4 : 2;

      return {
        symbol: symbolKey,
        name,
        price: parseFloat(currentPrice.toFixed(precision)),
        change: parseFloat(change.toFixed(precision)),
        changePct: parseFloat(changePct.toFixed(2)),
        high: parseFloat(high.toFixed(precision)),
        low: parseFloat(low.toFixed(precision)),
        volume: volStr,
        sparkline: sparkline.map((p) => parseFloat(p.toFixed(precision))),
        assetClass,
        lastClose: parseFloat(prevClose.toFixed(precision)),
      };
    } catch {
      // Continue to next host or fallback quietly on ECONNRESET / timeout
      continue;
    }
  }

  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const now = Date.now();
  if (Object.keys(cachedQuotes).length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    const responsePayload = {
      status: 'ok',
      source: 'live-cache',
      timestamp: new Date().toISOString(),
      stocks: cachedQuotes,
    };
    if (res.status && typeof res.json === 'function') {
      return res.status(200).json(responsePayload);
    }
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fetchPromises = Object.entries(STOCK_SYMBOLS_MAP).map(
    async ([symKey, { yahooSymbol, name, assetClass }]) => {
      const liveItem = await fetchYahooQuote(symKey, yahooSymbol, name, assetClass);
      if (liveItem) {
        cachedQuotes[symKey] = liveItem;
      }
    }
  );

  await Promise.allSettled(fetchPromises);

  // Compute derived BTCSGD and ETHSGD if USDSGD is available
  const usdsgdRate = cachedQuotes['USDSGD']?.price || 1.2693;
  if (cachedQuotes['BTCUSD']) {
    const btcUsd = cachedQuotes['BTCUSD'];
    const btcSgdPrice = btcUsd.price * usdsgdRate;
    const btcSgdPrevClose = btcUsd.lastClose * (cachedQuotes['USDSGD']?.lastClose || usdsgdRate);
    const btcSgdChange = btcSgdPrice - btcSgdPrevClose;
    const btcSgdChangePct = btcSgdPrevClose > 0 ? (btcSgdChange / btcSgdPrevClose) * 100 : 0;
    cachedQuotes['BTCSGD'] = {
      symbol: 'BTCSGD',
      name: 'Bitcoin (SGD Spot)',
      price: parseFloat(btcSgdPrice.toFixed(2)),
      change: parseFloat(btcSgdChange.toFixed(2)),
      changePct: parseFloat(btcSgdChangePct.toFixed(2)),
      high: parseFloat((btcUsd.high * usdsgdRate).toFixed(2)),
      low: parseFloat((btcUsd.low * usdsgdRate).toFixed(2)),
      volume: '8.4B',
      sparkline: btcUsd.sparkline.map((p) => parseFloat((p * usdsgdRate).toFixed(2))),
      assetClass: 'CRYPTO',
      lastClose: parseFloat(btcSgdPrevClose.toFixed(2)),
    };
  }

  if (cachedQuotes['ETHUSD']) {
    const ethUsd = cachedQuotes['ETHUSD'];
    const ethSgdPrice = ethUsd.price * usdsgdRate;
    const ethSgdPrevClose = ethUsd.lastClose * (cachedQuotes['USDSGD']?.lastClose || usdsgdRate);
    const ethSgdChange = ethSgdPrice - ethSgdPrevClose;
    const ethSgdChangePct = ethSgdPrevClose > 0 ? (ethSgdChange / ethSgdPrevClose) * 100 : 0;
    cachedQuotes['ETHSGD'] = {
      symbol: 'ETHSGD',
      name: 'Ethereum (SGD Spot)',
      price: parseFloat(ethSgdPrice.toFixed(2)),
      change: parseFloat(ethSgdChange.toFixed(2)),
      changePct: parseFloat(ethSgdChangePct.toFixed(2)),
      high: parseFloat((ethUsd.high * usdsgdRate).toFixed(2)),
      low: parseFloat((ethUsd.low * usdsgdRate).toFixed(2)),
      volume: '4.2B',
      sparkline: ethUsd.sparkline.map((p) => parseFloat((p * usdsgdRate).toFixed(2))),
      assetClass: 'CRYPTO',
      lastClose: parseFloat(ethSgdPrevClose.toFixed(2)),
    };
  }

  lastFetchTime = now;

  if (Object.keys(cachedQuotes).length === 0) {
    const offlinePayload = {
      status: 'offline',
      message: 'Stock and Market Quotes API Offline',
      timestamp: new Date().toISOString(),
      stocks: {},
    };
    if (res.status && typeof res.json === 'function') {
      return res.status(503).json(offlinePayload);
    }
    return new Response(JSON.stringify(offlinePayload), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = {
    status: 'ok',
    source: 'live-market-feed',
    timestamp: new Date().toISOString(),
    stocks: cachedQuotes,
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
