import {
  TickerItem,
  SentimentItem,
  PositionItem,
  WatchlistItem,
  SectorAllocation,
  BacktestParams,
  PerformanceSummary,
  SignalHeatmapCell,
  DistributionBin,
  ScatterPoint,
  SystemHealth,
  TerminalNotification,
} from '../types';

export const INITIAL_TICKERS: TickerItem[] = [
  {
    symbol: 'USDSGD',
    price: 1.3452,
    change: 0.0018,
    changePct: 0.13,
    high: 1.3485,
    low: 1.3421,
    volume: '18.4B',
    sparkline: [1.342, 1.343, 1.344, 1.3435, 1.3448, 1.345, 1.3452],
  },
  {
    symbol: 'EURUSD',
    price: 1.0845,
    change: -0.0012,
    changePct: -0.11,
    high: 1.0872,
    low: 1.0838,
    volume: '84.2B',
    sparkline: [1.086, 1.0865, 1.0852, 1.085, 1.0842, 1.0848, 1.0845],
  },
  {
    symbol: 'SGDJPY',
    price: 115.42,
    change: 0.38,
    changePct: 0.33,
    high: 115.8,
    low: 114.9,
    volume: '12.1B',
    sparkline: [114.9, 115.1, 115.0, 115.25, 115.3, 115.42],
  },
  {
    symbol: 'BTCUSD',
    price: 67450.0,
    change: 1512.0,
    changePct: 2.3,
    high: 68100.0,
    low: 65890.0,
    volume: '28.9B',
    sparkline: [65900, 66300, 66800, 66400, 67100, 67250, 67450],
  },
  {
    symbol: 'BTCSGD',
    price: 90720.0,
    change: 2140.0,
    changePct: 2.41,
    high: 91500.0,
    low: 88500.0,
    volume: '8.4B',
    sparkline: [88600, 89100, 89800, 89500, 90300, 90500, 90720],
  },
  {
    symbol: 'ETHUSD',
    price: 3492.8,
    change: 54.2,
    changePct: 1.58,
    high: 3530.0,
    low: 3410.0,
    volume: '14.5B',
    sparkline: [3420, 3445, 3470, 3450, 3480, 3475, 3492.8],
  },
  {
    symbol: 'ETHSGD',
    price: 4698.5,
    change: 78.4,
    changePct: 1.7,
    high: 4740.0,
    low: 4610.0,
    volume: '4.2B',
    sparkline: [4615, 4640, 4670, 4655, 4690, 4680, 4698.5],
  },
  {
    symbol: 'SPX',
    price: 5123.45,
    change: 22.95,
    changePct: 0.45,
    high: 5138.2,
    low: 5098.4,
    volume: '2.84B',
    sparkline: [5098, 5104, 5110, 5102, 5118, 5115, 5123.45],
  },
  {
    symbol: 'NDX',
    price: 17890.12,
    change: -21.46,
    changePct: -0.12,
    high: 17980.5,
    low: 17840.1,
    volume: '3.12B',
    sparkline: [17960, 17940, 17970, 17910, 17880, 17905, 17890.12],
  },
  {
    symbol: 'VIX',
    price: 14.23,
    change: -0.05,
    changePct: -0.35,
    high: 14.85,
    low: 13.92,
    volume: '850K',
    sparkline: [14.4, 14.6, 14.3, 14.5, 14.2, 14.3, 14.23],
  },
  {
    symbol: 'US10Y',
    price: 4.21,
    change: 0.02,
    changePct: 0.48,
    high: 4.24,
    low: 4.18,
    volume: '12.4B',
    sparkline: [4.18, 4.19, 4.2, 4.19, 4.22, 4.2, 4.21],
  },
  {
    symbol: 'NVDA',
    price: 720.15,
    change: 18.4,
    changePct: 2.62,
    high: 724.8,
    low: 701.2,
    volume: '45.1M',
    sparkline: [702, 708, 712, 709, 716, 718, 720.15],
  },
  {
    symbol: 'AAPL',
    price: 182.25,
    change: 1.45,
    changePct: 0.8,
    high: 183.1,
    low: 180.4,
    volume: '58.2M',
    sparkline: [180.5, 181.0, 181.8, 181.2, 182.0, 181.9, 182.25],
  },
  {
    symbol: 'TSLA',
    price: 198.4,
    change: -4.1,
    changePct: -2.02,
    high: 204.5,
    low: 197.8,
    volume: '72.3M',
    sparkline: [203.0, 201.5, 200.2, 202.0, 199.5, 198.8, 198.4],
  },
];

