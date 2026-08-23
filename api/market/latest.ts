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
      if (res.status && typeof res.json === 'function') {
        return res.status(200).json({
          status: 'ok',
          source: 'ecb-frankfurter-live',
          serverTime: new Date().toISOString(),
          ...data,
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    console.warn('Market latest fetch error:', e?.message);
  }

  // Fallback FX data
  const fallback = {
    status: 'ok',
    source: 'cached-fallback',
    amount: 1.0,
    base: base,
    date: new Date().toISOString().split('T')[0],
    serverTime: new Date().toISOString(),
    rates: {
      USD: 0.7434,
      EUR: 0.6858,
      JPY: 115.42,
      GBP: 0.5892,
      AUD: 1.1345,
      CHF: 0.6582,
      CNY: 5.3821,
    },
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(fallback);
  }

  return new Response(JSON.stringify(fallback), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
