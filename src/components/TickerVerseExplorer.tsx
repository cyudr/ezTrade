import React, { useState, useMemo, useEffect } from 'react';
import {
  TICKER_VERSE,
  SectorCategory,
  SECTOR_METADATA,
  searchTickerVerse,
  UniverseTicker,
  getTickerApiStatus,
} from '../data';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Flame,
  ShieldAlert,
  Crown,
  X,
} from 'lucide-react';

import { TickerItem } from '../types';

interface TickerVerseExplorerProps {
  initialSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectTicker?: (ticker: UniverseTicker) => void;
  liveTickers?: TickerItem[];
}

export const TickerVerseExplorer: React.FC<TickerVerseExplorerProps> = ({
  initialSearchQuery = '',
  onSearchChange,
  onSelectTicker,
  liveTickers,
}) => {
  const [selectedSector, setSelectedSector] = useState<SectorCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change' | 'name'>('volume');
  const [activeFacet, setActiveFacet] = useState<'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_BETA' | 'MEGA_CAP'>('ALL');

  useEffect(() => {
    if (initialSearchQuery !== undefined && initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const filteredTickers = useMemo(() => {
    return searchTickerVerse(searchQuery, selectedSector, sortBy, activeFacet, liveTickers);
  }, [searchQuery, selectedSector, sortBy, activeFacet, liveTickers]);

  const sectorsList = Object.keys(SECTOR_METADATA) as SectorCategory[];

  const handleInspectTicker = (ticker: UniverseTicker) => {
    if (onSelectTicker) {
      onSelectTicker(ticker);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Ticker Verse Header & Stats */}
      <div className="bento-card rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg border"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-text)',
              }}
            >
              <Layers className="w-4 h-4" />
            </span>
            <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              500+ High-Volume Ticker Verse (Multi-Sector Universe)
            </h2>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            High-liquidity equities, cross-asset ETFs, 24/7 digital assets, and ECB/Singapore FX benchmarks ranked by trading volume. Click any ticker to open the Research Trend Interface.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 text-xs font-mono-val">
          <span
            className="px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {filteredTickers.length} Assets Found
          </span>
          <span
            className="px-2.5 py-1 rounded-md border text-emerald-500"
            style={{
              backgroundColor: 'var(--color-positive-bg)',
              borderColor: 'var(--color-positive-border)',
            }}
          >
            ● Live Data Active
          </span>
        </div>
      </div>

      {/* Sector Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono-val">
        {sectorsList.map((sectorKey) => {
          const meta = SECTOR_METADATA[sectorKey];
          const isSelected = selectedSector === sectorKey;
          return (
            <button
              key={sectorKey}
              onClick={() => setSelectedSector(sectorKey)}
              className={`px-3 py-1.5 rounded-md border whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 font-medium ${
                isSelected ? 'font-bold shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card)',
                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <span>{meta.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Facets Bar (Gainers, Losers, High Beta, Mega Cap) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-val pt-1">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] mr-1" style={{ color: 'var(--text-muted)' }}>
            Quick Filter:
          </span>
          {[
            { key: 'ALL', label: 'All', icon: Zap },
            { key: 'GAINERS', label: 'Gainers (+)', icon: Flame },
            { key: 'LOSERS', label: 'Decliners (-)', icon: ShieldAlert },
            { key: 'HIGH_BETA', label: 'High Beta (β≥1.4)', icon: Sparkles },
            { key: 'MEGA_CAP', label: 'Mega Cap ($200B+)', icon: Crown },
          ].map((facet) => {
            const isSel = activeFacet === facet.key;
            const Icon = facet.icon;
            return (
              <button
                key={facet.key}
                onClick={() => setActiveFacet(facet.key as any)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border flex items-center gap-1"
                style={{
                  backgroundColor: isSel ? 'var(--accent-subtle)' : 'var(--bg-card)',
                  borderColor: isSel ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                  fontWeight: isSel ? 600 : 400,
                }}
              >
                <Icon className="w-3 h-3" />
                <span>{facet.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sort Options with subtle outline */}
        <div className="flex items-center gap-2 font-mono-val text-xs">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Sort:
          </span>
          <div
            className="flex items-center rounded-lg p-0.5 border"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            {[
              { key: 'volume', label: 'Vol Rank' },
              { key: 'price', label: 'Price' },
              { key: 'change', label: '% Move' },
              { key: 'name', label: 'Symbol' },
            ].map((s) => {
              const isSel = sortBy === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key as any)}
                  className="px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer border"
                  style={{
                    backgroundColor: isSel ? 'var(--accent-subtle)' : 'transparent',
                    borderColor: isSel ? 'var(--accent-primary)' : 'transparent',
                    color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontWeight: isSel ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative w-full">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInputChange}
          placeholder="Filter ticker by symbol (NVDA, BTC, EUR), company name, sector, or sub-theme..."
          className="w-full pl-9 pr-8 py-2 rounded-lg border text-xs font-mono-val transition-all focus:outline-none"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-muted cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Empty Search State */}
      {filteredTickers.length === 0 && (
        <div
          className="bento-card rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Search className="w-8 h-8 opacity-40" style={{ color: 'var(--text-muted)' }} />
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            No matching tickers found for "{searchQuery}"
          </div>
          <p className="text-xs max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Try searching by symbol (e.g. AAPL, BTC, SGD, NVDA), company name, or reset the active sector and facet filters.
          </p>
          <button
            onClick={clearSearch}
            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-mono-val font-semibold border cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-text)',
            }}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Main Grid of Tickers: Clicking navigates to Research Trend Interface */}
      {filteredTickers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTickers.map((ticker) => {
            const isUp = ticker.changePct >= 0;
            const apiStatus = getTickerApiStatus(ticker.symbol);

            return (
              <div
                key={ticker.symbol}
                onClick={() => handleInspectTicker(ticker)}
                className="bento-card rounded-xl p-3.5 flex flex-col justify-between gap-3 cursor-pointer transition-all hover:scale-[1.015] hover:border-blue-500/50"
                style={{ borderColor: 'var(--border-subtle)' }}
                title={`Click to open Research Terminal for ${ticker.symbol}`}
              >
                {/* Top Row: Symbol, Vol Rank, Price & Change */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] font-mono-val border"
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        borderColor: 'var(--accent-primary)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      #{ticker.volumeRank}
                    </span>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-sm font-mono-val" style={{ color: 'var(--text-primary)' }}>
                          {ticker.symbol}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.2 rounded font-mono-val"
                          style={{
                            backgroundColor: 'var(--bg-card-subtle)',
                            color: 'var(--text-muted)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {ticker.sector}
                        </span>
                      </div>
                      <div className="text-[11px] truncate max-w-[170px]" style={{ color: 'var(--text-secondary)' }}>
                        {ticker.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono-val">
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {(ticker.price ?? 0) > 0 && !ticker.isOffline ? (
                        `$${(ticker.price ?? 0) > 10 ? (ticker.price ?? 0).toFixed(2) : (ticker.price ?? 0).toFixed(4)}`
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          API offline
                        </span>
                      )}
                    </div>
                    {(ticker.price ?? 0) > 0 && !ticker.isOffline ? (
                      <div
                        className="text-[11px] font-semibold flex items-center justify-end gap-0.5"
                        style={{ color: isUp ? 'var(--color-positive)' : 'var(--color-negative)' }}
                      >
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {isUp ? '+' : ''}
                          {(ticker.changePct ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        Data unavailable
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Row: Subsector & Volume Stats */}
                <div className="flex items-center justify-between text-[11px] font-mono-val pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="truncate max-w-[150px]" style={{ color: 'var(--text-muted)' }}>
                    {ticker.subSector}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Individual API Status Badge */}
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono-val flex items-center gap-1 border"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                      title={`${apiStatus.sourceName} (${apiStatus.protocol}) - Latency ${apiStatus.latencyMs}ms`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-emerald-400 font-semibold">{apiStatus.sourceShort}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{apiStatus.latencyMs}ms</span>
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Vol: {ticker.volume}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Hint */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono-val" style={{ color: 'var(--accent-text)' }}>
                  <span className="flex items-center gap-1 opacity-80">
                    <Sparkles className="w-3 h-3" /> Technical Trend & Multi-Asset Overlay
                  </span>
                  <span className="flex items-center gap-0.5 font-bold">
                    Research <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