export const INITIAL_SENTIMENT: SentimentItem[] = [
  {
    id: 'sent-1',
    time: '10:42 AM',
    headline: 'Fed Chair indicates potential rate stabilization in Q3 ahead of key inflation data release.',
    sentiment: 'HAWKISH',
    score: 85,
    tags: ['HAWKISH', 'USD', 'MACRO'],
  },
  {
    id: 'sent-2',
    time: '10:15 AM',
    headline: 'Tech sector sees unexpected pullback following supply chain disruption reports in Asia.',
    sentiment: 'BEARISH',
    score: 60,
    tags: ['BEARISH', 'TECH', 'SEMIS'],
  },
  {
    id: 'sent-3',
    time: '09:30 AM',
    headline: 'Markets open flat; trading volume lower than 30-day average as investors await earnings.',
    sentiment: 'NEUTRAL',
    score: 50,
    tags: ['NEUTRAL', 'VOLUME'],
  },
  {
    id: 'sent-4',
    time: '08:55 AM',
    headline: 'ECB confirms quantitative tightening acceleration; European bond yields spike.',
    sentiment: 'BEARISH',
    score: 72,
    tags: ['BEARISH', 'EUR', 'RATES'],
  },
  {
    id: 'sent-5',
    time: '08:12 AM',
    headline: 'Institutional ETF inflows reach 4-month high across major digital asset funds.',
    sentiment: 'HAWKISH',
    score: 92,
    tags: ['BULLISH', 'CRYPTO', 'FLOWS'],
  },
];

export const CORRELATION_MATRICES: Record<string, { assets: string[]; matrix: number[][] }> = {
  '30D': {
    assets: ['SPX', 'NDX', 'US10Y', 'GLD', 'BTC'],
    matrix: [
      [1.0, 0.85, -0.32, 0.15, 0.45],
      [0.85, 1.0, -0.45, 0.05, 0.55],
      [-0.32, -0.45, 1.0, -0.65, -0.2],
      [0.15, 0.05, -0.65, 1.0, 0.12],
      [0.45, 0.55, -0.2, 0.12, 1.0],
    ],
  },
  '1W': {
    assets: ['SPX', 'NDX', 'US10Y', 'GLD', 'BTC'],
    matrix: [
      [1.0, 0.92, -0.18, 0.28, 0.62],
      [0.92, 1.0, -0.25, 0.12, 0.71],
      [-0.18, -0.25, 1.0, -0.42, -0.15],
      [0.28, 0.12, -0.42, 1.0, 0.08],
      [0.62, 0.71, -0.15, 0.08, 1.0],
    ],
  },
  '90D': {
    assets: ['SPX', 'NDX', 'US10Y', 'GLD', 'BTC'],
    matrix: [
      [1.0, 0.78, -0.41, 0.09, 0.38],
      [0.78, 1.0, -0.52, 0.02, 0.48],
      [-0.41, -0.52, 1.0, -0.71, -0.28],
      [0.09, 0.02, -0.71, 1.0, 0.19],
      [0.38, 0.48, -0.28, 0.19, 1.0],
    ],
  },
};

export const INITIAL_POSITIONS: PositionItem[] = [
  {
    id: 'pos-1',
    ticker: 'AAPL',
    size: 15000,
    entryPrice: 175.5,
    lastPrice: 182.25,
    unrealizedPnl: 101250.0,
    status: 'ACTIVE',
    color: '#4d8eff',
  },
  {
    id: 'pos-2',
    ticker: 'TSLA',
    size: 8500,
    entryPrice: 210.0,
    lastPrice: 198.4,
    unrealizedPnl: -98600.0,
    status: 'ACTIVE',
    color: '#ffb3ad',
  },
  {
    id: 'pos-3',
    ticker: 'NVDA',
    size: 4200,
    entryPrice: 650.2,
    lastPrice: 720.15,
    unrealizedPnl: 293790.0,
    status: 'ACTIVE',
    color: '#4d8eff',
  },
  {
    id: 'pos-4',
    ticker: 'MSFT',
    size: 10000,
    entryPrice: 400.0,
    lastPrice: 402.5,
    unrealizedPnl: 25000.0,
    status: 'HELD',
    color: '#8c909f',
  },
];

