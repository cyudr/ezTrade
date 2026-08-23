/**
 * LTA CarPark Availability v2 Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/lta/carparks
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const accountKey = process.env.LTA_ACCOUNT_KEY || req.headers?.['accountkey'];

  if (accountKey) {
    try {
      const response = await fetch(
        'http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
        {
          headers: {
            AccountKey: accountKey,
            accept: 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (res.status && typeof res.json === 'function') {
          return res.status(200).json({
            status: 'ok',
            source: 'live-lta-datamall',
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
      console.warn('LTA DataMall fetch error, falling back:', e?.message);
    }
  }

  // Fallback Singapore Carpark Data
  const fallbackData = {
    status: 'ok',
    source: accountKey ? 'fallback-on-error' : 'mock-fallback',
    message: accountKey
      ? 'Error reaching LTA live server; returning cached baseline.'
      : 'LTA_ACCOUNT_KEY not set in environment. Set in Vercel Settings -> Environment Variables.',
    timestamp: new Date().toISOString(),
    value: [
      {
        CarParkID: '1',
        Area: 'Marina',
        Development: 'Suntec City',
        Location: '1.2934 103.8572',
        AvailableLots: 428,
        LotType: 'C',
        Agency: 'LTA',
      },
      {
        CarParkID: '2',
        Area: 'Marina',
        Development: 'Marina Bay Sands',
        Location: '1.2830 103.8607',
        AvailableLots: 612,
        LotType: 'C',
        Agency: 'LTA',
      },
      {
        CarParkID: '3',
        Area: 'Orchard',
        Development: 'ION Orchard',
        Location: '1.3040 103.8320',
        AvailableLots: 195,
        LotType: 'C',
        Agency: 'LTA',
      },
      {
        CarParkID: '4',
        Area: 'Raffles Place',
        Development: 'One Raffles Quay',
        Location: '1.2818 103.8523',
        AvailableLots: 84,
        LotType: 'C',
        Agency: 'LTA',
      },
      {
        CarParkID: '5',
        Area: 'Jurong',
        Development: 'Jem / Westgate',
        Location: '1.3331 103.7436',
        AvailableLots: 320,
        LotType: 'C',
        Agency: 'LTA',
      },
    ],
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(fallbackData);
  }

  return new Response(JSON.stringify(fallbackData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
