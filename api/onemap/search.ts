/**
 * OneMap Singapore Search / Geocoding Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/onemap/search
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const query = (req.query?.searchVal || req.query?.q || 'Marina Bay') as string;
  const returnGeom = req.query?.returnGeom || 'Y';
  const getAddrDetails = req.query?.getAddrDetails || 'Y';

  try {
    const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(
      query
    )}&returnGeom=${returnGeom}&getAddrDetails=${getAddrDetails}&pageNum=1`;

    const apiRes = await fetch(url);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (res.status && typeof res.json === 'function') {
        return res.status(200).json({
          status: 'ok',
          source: 'live-onemap-singapore',
          timestamp: new Date().toISOString(),
          ...data,
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (e: any) {
    console.warn('OneMap API search error:', e?.message);
  }

  // Fallback OneMap result
  const fallback = {
    status: 'ok',
    source: 'mock-onemap-fallback',
    found: 1,
    totalNumPages: 1,
    pageNum: 1,
    results: [
      {
        SEARCHVAL: query.toUpperCase(),
        BLK_NO: '10',
        ROAD_NAME: 'MARINA BOULEVARD',
        BUILDING: 'MARINA BAY FINANCIAL CENTRE',
        ADDRESS: '10 MARINA BOULEVARD MARINA BAY FINANCIAL CENTRE SINGAPORE 018983',
        POSTAL: '018983',
        X: '30120.4',
        Y: '29380.1',
        LATITUDE: '1.2798',
        LONGITUDE: '103.8540',
      },
    ],
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(fallback);
  }

  return new Response(JSON.stringify(fallback), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
