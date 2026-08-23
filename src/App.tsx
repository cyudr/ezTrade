import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { MarketOverview } from './components/MarketOverview';
import { ResearchTerminal } from './components/ResearchTerminal';
import { SignalBacktest } from './components/SignalBacktest';
import { StrategyPerformance } from './components/StrategyPerformance';
import { PortfolioSummary } from './components/PortfolioSummary';
import {
  NewAllocationModal,
  NotificationsModal,
  SettingsModal,
  HelpModal,
  SignalApiSpecModal,
} from './components/Modals';
import {
  ScreenTab,
  TickerItem,
  SentimentItem,
  PositionItem,
  WatchlistItem,
  SectorAllocation,
  TerminalNotification,
  ApiConfig,
} from './types';
import {
  TICKER_VERSE,
  getUniverseTicker,
  fetchFrankfurterLatest,
  fetchCoinGeckoPrices,
  fetchLiveStocks,
  fetchRealFinancialNews,
  fetchApiHealth,
  mergeLiveDataIntoTickers,
  getMarketSessionForSymbol,
} from './data';

const INITIAL_TICKERS: TickerItem[] = TICKER_VERSE.map((t) => ({
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

const INITIAL_POSITIONS: PositionItem[] = [
  {
    id: 'pos-1',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    size: 4000,
    entryPrice: 128.50,
    lastPrice: 0,
    unrealizedPnl: 0,
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
    lastPrice: 0,
    unrealizedPnl: 0,
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
    lastPrice: 0,
    unrealizedPnl: 0,
    status: 'ACTIVE',
    color: '#4ae176',
    tickStatus: 'up',
  },
];

const INITIAL_WATCHLIST: WatchlistItem[] = [
  { ticker: 'AMD', name: 'Advanced Micro Devices', beta: 1.75, volatility30d: '38.4%', dist200dMa: 8.2, signal: 'BUY' },
  { ticker: 'PLTR', name: 'Palantir Technologies', beta: 1.82, volatility30d: '44.5%', dist200dMa: 22.4, signal: 'BUY' },
  { ticker: 'ARM', name: 'Arm Holdings plc', beta: 1.95, volatility30d: '52.1%', dist200dMa: 15.6, signal: 'BUY' },
  { ticker: 'META', name: 'Meta Platforms Inc.', beta: 1.28, volatility30d: '29.5%', dist200dMa: 16.5, signal: 'BUY' },
  { ticker: 'COIN', name: 'Coinbase Global', beta: 2.35, volatility30d: '68.2%', dist200dMa: 12.8, signal: 'HOLD' },
];

const INITIAL_SECTORS: SectorAllocation[] = [
  { name: 'Technology & AI', percentage: 48, color: '#4d8eff', amount: 11593387 },
  { name: 'Digital Assets & Crypto', percentage: 22, color: '#4ae176', amount: 5313635 },
  { name: 'Financials & Fintech', percentage: 18, color: '#f59e0b', amount: 4347520 },
  { name: 'ETFs & Fixed Income', percentage: 12, color: '#8c909f', amount: 2898346 },
];

const INITIAL_NOTIFICATIONS: TerminalNotification[] = [
  {
    id: 'notif-init-1',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    title: 'Live Terminal Session Active',
    message: 'Quantum Terminal v4.2 connected. Live data feeds syncing via API endpoints.',
    type: 'info',
    read: true,
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('market');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveTicking, setIsLiveTicking] = useState(true);

  // API Config
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    frankfurterEnabled: true,
    coinGeckoEnabled: true,
    coinGeckoApiKey: '',
    localSignalEndpoint: 'http://localhost:8000/api/signals',
    localSignalMode: 'auto_fallback',
    localSignalStatus: 'offline',
  });

  // Core Data States - Strictly live from API sources
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);
  const [sentimentFeed, setSentimentFeed] = useState<SentimentItem[]>([]);
  const [positions, setPositions] = useState<PositionItem[]>(INITIAL_POSITIONS);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [sectors, setSectors] = useState<SectorAllocation[]>(INITIAL_SECTORS);
  const [notifications, setNotifications] = useState<TerminalNotification[]>(INITIAL_NOTIFICATIONS);

  // Live API Connection Status Tracker
  const [apiStatus, setApiStatus] = useState<{
    stocks: 'online' | 'offline' | 'checking';
    fx: 'online' | 'offline' | 'checking';
    crypto: 'online' | 'offline' | 'checking';
    news: 'online' | 'offline' | 'checking';
    serverHealth: 'online' | 'offline' | 'checking';
    latencyMs: number;
    lastSynced: string;
  }>({
    stocks: 'checking',
    fx: 'checking',
    crypto: 'checking',
    news: 'checking',
    serverHealth: 'checking',
    latencyMs: 12,
    lastSynced: new Date().toLocaleTimeString(),
  });

  // Modals state
  const [isNewAllocationOpen, setIsNewAllocationOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignalSpecOpen, setIsSignalSpecOpen] = useState(false);
  const [isSyncingLiveFeeds, setIsSyncingLiveFeeds] = useState(false);

  // Toast alert
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  const addNotification = useCallback(
    (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      const newNotif: TerminalNotification = {
        id: `notif-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title,
        message,
        type,
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Show toast
      setToast({ id: newNotif.id, title, message, type });
      setTimeout(() => {
        setToast((current) => (current?.id === newNotif.id ? null : current));
      }, 4000);
    },
    []
  );

  // Selected research ticker & subtab state for seamless cross-navigation
  const [selectedResearchTicker, setSelectedResearchTicker] = useState<string>('NVDA');
  const [researchSubTab, setResearchSubTab] = useState<'TREND' | 'STATS' | 'FACTORS'>('TREND');

  const handleNavigateToResearch = useCallback(
    (symbol: string, subTab: 'TREND' | 'STATS' | 'FACTORS' = 'TREND') => {
      setSelectedResearchTicker(symbol);
      setResearchSubTab(subTab);
      setCurrentTab('research');
      addNotification(
        'Research Trend Loaded',
        `Inspecting technical trend interface and comparison overlays for ${symbol}`,
        'info'
      );
    },
    [addNotification]
  );

  // Portfolio aggregates
  const [nav, setNav] = useState(24152890.0);
  const [dayPnlPct, setDayPnlPct] = useState(1.24);

  // Sync Live Feeds from real live stock endpoint, Frankfurter FX & CoinGecko Crypto
  const syncLiveMarketFeeds = useCallback(async (silent = true) => {
    setIsSyncingLiveFeeds(true);
    let fxData = null;
    let cryptoData = null;
    let stockData = null;
    let realNews = null;
    const pingStart = performance.now();
    let pingLatency = 12;
    let serverOk = false;

    try {
      const healthRes = await fetchApiHealth();
      serverOk = healthRes?.status === 'ok';
      pingLatency = Math.round(performance.now() - pingStart);
    } catch (e) {
      serverOk = false;
    }

    try {
      stockData = await fetchLiveStocks();
    } catch (e) {
      console.warn('Live stock fetch notice:', e);
    }

    try {
      if (apiConfig.frankfurterEnabled) {
        fxData = await fetchFrankfurterLatest('USD', ['SGD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY']);
      }
    } catch (e) {
      console.warn('Live FX fetch notice:', e);
    }

    try {
      if (apiConfig.coinGeckoEnabled) {
        cryptoData = await fetchCoinGeckoPrices(
          ['bitcoin', 'ethereum', 'solana', 'avalanche-2', 'ripple', 'cardano'],
          ['usd', 'sgd'],
          apiConfig.coinGeckoApiKey
        );
      }
    } catch (e) {
      console.warn('Live Crypto fetch notice:', e);
    }

    // Sync verified real-time financial news articles
    try {
      realNews = await fetchRealFinancialNews();
      if (realNews && realNews.length > 0) {
        setSentimentFeed(realNews);
      }
    } catch (e) {
      console.warn('Real financial news fetch notice:', e);
    }

    // Update real-time API status telemetry
    setApiStatus({
      stocks: stockData && Object.keys(stockData).length > 0 ? 'online' : 'offline',
      fx: fxData && fxData.rates && Object.keys(fxData.rates).length > 0 ? 'online' : 'offline',
      crypto: cryptoData && Object.keys(cryptoData).length > 0 ? 'online' : 'offline',
      news: realNews && realNews.length > 0 ? 'online' : 'offline',
      serverHealth: serverOk ? 'online' : 'offline',
      latencyMs: pingLatency,
      lastSynced: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    if (fxData || cryptoData || (stockData && Object.keys(stockData).length > 0)) {
      setTickers((prev) => mergeLiveDataIntoTickers(prev, fxData, cryptoData, stockData));
      
      // Also sync current position values with real market quotes
      if (stockData || cryptoData) {
        setPositions((prev) =>
          prev.map((pos) => {
            const liveStock = stockData?.[pos.ticker];
            if (liveStock) {
              const newLast = liveStock.price;
              const newUnrealized = (newLast - pos.entryPrice) * pos.size;
              return {
                ...pos,
                lastPrice: newLast,
                unrealizedPnl: newUnrealized,
                tickStatus: newLast > pos.lastPrice ? 'up' : newLast < pos.lastPrice ? 'down' : undefined,
              };
            }
            return pos;
          })
        );
      }

      if (!silent) {
        addNotification(
          'Live Feeds Synchronized',
          `Synced real-time quotes across Equities, ECB FX, and Crypto markets.`,
          'success'
        );
      }
    }

    setIsSyncingLiveFeeds(false);
  }, [apiConfig, addNotification]);

  // Initial fetch and periodic 10-sec live feed polling for real live data
  useEffect(() => {
    if (!isLiveTicking) return;
    syncLiveMarketFeeds(true);
    const feedInterval = setInterval(() => {
      syncLiveMarketFeeds(true);
    }, 10000);

    return () => clearInterval(feedInterval);
  }, [syncLiveMarketFeeds, isLiveTicking]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '1') setCurrentTab('market');
      if (e.key === '2') setCurrentTab('research');
      if (e.key === '3') setCurrentTab('signals');
      if (e.key === '4') setCurrentTab('strategy');
      if (e.key === '5') setCurrentTab('portfolio');
      if (e.key === '?') setIsHelpOpen((prev) => !prev);
      if (e.key === 'Escape') {
        setIsNewAllocationOpen(false);
        setIsNotificationsOpen(false);
        setIsSettingsOpen(false);
        setIsHelpOpen(false);
      }
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick Order Execution Handler
  const handleExecuteOrder = (order: {
    ticker: string;
    side: 'BUY' | 'SELL';
    qty: number;
    type: string;
    limitPrice: number;
  }) => {
    const existingIndex = positions.findIndex((p) => p.ticker === order.ticker);
    const orderCost = order.qty * order.limitPrice;

    if (existingIndex >= 0) {
      // Update existing position
      setPositions((prev) => {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newSize =
          order.side === 'BUY' ? existing.size + order.qty : Math.max(0, existing.size - order.qty);
        updated[existingIndex] = {
          ...existing,
          size: newSize,
          lastPrice: order.limitPrice,
          unrealizedPnl: (order.limitPrice - existing.entryPrice) * newSize,
          status: newSize > 0 ? 'ACTIVE' : 'HELD',
          tickStatus: order.side === 'BUY' ? 'up' : 'down',
        };
        return updated;
      });
    } else if (order.side === 'BUY') {
      // Add new position
      const newPos: PositionItem = {
        id: `pos-${Date.now()}`,
        ticker: order.ticker,
        name: `${order.ticker} Corp`,
        size: order.qty,
        entryPrice: order.limitPrice,
        lastPrice: order.limitPrice,
        unrealizedPnl: 0,
        status: 'ACTIVE',
        color: '#4d8eff',
        tickStatus: 'up',
      };
      setPositions((prev) => [newPos, ...prev]);
    }

    // Update NAV
    setNav((prev) => prev + (order.side === 'BUY' ? orderCost * 0.005 : -orderCost * 0.002));
    setDayPnlPct((prev) => prev + 0.08);

    addNotification(
      `Order Filled: ${order.side} ${order.qty} ${order.ticker}`,
      `Executed via Opti-Core DMA at $${order.limitPrice.toFixed(2)} (${order.type}). Routing Latency: 11ms.`,
      'success'
    );
  };

  // New Allocation Handler
  const handleNewAllocation = (allocation: {
    strategyName: string;
    targetAsset: string;
    amount: number;
    benchmark: string;
    riskLimitPct: number;
  }) => {
    setNav((prev) => prev + allocation.amount);
    addNotification(
      `Capital Deployed: ${allocation.strategyName}`,
      `Allocated $${allocation.amount.toLocaleString()} to ${allocation.targetAsset} vs ${
        allocation.benchmark
      }. Max Risk DD: -${allocation.riskLimitPct}%.`,
      'success'
    );
  };

  // Export CSV Telemetry
  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'TICKER,SIZE,ENTRY,LAST,UNREALIZED_PNL,STATUS\n' +
      positions
        .map(
          (p) =>
            `${p.ticker},${p.size},${p.entryPrice},${p.lastPrice},${p.unrealizedPnl},${p.status}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quant_terminal_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('CSV Export Complete', 'Downloaded portfolio & order telemetry records.', 'info');
  };

  return (
    <div
      className="min-h-screen font-sans antialiased flex flex-col transition-colors"
      style={{
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Navigation Bars */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isLiveTicking={isLiveTicking}
        onToggleLiveTicking={() => setIsLiveTicking((prev) => !prev)}
      />

      {/* Main Workspace Frame */}
      <main
        id="main-viewport"
        className="flex-1 md:ml-56 pt-14 px-3 sm:px-5 lg:px-6 transition-all"
      >
        {/* Search query highlight indicator if query present */}
        {searchQuery && (
          <div
            className="my-2 p-2.5 rounded-lg flex items-center justify-between text-[12px] font-mono-val"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-text)',
            }}
          >
            <span>
              Active Filter: <strong style={{ color: 'var(--text-primary)' }}>"{searchQuery}"</strong>
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="cursor-pointer text-[11px] opacity-75 hover:opacity-100"
            >
              Clear Filter ✕
            </button>
          </div>
        )}

        {/* View Switcher based on ScreenTab */}
        <div className="mt-3">
          {currentTab === 'market' && (
            <MarketOverview
              tickers={tickers}
              sentimentFeed={sentimentFeed}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTicker={(symbol) => handleNavigateToResearch(symbol, 'TREND')}
              onNavigateToResearch={(symbol) => handleNavigateToResearch(symbol, 'TREND')}
            />
          )}

          {currentTab === 'research' && (
            <ResearchTerminal
              selectedTicker={selectedResearchTicker}
              initialSubTab={researchSubTab}
              onSelectTicker={(symbol) => handleNavigateToResearch(symbol, 'TREND')}
            />
          )}

          {currentTab === 'signals' && (
            <SignalBacktest
              tickers={tickers}
              onNotify={addNotification}
              apiConfig={apiConfig}
              onOpenSignalSpec={() => setIsSignalSpecOpen(true)}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {currentTab === 'strategy' && (
            <StrategyPerformance onExportCsv={handleExportCsv} onNotify={addNotification} />
          )}

          {currentTab === 'portfolio' && (
            <PortfolioSummary
              positions={positions}
              watchlist={watchlist}
              sectors={sectors}
              nav={nav}
              dayPnlPct={dayPnlPct}
              searchQuery={searchQuery}
              onExecuteOrder={handleExecuteOrder}
              onOpenNewAllocation={() => setIsNewAllocationOpen(true)}
              onExportCsv={handleExportCsv}
            />
          )}
        </div>
      </main>

      {/* Floating Alert Toast Notification */}
      {toast && (
        <div
          id="system-toast"
          className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm w-full rounded-lg p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 bento-card shadow-lg"
          style={{
            borderColor: 'var(--border-strong)',
          }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
            style={{
              backgroundColor:
                toast.type === 'success'
                  ? 'var(--color-positive)'
                  : toast.type === 'error'
                  ? 'var(--color-negative)'
                  : toast.type === 'warning'
                  ? '#f59e0b'
                  : 'var(--accent-primary)',
            }}
          />
          <div className="flex-1 min-w-0 font-mono-val">
            <div className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
              {toast.title}
            </div>
            <div className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-[12px] cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Modals */}
      <NewAllocationModal
        isOpen={isNewAllocationOpen}
        onClose={() => setIsNewAllocationOpen(false)}
        onSubmit={handleNewAllocation}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClear={() => setNotifications([])}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isLiveTicking={isLiveTicking}
        onToggleLiveTicking={() => setIsLiveTicking((prev) => !prev)}
        apiConfig={apiConfig}
        onUpdateApiConfig={(newCfg) => {
          setApiConfig(newCfg);
          addNotification('Configuration Updated', 'Saved API feeds & local signal engine parameters.', 'info');
        }}
        onOpenSignalSpec={() => setIsSignalSpecOpen(true)}
      />

      <SignalApiSpecModal
        isOpen={isSignalSpecOpen}
        onClose={() => setIsSignalSpecOpen(false)}
        localEndpoint={apiConfig.localSignalEndpoint}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