export const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    beta: 1.85,
    volatility30d: '45.2%',
    dist200dMa: 12.4,
    signal: 'BUY',
  },
  {
    ticker: 'SNOW',
    name: 'Snowflake Inc.',
    beta: 2.1,
    volatility30d: '62.1%',
    dist200dMa: -8.5,
    signal: 'HOLD',
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    beta: 1.95,
    volatility30d: '55.0%',
    dist200dMa: 25.1,
    signal: 'SELL',
  },
  {
    ticker: 'COIN',
    name: 'Coinbase Global',
    beta: 2.45,
    volatility30d: '74.8%',
    dist200dMa: 18.9,
    signal: 'BUY',
  },
  {
    ticker: 'ARM',
    name: 'Arm Holdings plc',
    beta: 2.05,
    volatility30d: '58.3%',
    dist200dMa: 31.2,
    signal: 'BUY',
  },
];

export const INITIAL_SECTORS: SectorAllocation[] = [
  { name: 'Technology', percentage: 45, color: '#4d8eff', amount: 10868800 },
  { name: 'Healthcare', percentage: 25, color: '#4ae176', amount: 6038222 },
  { name: 'Financials', percentage: 15, color: '#ffb3ad', amount: 3622933 },
  { name: 'Other', percentage: 15, color: '#8c909f', amount: 3622933 },
];

export const INITIAL_BACKTEST_PARAMS: BacktestParams = {
  strategyId: 'MOMENTUM_ALPHA_V3',
  startDate: '2023-01-01',
  endDate: '2024-04-15',
  initialCapital: 100000,
  slippagePct: 0.1,
  commissionType: 'Percentage (%)',
  commissionRate: 0.05,
};

export const INITIAL_PERFORMANCE: PerformanceSummary = {
  totalReturn: 145.2,
  cagr: 32.4,
  maxDrawdown: -12.8,
  winRate: 68.5,
  sharpeRatio: 2.14,
  totalTrades: 1402,
  profitFactor: 2.41,
  sortinoRatio: 3.12,
  alpha: 14.8,
  beta: 0.82,
};

export const SIGNAL_HEATMAP_DATA: SignalHeatmapCell[] = [
  // BTC
  { asset: 'BTC', hour: '10:00', heatLevel: 5, strength: 0.95 },
  { asset: 'BTC', hour: '11:00', heatLevel: 4, strength: 0.78 },
  { asset: 'BTC', hour: '12:00', heatLevel: 4, strength: 0.72 },
  { asset: 'BTC', hour: '13:00', heatLevel: 3, strength: 0.5 },
  { asset: 'BTC', hour: '14:00', heatLevel: 2, strength: 0.32 },
  { asset: 'BTC', hour: '15:00', heatLevel: 2, strength: 0.28 },
  { asset: 'BTC', hour: '16:00', heatLevel: 1, strength: 0.12 },
  // ETH
  { asset: 'ETH', hour: '10:00', heatLevel: 4, strength: 0.81 },
  { asset: 'ETH', hour: '11:00', heatLevel: 5, strength: 0.92 },
  { asset: 'ETH', hour: '12:00', heatLevel: 3, strength: 0.48 },
  { asset: 'ETH', hour: '13:00', heatLevel: 3, strength: 0.52 },
  { asset: 'ETH', hour: '14:00', heatLevel: 4, strength: 0.75 },
  { asset: 'ETH', hour: '15:00', heatLevel: 5, strength: 0.98 },
  { asset: 'ETH', hour: '16:00', heatLevel: 4, strength: 0.79 },
  // SOL
  { asset: 'SOL', hour: '10:00', heatLevel: 2, strength: 0.35 },
  { asset: 'SOL', hour: '11:00', heatLevel: 1, strength: 0.15 },
  { asset: 'SOL', hour: '12:00', heatLevel: 1, strength: 0.12 },
  { asset: 'SOL', hour: '13:00', heatLevel: 2, strength: 0.38 },
  { asset: 'SOL', hour: '14:00', heatLevel: 3, strength: 0.55 },
  { asset: 'SOL', hour: '15:00', heatLevel: 3, strength: 0.52 },
  { asset: 'SOL', hour: '16:00', heatLevel: 4, strength: 0.82 },
  // AVAX
  { asset: 'AVAX', hour: '10:00', heatLevel: 3, strength: 0.5 },
  { asset: 'AVAX', hour: '11:00', heatLevel: 3, strength: 0.48 },
  { asset: 'AVAX', hour: '12:00', heatLevel: 2, strength: 0.36 },
  { asset: 'AVAX', hour: '13:00', heatLevel: 3, strength: 0.54 },
  { asset: 'AVAX', hour: '14:00', heatLevel: 4, strength: 0.77 },
  { asset: 'AVAX', hour: '15:00', heatLevel: 5, strength: 0.94 },
  { asset: 'AVAX', hour: '16:00', heatLevel: 4, strength: 0.8 },
];

