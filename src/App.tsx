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
  INITIAL_TICKERS,
  INITIAL_SENTIMENT,
  INITIAL_POSITIONS,
  INITIAL_WATCHLIST,
  INITIAL_SECTORS,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import {
  fetchFrankfurterLatest,
  fetchCoinGeckoPrices,
  mergeLiveDataIntoTickers,
} from './services/apiService';

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

  // Core Data States
  const [tickers, setTickers] = useState<TickerItem[]>(INITIAL_TICKERS);
  const [sentimentFeed, setSentimentFeed] = useState<SentimentItem[]>(INITIAL_SENTIMENT);
  const [positions, setPositions] = useState<PositionItem[]>(INITIAL_POSITIONS);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(INITIAL_WATCHLIST);
  const [sectors, setSectors] = useState<SectorAllocation[]>(INITIAL_SECTORS);
  const [notifications, setNotifications] = useState<TerminalNotification[]>(INITIAL_NOTIFICATIONS);

  // Portfolio aggregates
  const [nav, setNav] = useState(24152890.0);
  const [dayPnlPct, setDayPnlPct] = useState(1.24);

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

  // Sync Live Feeds from keyless Frankfurter & CoinGecko APIs
  const syncLiveMarketFeeds = useCallback(async (silent = true) => {
    setIsSyncingLiveFeeds(true);
    let fxData = null;
    let cryptoData = null;

    try {
      if (apiConfig.frankfurterEnabled) {
        fxData = await fetchFrankfurterLatest('SGD', ['USD', 'EUR', 'JPY', 'GBP']);
      }
    } catch (e) {
      console.warn('Live FX fetch notice:', e);
    }

    try {
      if (apiConfig.coinGeckoEnabled) {
        cryptoData = await fetchCoinGeckoPrices(
          ['bitcoin', 'ethereum', 'solana', 'avalanche-2'],
          ['sgd', 'usd'],
          apiConfig.coinGeckoApiKey
        );
      }
    } catch (e) {
      console.warn('Live Crypto fetch notice:', e);
    }

    if (fxData || cryptoData) {
      setTickers((prev) => mergeLiveDataIntoTickers(prev, fxData, cryptoData));
      if (!silent) {
        addNotification(
          'Live Feeds Synchronized',
          `Fetched European Central Bank FX (Base: SGD) and CoinGecko crypto valuations.`,
          'success'
        );
      }
    }

    setIsSyncingLiveFeeds(false);
  }, [apiConfig, addNotification]);

  // Initial fetch and periodic 30-sec live feed polling
  useEffect(() => {
    syncLiveMarketFeeds(true);
    const feedInterval = setInterval(() => {
      syncLiveMarketFeeds(true);
    }, 30000);

    return () => clearInterval(feedInterval);
  }, [syncLiveMarketFeeds]);

  // Micro-tick simulation loop between API syncs
  useEffect(() => {
    if (!isLiveTicking) return;

    const interval = setInterval(() => {
      // Pick a random ticker to bump slightly
      setTickers((prev) => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        return prev.map((t, idx) => {
          if (idx !== randomIndex) return { ...t, tickStatus: undefined };
          const deltaPct = (Math.random() * 0.3 - 0.14) / 100;
          const newPrice = Math.max(0.001, t.price * (1 + deltaPct));
          const isUp = deltaPct >= 0;
          return {
            ...t,
            price: newPrice,
            changePct: t.changePct + deltaPct * 8,
            tickStatus: isUp ? 'up' : 'down',
          };
        });
      });

      // Periodically update positions last price
      setPositions((prev) => {
        if (Math.random() > 0.6) {
          const randPosIdx = Math.floor(Math.random() * prev.length);
          return prev.map((pos, idx) => {
            if (idx !== randPosIdx) return { ...pos, tickStatus: undefined };
            const delta = (Math.random() * 0.4 - 0.19) / 100;
            const newLast = Math.max(1, pos.lastPrice * (1 + delta));
            const newUnrealized = (newLast - pos.entryPrice) * pos.size;
            return {
              ...pos,
              lastPrice: newLast,
              unrealizedPnl: newUnrealized,
              tickStatus: delta >= 0 ? 'up' : 'down',
            };
          });
        }
        return prev;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isLiveTicking]);

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
        className="flex-1 md:ml-64 pt-14 px-3 sm:px-5 lg:px-6 transition-all"
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
              onSelectTicker={(symbol) => {
                setSearchQuery(symbol);
                addNotification('Ticker Selected', `Inspecting real-time metrics for ${symbol}`, 'info');
              }}
            />
          )}

          {currentTab === 'research' && <ResearchTerminal />}

          {currentTab === 'signals' && (
            <SignalBacktest
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
