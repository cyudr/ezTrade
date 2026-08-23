import React, { useState, useMemo } from 'react';
import {
  TICKER_VERSE,
  SectorCategory,
  SECTOR_METADATA,
  searchTickerVerse,
  UniverseTicker,
} from '../data/tickerVerse';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpDown,
  Zap,
  Globe,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Activity,
} from 'lucide-react';
import { getTickerApiStatus } from '../utils/tickerApiStatus';

interface TickerVerseExplorerProps {
  onSelectTicker?: (ticker: UniverseTicker) => void;
}

export const TickerVerseExplorer: React.FC<TickerVerseExplorerProps> = ({
  onSelectTicker,
}) => {
  const [selectedSector, setSelectedSector] = useState<SectorCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'price' | 'change' | 'name'>('volume');

  const filteredTickers = useMemo(() => {
    return searchTickerVerse(searchQuery, selectedSector, sortBy);
  }, [searchQuery, selectedSector, sortBy]);

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
            {filteredTickers.length} Assets Listed
          </span>
          <span
            className="px-2.5 py-1 rounded-md border text-emerald-500"
            style={{
              backgroundColor: 'var(--color-positive-bg)',
              borderColor: 'var(--color-positive-border)',
            }}
          >
            ● Real-Time Volume Feeds Active
          </span>
        </div>
      </div>

      {/* Sector Category Filters (Subtle Outline Selection Bar) */}
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

      {/* Search & Sorting Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickers, names, sub-sectors..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs font-mono-val transition-all focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Sort Options with subtle outline */}
        <div className="flex items-center gap-2 self-end sm:self-auto font-mono-val text-xs">
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Sort By:
          </span>
          <div
            className="flex items-center rounded-lg p-0.5 border"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            {[
              { key: 'volume', label: 'Volume Rank' },
              { key: 'price', label: 'Price' },
              { key: 'change', label: '% Volatility' },
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

      {/* Main Grid of Tickers: Clicking navigates to Research Trend Interface */}
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
                    ${ticker.price > 10 ? ticker.price.toFixed(2) : ticker.price.toFixed(4)}
                  </div>
                  <div
                    className="text-[11px] font-semibold flex items-center justify-end gap-0.5"
                    style={{ color: isUp ? 'var(--color-positive)' : 'var(--color-negative)' }}
                  >
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>
                      {isUp ? '+' : ''}
                      {ticker.changePct.toFixed(2)}%
                    </span>
                  </div>
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
    </div>
  );
};
