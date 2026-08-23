/**
 * Market Historical Time Series Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/market/timeseries
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const startDate = (req.query?.startDate || req.query?.start_date || '2024-01-02') as string;
  const endDate = (req.query?.endDate || req.query?.end_date || '') as string;
  const base = (req.query?.base || 'USD') as string;
  const symbols = (req.query?.symbols || 'SGD,EUR,JPY') as string;

  try {
    const dateRange = endDate ? `${startDate}..${endDate}` : `${startDate}..`;
    const url = `https://api.frankfurter.dev/v1/${dateRange}?base=${encodeURIComponent(
      base
    )}&symbols=${encodeURIComponent(symbols)}`;

    const apiRes = await fetch(url);
    if (apiRes.ok) {
      const data = await apiRes.json();
      const payload = {
        status: 'ok',
        source: 'ecb-frankfurter-timeseries-live',
        ...data,
      };
      if (res.status && typeof res.json === 'function') {
        return res.status(200).json(payload);
      }
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(`Frankfurter API returned status: ${apiRes.status}`);
    }
  } catch (e: any) {
    console.error('Market timeseries live fetch error:', e?.message);
    const errorPayload = {
      status: 'error',
      message: e?.message || 'Failed to fetch live timeseries from European Central Bank / Frankfurter API',
      start_date: startDate,
      end_date: endDate,
      base,
      symbols,
    };
    if (res.status && typeof res.json === 'function') {
      return res.status(502).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
