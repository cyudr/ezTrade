export type ScreenTab = 'market' | 'research' | 'signals' | 'strategy' | 'portfolio';

export type ThemeMode = 'light' | 'dark' | 'clear' | 'custom';

export interface CustomThemeConfig {
  accentColor: string;
  accentName: string;
  canvasTone: 'light-slate' | 'warm-paper' | 'dark-obsidian' | 'deep-navy' | 'crystal-white';
  radius: 'sm' | 'md' | 'lg';
  borderOpacity: number;
}

export interface TickerItem {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePct: number;
  high?: number;
  low?: number;
  volume?: string;
  sparkline: number[];
  tickStatus?: 'up' | 'down' | 'none';
  assetClass?: 'US_EQUITY' | 'CRYPTO' | 'FX' | 'SGX' | 'BOND';
  lastClose?: number;
  isMarketOpen?: boolean;
}

export interface SentimentItem {
  id: string;
  time: string;
  headline: string;
  sentiment: 'HAWKISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // 0 - 100
  tags: string[];
  source?: string;
  sourceUrl?: string;
  author?: string;
}

export interface PositionItem {
  id: string;
  ticker: string;
  name?: string;
  size: number;
  entryPrice: number;
  lastPrice: number;
  unrealizedPnl: number;
  status: 'ACTIVE' | 'HELD' | 'CLOSING' | 'FILLED';
  color: string;
  tickStatus?: 'up' | 'down' | 'none';
}

export interface WatchlistItem {
  ticker: string;
  beta: number;
  volatility30d: string;
  dist200dMa: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  name?: string;
}

export interface SectorAllocation {
  name: string;
  percentage: number;
  color: string;
  amount: number;
}

export interface BacktestParams {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  slippagePct: number;
  commissionType: 'Percentage (%)' | 'Fixed per Trade' | 'Maker/Taker';
  commissionRate: number;
}

export interface PerformanceSummary {
  totalReturn: number;
  cagr: number;
  maxDrawdown: number;
  winRate: number;
  sharpeRatio: number;
  totalTrades: number;
  profitFactor?: number;
  sortinoRatio?: number;
  alpha?: number;
  beta?: number;
}

export interface SignalHeatmapCell {
  asset: string;
  hour: string;
  heatLevel: 1 | 2 | 3 | 4 | 5; // 1: Strong Sell, 2: Sell, 3: Neutral, 4: Buy, 5: Strong Buy
  strength: number;
}

export interface DistributionBin {
  label: string;
  count: number;
  percentage: number;
  isPositive: boolean;
  highlight?: boolean;
}

export interface ScatterPoint {
  id: number;
  x: number; // e.g. Volatility %
  y: number; // e.g. Forward Return %
  ticker: string;
  zScore: number;
}

export interface SystemHealth {
  apiLatency: { status: 'ok' | 'warning' | 'error'; value: string };
  marginLevel: { status: 'ok' | 'warning' | 'error'; value: string };
  dataFeed: { status: 'ok' | 'warning' | 'error'; value: string };
  slippage: { status: 'ok' | 'warning' | 'error'; value: string };
}

export interface ApiConfig {
  frankfurterEnabled: boolean;
  coinGeckoEnabled: boolean;
  coinGeckoApiKey: string;
  localSignalEndpoint: string;
  localSignalMode: 'auto_fallback' | 'local_only' | 'simulated_only';
  localSignalStatus: 'connected' | 'offline' | 'checking' | 'error';
  allowWeekendSimulation?: boolean;
  lastFxSync?: string;
  lastCryptoSync?: string;
  lastSignalSync?: string;
}

export interface TerminalNotification {
  id: string;
  timestamp?: string;
  time?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
}
