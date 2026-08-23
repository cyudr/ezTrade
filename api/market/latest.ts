/**
 * Market Latest Rates Endpoint (ECB reference FX rates via Frankfurter)
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/market/latest
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const base = (req.query?.base || 'SGD') as string;
  const symbols = (req.query?.symbols || 'USD,EUR,JPY,GBP,AUD,CHF,CNY') as string;

  try {
    const url = `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(
      base
    )}&symbols=${encodeURIComponent(symbols)}`;

    const apiRes = await fetch(url);
    if (apiRes.ok) {
      const data = await apiRes.json();
      const payload = {
        status: 'ok',
        source: 'ecb-frankfurter-live',
        serverTime: new Date().toISOString(),
        ...data,
      };
      if (res.status && typeof res.json === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    console.warn('Market latest fetch error:', e?.message);
  }

  // Strict API Policy: When live data is not available, return API Offline error (No mock/hardcoded fallbacks)
  const offlinePayload = {
    status: 'offline',
    error: 'European Central Bank (Frankfurter) FX API Offline',
    serverTime: new Date().toISOString(),
    base,
    rates: {},
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(503).json(offlinePayload);
  }

  return new Response(JSON.stringify(offlinePayload), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
