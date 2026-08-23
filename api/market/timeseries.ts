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
      if (res.status && typeof res.json === 'function') {
        return res.status(200).json({
          status: 'ok',
          source: 'ecb-frankfurter-timeseries-live',
          ...data,
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    console.warn('Market timeseries fetch error:', e?.message);
  }

  // Fallback synthetic time series
  const rates: Record<string, Record<string, number>> = {};
  const currentYear = new Date().getFullYear();
  for (let m = 1; m <= 12; m++) {
    const mm = m < 10 ? `0${m}` : `${m}`;
    rates[`${currentYear}-${mm}-01`] = {
      SGD: 1.34 + Math.sin(m * 0.5) * 0.02,
      EUR: 0.92 + Math.cos(m * 0.4) * 0.015,
      JPY: 155.0 + Math.sin(m * 0.8) * 3.5,
    };
  }

  const fallback = {
    status: 'ok',
    source: 'synthetic-timeseries-fallback',
    amount: 1.0,
    base: base,
    start_date: startDate,
    end_date: endDate || `${currentYear}-12-31`,
    rates,
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(fallback);
  }

  return new Response(JSON.stringify(fallback), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
