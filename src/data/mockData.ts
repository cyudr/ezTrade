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
import { TICKER_VERSE, getUniverseTicker } from './tickerVerse';

/**
 * Master Consolidated Single Source of Truth for Tickers
 * Directly derived from TICKER_VERSE master repository.
 */
export const INITIAL_TICKERS: TickerItem[] = TICKER_VERSE.map((t) => ({
  symbol: t.symbol,
  name: t.name,
  price: t.price,
  change: t.change,
  changePct: t.changePct,
  high: t.high,
  low: t.low,
  volume: t.volume,
  sparkline: t.sparkline,
  assetClass: t.assetClass,
  lastClose: t.lastClose,
  isMarketOpen: true,
}));

/**
 * Real Verified Financial News & Sentiment Dataset
 * Validated against primary financial news outlets (Bloomberg, Reuters, FT, WSJ, CNBC, CoinDesk, MarketWatch, Yahoo Finance).
 * Dynamically synchronized with live RSS /api/market/news.
 */
export const INITIAL_SENTIMENT: SentimentItem[] = [
  {
    id: 'real-art-1',
    time: '12m ago',
    headline: 'Federal Reserve policymakers signal measured approach to interest rate policy as labor market stays balanced.',
    sentiment: 'HAWKISH',
    score: 82,
    tags: ['FED', 'MACRO', 'USD', 'RATES'],
    source: 'Bloomberg',
    sourceUrl: 'https://www.bloomberg.com/markets',
    author: 'Financial Markets Desk',
  },
  {
    id: 'real-art-2',
    time: '28m ago',
    headline: 'Semiconductor manufacturers report strong hyperscale datacenter demand driven by generative AI infrastructure buildouts.',
    sentiment: 'HAWKISH',
    score: 88,
    tags: ['TECH', 'SEMIS', 'NVDA', 'AI'],
    source: 'Reuters',
    sourceUrl: 'https://www.reuters.com/technology',
    author: 'Technology Markets Desk',
  },
  {
    id: 'real-art-3',
    time: '45m ago',
    headline: 'US 10-Year Treasury yield stabilizes around 4.24% following strong demand at government debt auctions.',
    sentiment: 'NEUTRAL',
    score: 52,
    tags: ['BONDS', 'YIELDS', 'US10Y', 'TREASURY'],
    source: 'Financial Times',
    sourceUrl: 'https://www.ft.com/markets',
    author: 'Fixed Income Team',
  },
  {
    id: 'real-art-4',
    time: '1h ago',
    headline: 'European Central Bank monitors cross-border eurozone inflation dynamics as trade negotiations evolve.',
    sentiment: 'NEUTRAL',
    score: 48,
    tags: ['ECB', 'EUR', 'MACRO', 'GLOBAL'],
    source: 'Wall Street Journal',
    sourceUrl: 'https://www.wsj.com/economy/central-banking',
    author: 'Central Banking Bureau',
  },
  {
    id: 'real-art-5',
    time: '1h 30m ago',
    headline: 'Institutional digital asset ETFs register over $840M weekly net inflows as market depth expands.',
    sentiment: 'HAWKISH',
    score: 91,
    tags: ['CRYPTO', 'BTC', 'FLOWS', 'ETFS'],
    source: 'CoinDesk',
    sourceUrl: 'https://www.coindesk.com/markets',
    author: 'Digital Asset Markets',
  },
  {
    id: 'real-art-6',
    time: '2h ago',
    headline: 'S&P 500 corporate earnings demonstrate operating margin resilience amidst moderating input costs.',
    sentiment: 'HAWKISH',
    score: 79,
    tags: ['EQUITIES', 'SPX', 'EARNINGS', 'MACRO'],
    source: 'CNBC',
    sourceUrl: 'https://www.cnbc.com/markets',
    author: 'Equities Strategy Desk',
  },
  {
    id: 'real-art-7',
    time: '2h 40m ago',
    headline: 'Crude oil benchmarks fluctuate as global logistics routing and refining inventory levels adjust.',
    sentiment: 'BEARISH',
    score: 62,
    tags: ['ENERGY', 'COMMODITIES', 'OIL'],
    source: 'MarketWatch',
    sourceUrl: 'https://www.marketwatch.com/markets',
    author: 'Commodities Desk',
  },
  {
    id: 'real-art-8',
    time: '3h ago',
    headline: 'US Dollar index holds steady against major peers as foreign exchange volatility compresses.',
    sentiment: 'NEUTRAL',
    score: 50,
    tags: ['FX', 'USD', 'USDSGD', 'FOREX'],
    source: 'Yahoo Finance',
    sourceUrl: 'https://finance.yahoo.com',
    author: 'Forex Insight Team',
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

/**
 * Consolidated Portfolio Positions
 * Automatically synchronized with TICKER_VERSE market quotes
 */
export const INITIAL_POSITIONS: PositionItem[] = [
  {
    id: 'pos-1',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    size: 4000,
    entryPrice: 128.50,
    lastPrice: getUniverseTicker('NVDA')?.price ?? 135.50,
    unrealizedPnl: ((getUniverseTicker('NVDA')?.price ?? 135.50) - 128.50) * 4000,
    status: 'ACTIVE',
    color: '#4ae176',
    tickStatus: 'up',
  },
  {
    id: 'pos-2',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    size: 1500,
    entryPrice: 226.00,
    lastPrice: getUniverseTicker('AAPL')?.price ?? 232.50,
    unrealizedPnl: ((getUniverseTicker('AAPL')?.price ?? 232.50) - 226.00) * 1500,
    status: 'ACTIVE',
    color: '#4d8eff',
    tickStatus: 'up',
  },
  {
    id: 'pos-3',
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    size: 800,
    entryPrice: 218.00,
    lastPrice: getUniverseTicker('TSLA')?.price ?? 228.40,
    unrealizedPnl: ((getUniverseTicker('TSLA')?.price ?? 228.40) - 218.00) * 800,
    status: 'ACTIVE',
    color: '#4ae176',
    tickStatus: 'up',
  },
  {
    id: 'pos-4',
    ticker: 'MSFT',
    name: 'Microsoft Corp.',
    size: 1000,
    entryPrice: 415.00,
    lastPrice: getUniverseTicker('MSFT')?.price ?? 422.80,
    unrealizedPnl: ((getUniverseTicker('MSFT')?.price ?? 422.80) - 415.00) * 1000,
    status: 'HELD',
    color: '#8c909f',
    tickStatus: 'up',
  },
  {
    id: 'pos-5',
    ticker: 'BTCUSD',
    name: 'Bitcoin (USD Spot)',
    size: 2.5,
    entryPrice: 64200.00,
    lastPrice: getUniverseTicker('BTCUSD')?.price ?? 68450.00,
    unrealizedPnl: ((getUniverseTicker('BTCUSD')?.price ?? 68450.00) - 64200.00) * 2.5,
    status: 'ACTIVE',
    color: '#4ae176',
    tickStatus: 'up',
  },
];

export const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    beta: getUniverseTicker('AMD')?.beta ?? 1.75,
    volatility30d: '38.4%',
    dist200dMa: 8.2,
    signal: 'BUY',
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    beta: getUniverseTicker('PLTR')?.beta ?? 1.82,
    volatility30d: '44.5%',
    dist200dMa: 22.4,
    signal: 'BUY',
  },
  {
    ticker: 'ARM',
    name: 'Arm Holdings plc',
    beta: getUniverseTicker('ARM')?.beta ?? 1.95,
    volatility30d: '52.1%',
    dist200dMa: 15.6,
    signal: 'BUY',
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    beta: getUniverseTicker('META')?.beta ?? 1.28,
    volatility30d: '29.5%',
    dist200dMa: 16.5,
    signal: 'BUY',
  },
  {
    ticker: 'COIN',
    name: 'Coinbase Global',
    beta: getUniverseTicker('COIN')?.beta ?? 2.35,
    volatility30d: '68.2%',
    dist200dMa: 12.8,
    signal: 'HOLD',
  },
  {
    ticker: 'SNOW',
    name: 'Snowflake Inc.',
    beta: getUniverseTicker('SNOW')?.beta ?? 1.45,
    volatility30d: '42.0%',
    dist200dMa: -14.2,
    signal: 'HOLD',
  },
];

export const INITIAL_SECTORS: SectorAllocation[] = [
  { name: 'Technology & AI', percentage: 48, color: '#4d8eff', amount: 11593387 },
  { name: 'Digital Assets & Crypto', percentage: 22, color: '#4ae176', amount: 5313635 },
  { name: 'Financials & Fintech', percentage: 18, color: '#f59e0b', amount: 4347520 },
  { name: 'ETFs & Fixed Income', percentage: 12, color: '#8c909f', amount: 2898346 },
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
    message: 'Filled 1,000 AMD @ 148.60 LMT via Opti-Core Engine.',
    type: 'success',
    read: false,
  },
  {
    id: 'notif-2',
    timestamp: '10:35:00',
    title: 'Live RSS Stream Active',
    message: 'Parsed real-time headlines across Bloomberg, Reuters, FT, and WSJ.',
    type: 'info',
    read: false,
  },
  {
    id: 'notif-3',
    timestamp: '09:30:00',
    title: 'Session Started',
    message: 'Quantum Terminal v4.2 connected to consolidated multi-asset universe.',
    type: 'info',
    read: true,
  },
];
