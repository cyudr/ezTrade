/**
 * LTA DataMall Status API Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/lta/status
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const ltaKey = process.env.LTA_ACCOUNT_KEY;

  const payload = {
    status: 'ok',
    service: 'lta-datamall-bridge',
    accountKeyConfigured: Boolean(ltaKey),
    serverTime: new Date().toISOString(),
    endpoints: [
      {
        name: 'Carpark Availability v2',
        path: '/api/lta/carparks',
        status: ltaKey ? 'READY' : 'FALLBACK_READY',
      },
      {
        name: 'Traffic Incidents',
        path: '/api/lta/traffic-incidents',
        status: ltaKey ? 'READY' : 'FALLBACK_READY',
      },
    ],
    notice: ltaKey
      ? 'LTA_ACCOUNT_KEY active. Direct live feed access enabled.'
      : 'LTA_ACCOUNT_KEY not configured in environment. Providing simulated fallback data.',
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
