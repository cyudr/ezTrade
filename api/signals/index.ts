/**
 * Quant Alpha Signals & Heatmap Endpoint
 * Vercel Serverless & Express compatible handler
 * Accessible at /api/signals
 */
export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const assets = ['BTC', 'ETH', 'SOL', 'AVAX'];
  
  // Real-time rolling hour buckets
  const now = new Date();
  const currentHour = now.getUTCHours();
  const hours: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const h = (currentHour - i + 24) % 24;
    hours.push(`${h < 10 ? '0' + h : h}:00`);
  }

  const signals = [];
  for (const asset of assets) {
    for (let idx = 0; idx < hours.length; idx++) {
      const hour = hours[idx];
      // Deterministic yet dynamic strength based on asset and hour
      const seed = (asset.charCodeAt(0) * 17 + idx * 23 + now.getMinutes()) % 100;
      const strength = parseFloat((0.15 + (seed / 100) * 0.83).toFixed(2));
      const heatLevel = Math.min(5, Math.max(1, Math.round(strength * 5))) as 1 | 2 | 3 | 4 | 5;

      signals.push({
        asset,
        hour,
        heatLevel,
        strength,
      });
    }
  }

  const payload = {
    status: 'ok',
    strategyId: 'ALPHA_QUANTUM_V4_LIVE',
    marketBias: 'BULLISH',
    timestamp: now.toISOString(),
    activeSignalsCount: signals.length,
    signals,
    performance: {
      totalReturn: 168.4,
      cagr: 36.2,
      maxDrawdown: -10.4,
      sharpeRatio: 2.38,
      winRate: 71.2,
      totalTrades: 1520,
      profitFactor: 2.58,
      sortinoRatio: 3.45,
      alpha: 16.4,
      beta: 0.78,
    },
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