export const INITIAL_DISTRIBUTION_BINS: DistributionBin[] = [
  { label: '-5σ', count: 1250, percentage: 5, isPositive: false },
  { label: '-4σ', count: 3100, percentage: 12, isPositive: false },
  { label: '-3σ', count: 6800, percentage: 25, isPositive: false },
  { label: '-2σ', count: 12400, percentage: 45, isPositive: false },
  { label: '-1σ', count: 24500, percentage: 85, isPositive: true, highlight: true },
  { label: '0', count: 29800, percentage: 100, isPositive: true },
  { label: '+1σ', count: 21800, percentage: 75, isPositive: true },
  { label: '+2σ', count: 11200, percentage: 40, isPositive: false },
  { label: '+3σ', count: 5400, percentage: 20, isPositive: false },
  { label: '+4σ', count: 2100, percentage: 8, isPositive: false },
  { label: '+5σ', count: 550, percentage: 2, isPositive: false },
];

// Generate reproducible pseudo-random points for research scatter plot
export const generateScatterPoints = (count = 120, zThreshold = 2.5, removeOutliers = false): ScatterPoint[] => {
  const tickers = ['AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMD', 'META', 'GOOGL', 'AMZN', 'AVGO', 'COIN', 'QCOM', 'NFLX'];
  const points: ScatterPoint[] = [];

  for (let i = 0; i < count; i++) {
    // Generate realistic correlation between 30d vol and 5d forward return
    const volBase = 15 + ((i * 37) % 70) + Math.sin(i * 0.4) * 8; // 15% - 85%
    const expectedReturn = -2 + (volBase * 0.12) + (Math.sin(i * 1.7) * 3.5);
    const zScore = (volBase - 45) / 16;

    if (removeOutliers && Math.abs(zScore) > zThreshold) {
      continue;
    }

    points.push({
      id: i,
      x: parseFloat(volBase.toFixed(1)),
      y: parseFloat(expectedReturn.toFixed(2)),
      ticker: tickers[i % tickers.length],
      zScore: parseFloat(zScore.toFixed(2)),
    });
  }
  return points;
};

export const INITIAL_SYSTEM_HEALTH: SystemHealth = {
  apiLatency: { status: 'ok', value: '14ms' },
  marginLevel: { status: 'ok', value: '42.8%' },
  dataFeed: { status: 'ok', value: '99.98%' },
  slippage: { status: 'warning', value: '0.04% (elevated)' },
};

export const INITIAL_NOTIFICATIONS: TerminalNotification[] = [
  {
    id: 'notif-1',
    timestamp: '10:48:12',
    title: 'Order Executed',
    message: 'Filled 1,000 AMD @ 165.50 LMT via Opti-Core Engine.',
    type: 'success',
    read: false,
  },
  {
    id: 'notif-2',
    timestamp: '10:35:00',
    title: 'Slippage Alert',
    message: 'TSLA volatility spiked above 30d 95th percentile (+62.1%).',
    type: 'warning',
    read: false,
  },
  {
    id: 'notif-3',
    timestamp: '09:30:00',
    title: 'Session Started',
    message: 'System_01 connected to Quantum Matrix v4.2. Latency: 14ms.',
    type: 'info',
    read: true,
  },
];
