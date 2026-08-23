import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Rss,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Search,
  Filter,
  BarChart2,
  BookOpen,
  X,
} from 'lucide-react';
import { TickerItem, SentimentItem } from '../types';
import { CORRELATION_MATRICES } from '../data/mockData';
import { getUniverseTicker, searchTickerVerse, UniverseTicker } from '../data/tickerVerse';
import { getMarketSessionForSymbol } from '../utils/marketHours';
import { getTickerApiStatus } from '../utils/tickerApiStatus';
import { TickerVerseExplorer } from './TickerVerseExplorer';

interface MarketOverviewProps {
  tickers: TickerItem[];
  sentimentFeed: SentimentItem[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectTicker?: (symbol: string) => void;
  onNavigateToResearch?: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  tickers,
  sentimentFeed,
  searchQuery = '',
  onSearchChange,
  onSelectTicker,
  onNavigateToResearch,
}) => {
  const [activeMarketTab, setActiveMarketTab] = useState<'OVERVIEW' | 'TICKER_VERSE'>('OVERVIEW');
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '30D' | '90D'>('30D');
  const [activeSentimentFilter, setActiveSentimentFilter] = useState<
    'ALL' | 'HAWKISH' | 'BEARISH' | 'NEUTRAL'
  >('ALL');
  const [selectedAssetCategory, setSelectedAssetCategory] = useState<
    'EQUITIES' | 'FX_SGD' | 'CRYPTO_SGD'
  >('EQUITIES');

  // Handle ticker redirection
  const handleTickerClick = (symbol: string) => {
    if (onNavigateToResearch) {
      onNavigateToResearch(symbol);
    } else if (onSelectTicker) {
      onSelectTicker(symbol);
    }
  };

  // Helper to resolve ticker from live state or master tickerverse single source of truth
  const getTicker = (sym: string): TickerItem => {
    const live = tickers.find((t) => t.symbol === sym);
    if (live) return live;
    const fromVerse = getUniverseTicker(sym);
    if (fromVerse) return fromVerse;
    return {
      symbol: sym,
      name: `${sym} Asset`,
      price: 100.0,
      change: 0,
      changePct: 0,
      sparkline: [100, 100, 100, 100, 100],
      assetClass: 'US_EQUITY',
    };
  };

  // Filtered universe search matches when query is typed
  const matchingFilteredTickers = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length === 0) return [];
    return searchTickerVerse(searchQuery);
  }, [searchQuery]);

  const spx = getTicker('SPX');
  const ndx = getTicker('NDX');
  const nvda = getTicker('NVDA');
  const usdSgd = getTicker('USDSGD');
  const eurUsd = getTicker('EURUSD');
  const sgdJpy = getTicker('SGDJPY');
  const btcSgd = getTicker('BTCSGD');
  const ethSgd = getTicker('ETHSGD');
  const btcUsd = getTicker('BTCUSD');

  const primaryCards =
    selectedAssetCategory === 'FX_SGD'
      ? [
          { item: usdSgd, label: 'USD / SGD Spot (ECB)' },
          { item: eurUsd, label: 'EUR / USD Interbank' },
          { item: sgdJpy, label: 'SGD / JPY Spot' },
        ]
      : selectedAssetCategory === 'CRYPTO_SGD'
      ? [
          { item: btcSgd, label: 'BTC / SGD (24/7)' },
          { item: ethSgd, label: 'ETH / SGD (24/7)' },
          { item: btcUsd, label: 'BTC / USD (24/7)' },
        ]
      : [
          { item: spx, label: 'S&P 500 Index' },
          { item: ndx, label: 'NASDAQ 100' },
          { item: nvda, label: 'NVIDIA (Post-Split)' },
        ];

  const correlationData = CORRELATION_MATRICES[selectedPeriod];

  const filteredSentiment = sentimentFeed.filter((item) => {
    if (activeSentimentFilter === 'ALL') return true;
    return item.sentiment === activeSentimentFilter;
  });

  const getCellStyle = (val: number): React.CSSProperties => {
    if (val === 1.0) {
      return {
        backgroundColor: 'var(--bg-card-subtle)',
        color: 'var(--text-muted)',
        fontWeight: 600,
      };
    }
    if (val > 0.6) {
      return {
        backgroundColor: 'var(--color-positive-bg)',
        color: 'var(--color-positive)',
        fontWeight: 700,
      };
    }
    if (val > 0.2) {
      return {
        backgroundColor: 'var(--color-positive-bg)',
        color: 'var(--color-positive)',
        opacity: 0.85,
      };
    }
    if (val >= -0.2) {
      return {
        backgroundColor: 'var(--bg-card-subtle)',
        color: 'var(--text-secondary)',
      };
    }
    if (val >= -0.5) {
      return {
        backgroundColor: 'var(--color-negative-bg)',
        color: 'var(--color-negative)',
        opacity: 0.85,
      };
    }
    return {
      backgroundColor: 'var(--color-negative-bg)',
      color: 'var(--color-negative)',
      fontWeight: 700,
    };
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Ticker Tape Banner */}
      <div
        id="ticker-tape"
        className="w-full h-8 overflow-hidden rounded-lg flex items-center font-mono-val text-[11px] select-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="ticker-animation flex items-center">
          {tickers.concat(tickers).map((t, idx) => {
            const isPos = t.changePct >= 0;
            const session = getMarketSessionForSymbol(t.symbol);
            const isMatch =
              searchQuery &&
              (t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.name?.toLowerCase().includes(searchQuery.toLowerCase()));

            return (
              <span
                key={`${t.symbol}-${idx}`}
                onClick={() => handleTickerClick(t.symbol)}
                className={`inline-flex items-center mx-3 gap-1.5 cursor-pointer transition-all hover:underline ${
                  isMatch ? 'px-2 py-0.5 rounded font-bold' : ''
                }`}
                style={{
                  color: isMatch ? 'var(--accent-text)' : 'var(--text-secondary)',
                  backgroundColor: isMatch ? 'var(--accent-subtle)' : 'transparent',
                }}
                title={`Click to inspect ${t.symbol} in Research Terminal`}
              >
                <span className="font-bold" style={{ color: isMatch ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {t.symbol}
                </span>
                <span
                  className={t.tickStatus ? `tick-${t.tickStatus} font-semibold` : 'font-semibold'}
                  style={{
                    color: isPos ? 'var(--color-positive)' : 'var(--color-negative)',
                  }}
                >
                  {t.price > 1000
                    ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : t.price.toFixed(t.price < 10 ? 4 : 2)}
                </span>
                <span
                  className="text-[10px] opacity-90"
                  style={{ color: isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}
                >
                  {isPos ? `+${t.changePct.toFixed(2)}%` : `${t.changePct.toFixed(2)}%`}
                </span>
                {!session.isOpen && session.assetClass !== 'CRYPTO' && (
                  <span
                    className="text-[9px] px-1 py-0.2 rounded font-medium opacity-60 uppercase"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                  >
                    Close
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Mode Switcher & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-1">
        <div
          className="flex items-center p-0.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setActiveMarketTab('OVERVIEW')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              activeMarketTab === 'OVERVIEW' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeMarketTab === 'OVERVIEW' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: activeMarketTab === 'OVERVIEW' ? 'var(--accent-primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: activeMarketTab === 'OVERVIEW' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Benchmark Matrix & Sentiment</span>
          </button>

          <button
            onClick={() => setActiveMarketTab('TICKER_VERSE')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              activeMarketTab === 'TICKER_VERSE' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeMarketTab === 'TICKER_VERSE' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: activeMarketTab === 'TICKER_VERSE' ? 'var(--accent-primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: activeMarketTab === 'TICKER_VERSE' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>500+ Ticker Universe (Multi-Sector)</span>
          </button>
        </div>

        {/* Search Input inline with mode bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Filter ticker (e.g. NVDA, BTC, AAPL)..."
              className="w-full pl-8 pr-7 py-1 rounded-lg border text-xs font-mono-val transition-all focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: searchQuery ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:opacity-100 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <span
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono-val shrink-0"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Latency: <strong>14ms</strong></span>
          </span>
        </div>
      </div>

      {/* DYNAMIC FILTERED TICKER SEARCH RESULTS (Appears when user types into Filter Ticker) */}
      {searchQuery && searchQuery.trim().length > 0 && (
        <div
          className="bento-card rounded-xl p-3.5 flex flex-col gap-3 animate-in fade-in duration-150"
          style={{ borderColor: 'var(--accent-primary)' }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span
                className="p-1 rounded font-bold text-[10px] font-mono-val uppercase border"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-text)',
                }}
              >
                Filtered Tickers
              </span>
              <span className="font-mono-val text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {matchingFilteredTickers.length} Result{matchingFilteredTickers.length === 1 ? '' : 's'} for "{searchQuery}"
              </span>
            </div>
            <button
              onClick={() => onSearchChange?.('')}
              className="text-xs font-mono-val opacity-70 hover:opacity-100 cursor-pointer flex items-center gap-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Clear Filter <X className="w-3 h-3" />
            </button>
          </div>

          {matchingFilteredTickers.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono-val" style={{ color: 'var(--text-muted)' }}>
              No matching tickers found for "{searchQuery}". Try symbols like AAPL, NVDA, BTC, ETH, SGD, EUR.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {matchingFilteredTickers.map((ticker) => {
                const isUp = ticker.changePct >= 0;
                const apiStatus = getTickerApiStatus(ticker.symbol);

                return (
                  <div
                    key={ticker.symbol}
                    onClick={() => handleTickerClick(ticker.symbol)}
                    className="p-2.5 rounded-lg border transition-all cursor-pointer hover:border-blue-500/60 hover:scale-[1.01]"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                    title={`Click to open Research Terminal for ${ticker.symbol}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono-val font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                            {ticker.symbol}
                          </span>
                          <span
                            className="text-[9px] font-mono-val px-1 py-0.2 rounded"
                            style={{
                              backgroundColor: 'var(--bg-card)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {ticker.sector}
                          </span>
                        </div>
                        <div className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {ticker.name}
                        </div>
                      </div>

                      <div className="text-right font-mono-val">
                        <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                          ${ticker.price > 10 ? ticker.price.toFixed(2) : ticker.price.toFixed(4)}
                        </div>
                        <div
                          className="text-[10px] font-semibold"
                          style={{ color: isUp ? 'var(--color-positive)' : 'var(--color-negative)' }}
                        >
                          {isUp ? '+' : ''}{ticker.changePct.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t text-[9px] font-mono-val" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Vol: {ticker.volume}</span>
                      <span className="flex items-center gap-0.5 font-bold" style={{ color: 'var(--accent-text)' }}>
                        Research <ChevronRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW A: BENCHMARK MATRIX & LIVE SENTIMENT */}
      {activeMarketTab === 'OVERVIEW' && (
        <div className="grid grid-cols-12 gap-3 min-h-[640px]">
          {/* Top 3 Benchmark Primary Cards (Left column, span 8) */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
            {/* Asset Selector Segment Bar (Subtle Outline Style) */}
            <div className="flex items-center justify-between">
              <div
                className="flex items-center p-0.5 rounded-lg border font-mono-val text-xs"
                style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
              >
                {[
                  { key: 'EQUITIES', label: 'US Equities & Indices' },
                  { key: 'FX_SGD', label: 'SGD Forex (ECB)' },
                  { key: 'CRYPTO_SGD', label: '24/7 Crypto' },
                ].map((tab) => {
                  const isSelected = selectedAssetCategory === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedAssetCategory(tab.key as any)}
                      className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-all ${
                        isSelected ? 'font-bold' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-mono-val hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                Click any asset to open Research Trend View
              </span>
            </div>

            {/* Benchmark Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {primaryCards.map(({ item, label }) => {
                const isUp = item.changePct >= 0;
                const session = getMarketSessionForSymbol(item.symbol);

                return (
                  <div
                    key={item.symbol}
                    onClick={() => handleTickerClick(item.symbol)}
                    className="bento-card rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.015] hover:border-blue-500/50"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    title={`Click to open Research Terminal for ${item.symbol}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono-val text-sm font-bold tracking-tight"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.symbol}
                          </span>
                          <span
                            className="text-[9px] font-mono-val px-1.5 py-0.2 rounded font-semibold uppercase"
                            style={{
                              backgroundColor: 'var(--bg-card-subtle)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {session.statusLabel}
                          </span>
                        </div>
                        <div className="text-[11px] truncate max-w-[140px]" style={{ color: 'var(--text-secondary)' }}>
                          {label}
                        </div>
                      </div>

                      <div
                        className="p-1 rounded-md text-[10px] font-mono-val font-semibold flex items-center gap-0.5 border"
                        style={{
                          backgroundColor: isUp ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                          color: isUp ? 'var(--color-positive)' : 'var(--color-negative)',
                          borderColor: isUp ? 'var(--color-positive-border)' : 'var(--color-negative-border)',
                        }}
                      >
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {isUp ? `+${item.changePct.toFixed(2)}%` : `${item.changePct.toFixed(2)}%`}
                      </div>
                    </div>

                    {/* Price Quote */}
                    <div className="my-1.5">
                      <span className="font-mono-val text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                        ${item.price > 100 ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : item.price.toFixed(4)}
                      </span>
                      <div className="text-[11px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                        {item.change >= 0 ? '+' : ''}${item.change.toFixed(2)} today
                      </div>
                    </div>

                    {/* Sparkline */}
                    <div
                      className="mt-2 h-9 w-full rounded relative overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <svg className="absolute inset-0 h-full w-full opacity-80" viewBox="0 0 100 35" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          points={
                            isUp
                              ? '0,28 15,24 30,30 50,16 70,20 85,10 100,4'
                              : '0,8 18,12 35,6 55,24 75,18 90,28 100,32'
                          }
                          stroke={isUp ? 'var(--color-positive)' : 'var(--color-negative)'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cross-Asset Correlation Heatmap (Bottom-Left) */}
            <div
              id="correlation-panel"
              className="bento-card rounded-xl p-3.5 flex flex-col flex-1"
            >
              <div
                className="flex justify-between items-center mb-3 pb-2 border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <h2
                    className="font-mono-val text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Cross-Asset Correlation ({selectedPeriod})
                  </h2>
                </div>
                <div className="flex gap-1">
                  {(['1W', '30D', '90D'] as const).map((period) => {
                    const isSelected = selectedPeriod === period;
                    return (
                      <button
                        key={period}
                        onClick={() => setSelectedPeriod(period)}
                        className="font-mono-val text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer border"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-center font-mono-val text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-left" style={{ color: 'var(--text-muted)' }}>
                        ASSET
                      </th>
                      {correlationData.assets.map((asset) => (
                        <th
                          key={asset}
                          onClick={() => handleTickerClick(asset)}
                          className="p-1 font-bold cursor-pointer hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {asset}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationData.assets.map((rowAsset, rIdx) => (
                      <tr key={rowAsset}>
                        <td
                          onClick={() => handleTickerClick(rowAsset)}
                          className="p-1.5 text-left font-bold cursor-pointer hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {rowAsset}
                        </td>
                        {correlationData.matrix[rIdx].map((val, cIdx) => {
                          const colAsset = correlationData.assets[cIdx];
                          return (
                            <td
                              key={`${rowAsset}-${colAsset}`}
                              style={getCellStyle(val)}
                              className="p-1.5 rounded-sm border border-black/5 dark:border-white/5 transition-all hover:scale-105"
                              title={`${rowAsset} vs ${colAsset}: ${val.toFixed(2)}`}
                            >
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sentiment Feed */}
          <div
            id="sentiment-panel"
            className="col-span-12 lg:col-span-4 bento-card rounded-xl p-3.5 flex flex-col h-[560px]"
          >
            <div
              className="flex justify-between items-center mb-2 pb-2 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Rss className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2
                  className="font-mono-val text-[12px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Live Sentiment Feed
                </h2>
              </div>
              <div className="flex gap-1 text-[10px] font-mono-val">
                {(['ALL', 'HAWKISH', 'BEARISH'] as const).map((filter) => {
                  const isSelected = activeSentimentFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveSentimentFilter(filter)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer uppercase transition-all border"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                      }}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feed Items Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar max-h-[480px]">
              {filteredSentiment.map((item, idx) => {
                const isHawk = item.sentiment === 'HAWKISH';
                const isBear = item.sentiment === 'BEARISH';
                return (
                  <div
                    key={item.id ? `${item.id}-${idx}` : `sentiment-item-${idx}`}
                    className="p-2.5 rounded-lg border transition-all hover:border-blue-500/40"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        #{idx + 1} • {item.time}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono-val text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase"
                          style={{
                            backgroundColor: isHawk
                              ? 'var(--color-positive-bg)'
                              : isBear
                              ? 'var(--color-negative-bg)'
                              : 'var(--color-neutral-badge-bg)',
                            color: isHawk
                              ? 'var(--color-positive)'
                              : isBear
                              ? 'var(--color-negative)'
                              : 'var(--color-neutral-badge-text)',
                            border: `1px solid ${
                              isHawk
                                ? 'var(--color-positive-border)'
                                : isBear
                                ? 'var(--color-negative-border)'
                                : 'var(--border-subtle)'
                            }`,
                          }}
                        >
                          {item.sentiment} ({item.score}%)
                        </span>
                      </div>
                    </div>

                    {/* Exact Article Link Headline */}
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium leading-snug hover:underline block my-1"
                      style={{ color: 'var(--text-primary)' }}
                      title={`Read full article on ${item.source}`}
                    >
                      {item.headline}
                    </a>

                    <div
                      className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5 pt-1.5 border-t"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-1">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="font-mono-val text-[9px] px-1 rounded uppercase"
                            style={{
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Direct External Article Link Button */}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-mono-val font-semibold px-2 py-0.5 rounded border transition-colors hover:opacity-100 opacity-90"
                        style={{
                          backgroundColor: 'var(--accent-subtle)',
                          borderColor: 'var(--accent-primary)',
                          color: 'var(--accent-text)',
                        }}
                        title={`Open exact permalink: ${item.sourceUrl}`}
                      >
                        <span>{item.source}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: 500+ TICKER UNIVERSE EXPLORER */}
      {activeMarketTab === 'TICKER_VERSE' && (
        <TickerVerseExplorer
          initialSearchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onSelectTicker={(ticker) => handleTickerClick(ticker.symbol)}
        />
      )}
    </div>
  );
};
