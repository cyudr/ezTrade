/**
 * Crypto Prices Aggregator Endpoint (Multi-provider with CoinGecko and Binance 24hr Live Feed)
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/crypto/prices
 */

const COINGECKO_TO_BINANCE: Record<string, string> = {
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
  pepe: 'PEPEUSDT',
};

export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-cg-demo-api-key');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const ids = (req.query?.ids || 'bitcoin,ethereum,solana,avalanche-2,ripple,cardano') as string;
  const vs = (req.query?.vs_currencies || 'sgd,usd') as string;
  const requestedIdList = ids.split(',').map((s) => s.trim().toLowerCase());
  const apiKey =
    (req.headers?.['x-cg-demo-api-key'] as string) ||
    process.env.COINGECKO_API_KEY ||
    '';

  const USDSGD_RATE = 1.346;

  // Strategy 1: CoinGecko Primary Live API
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey && apiKey.trim().length > 0) {
      headers['x-cg-demo-api-key'] = apiKey.trim();
    }

    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      ids
    )}&vs_currencies=${encodeURIComponent(
      vs
    )}&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`;

    const cgController = new AbortController();
    const cgTimeout = setTimeout(() => cgController.abort(), 2500);

    const apiRes = await fetch(cgUrl, { headers, signal: cgController.signal });
    clearTimeout(cgTimeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && Object.keys(data).length > 0) {
        if (res.status && typeof res.json === 'function') {
          return res.status(200).json(data);
        }
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (e: any) {
    // Proceed to live Binance 24hr ticker feed
  }

  // Strategy 2: Binance Live Ticker Feed
  try {
    const binanceController = new AbortController();
    const binanceTimeout = setTimeout(() => binanceController.abort(), 2500);

    const bRes = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr', {
      signal: binanceController.signal,
    });
    clearTimeout(binanceTimeout);

    if (bRes.ok) {
      const tickers: Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        quoteVolume: string;
      }> = await bRes.json();

      const tickerMap = new Map(tickers.map((t) => [t.symbol, t]));
      const binanceResult: Record<string, any> = {};

      for (const coinId of requestedIdList) {
        const binanceSymbol = COINGECKO_TO_BINANCE[coinId];
        if (binanceSymbol && tickerMap.has(binanceSymbol)) {
          const item = tickerMap.get(binanceSymbol)!;
          const usdPrice = parseFloat(item.lastPrice) || 0;
          const changePct = parseFloat(item.priceChangePercent) || 0;
          const usdVol = parseFloat(item.quoteVolume) || 0;

          binanceResult[coinId] = {
            usd: usdPrice,
            sgd: parseFloat((usdPrice * USDSGD_RATE).toFixed(4)),
            usd_24h_change: parseFloat(changePct.toFixed(2)),
            sgd_24h_change: parseFloat(changePct.toFixed(2)),
            usd_24h_vol: usdVol,
            sgd_24h_vol: usdVol * USDSGD_RATE,
            last_updated_at: Math.floor(Date.now() / 1000),
          };
        }
      }

      if (Object.keys(binanceResult).length > 0) {
        if (res.status && typeof res.json === 'function') {
          return res.status(200).json(binanceResult);
        }
        return new Response(JSON.stringify(binanceResult), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  } catch (e: any) {
    // Both CoinGecko & Binance live endpoints unreachable
  }

  // Strict API policy: Return 503 offline status when live crypto feeds are unreachable (No simulated/mock data)
  const offlinePayload = {
    status: 'offline',
    message: 'Live Crypto Price Feeds (CoinGecko / Binance) Offline',
    timestamp: new Date().toISOString(),
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(503).json(offlinePayload);
  }

  return new Response(JSON.stringify(offlinePayload), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
