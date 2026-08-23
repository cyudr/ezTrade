/**
 * Health Check API Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/health
 */
export default async function handler(req: any, res: any) {
  // Handle CORS
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const responsePayload = {
    status: 'ok',
    service: 'quant-terminal-api',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
    env: {
      hasLtaKey: Boolean(process.env.LTA_ACCOUNT_KEY),
      hasOneMapEmail: Boolean(process.env.ONEMAP_EMAIL),
      hasCoinGeckoKey: Boolean(process.env.COINGECKO_API_KEY),
      nodeEnv: process.env.NODE_ENV || 'development',
    },
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(responsePayload);
  }

  return new Response(JSON.stringify(responsePayload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
