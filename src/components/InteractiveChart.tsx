import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CandlePoint,
  TimeInterval,
  TimeRange,
  VisualizationMode,
  ActiveIndicators,
  DEFAULT_ACTIVE_INDICATORS,
  generateChartDataForInterval,
} from '../data';
import {
  SlidersHorizontal,
  Maximize2,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Eye,
  RefreshCw,
  Info,
  Layers,
  Columns,
  Square,
  Plus,
  X,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import { TICKER_VERSE } from '../data';

export type ChartDisplayMode = 'SINGLE' | 'OVERLAP' | 'SIDE_BY_SIDE';

const POPULAR_COMPARE_TICKERS = [
  { symbol: 'SPX', name: 'S&P 500 Index', color: '#f59e0b' },
  { symbol: 'NDX', name: 'NASDAQ 100 Index', color: '#38bdf8' },
  { symbol: 'NVDA', name: 'NVIDIA Corp', color: '#10b981' },
  { symbol: 'AAPL', name: 'Apple Inc', color: '#a855f7' },
  { symbol: 'TSLA', name: 'Tesla Inc', color: '#ef4444' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', color: '#f97316' },
  { symbol: 'BTCUSD', name: 'Bitcoin (USD)', color: '#eab308' },
  { symbol: 'EURUSD', name: 'EUR / USD Spot', color: '#06b6d4' },
];

interface InteractiveChartProps {
  symbol: string;
  name?: string;
  basePrice?: number;
  change?: number;
  changePct?: number;
  onSymbolSelect?: (symbol: string) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  symbol,
  name,
  basePrice = 214.72,
  change = -10.44,
  changePct = -4.64,
  onSymbolSelect,
}) => {
  // Main view mode: SINGLE, OVERLAP (% Comparison), or SIDE_BY_SIDE (Dual Split)
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('SINGLE');

  // Chart control states
  const [interval, setInterval] = useState<TimeInterval>('1D');
  const [range, setRange] = useState<TimeRange>('1M');
  const [vizMode, setVizMode] = useState<VisualizationMode>('candle');
  const [indicators, setIndicators] = useState<ActiveIndicators>(DEFAULT_ACTIVE_INDICATORS);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Overlap Comparison state
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>(() =>
    symbol === 'SPX' ? ['NDX'] : ['SPX']
  );
  const [compareSearch, setCompareSearch] = useState('');
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Side-by-side secondary ticker
  const [secondarySymbol, setSecondarySymbol] = useState<string>(() =>
    symbol === 'SPX' ? 'NDX' : 'SPX'
  );
  const [secondaryVizMode, setSecondaryVizMode] = useState<VisualizationMode>('candle');

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  // Handle ResizeObserver for true container responsiveness
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.max(320, entry.contentRect.width),
            height: displayMode === 'SIDE_BY_SIDE' ? 480 : 420,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [displayMode]);

  // Primary chart historical data
  const primaryData = useMemo(() => {
    return generateChartDataForInterval(symbol, interval, range, basePrice, 0.022);
  }, [symbol, interval, range, basePrice]);

  // Secondary chart data for side-by-side
  const secondaryBasePrice = useMemo(() => {
    const found = TICKER_VERSE.find((t) => t.symbol === secondarySymbol);
    return found ? found.price : secondarySymbol === 'SPX' ? 7674.37 : 29308.86;
  }, [secondarySymbol]);

  const secondaryData = useMemo(() => {
    return generateChartDataForInterval(secondarySymbol, interval, range, secondaryBasePrice, 0.018);
  }, [secondarySymbol, interval, range, secondaryBasePrice]);

  // Multi-ticker dataset for OVERLAP mode (normalized to % change)
  const overlapDatasets = useMemo(() => {
    const otherSymbols = Array.from(
      new Set(selectedComparisons.filter((sym) => sym !== symbol && Boolean(sym)))
    );
    const allSymbols = [symbol, ...otherSymbols];
    const colors = ['var(--accent-primary)', '#f59e0b', '#38bdf8', '#a855f7', '#ef4444', '#10b981', '#f97316'];

    return allSymbols.map((sym, idx) => {
      let bPrice = basePrice;
      if (sym !== symbol) {
        const found = TICKER_VERSE.find((t) => t.symbol === sym);
        bPrice = found ? found.price : sym === 'SPX' ? 7674.37 : sym === 'NDX' ? 29308.86 : 200;
      }

      const seedData = sym === symbol ? primaryData : generateChartDataForInterval(sym, interval, range, bPrice, 0.015 + (idx * 0.005));
      const firstClose = seedData[0]?.close || 1;

      const normalized = seedData.map((pt) => ({
        ...pt,
        pctChange: ((pt.close - firstClose) / firstClose) * 100,
      }));

      const lastPct = normalized[normalized.length - 1]?.pctChange || 0;

      return {
        symbol: sym,
        color: colors[idx % colors.length],
        data: normalized,
        currentPct: lastPct,
        isPrimary: sym === symbol,
      };
    });
  }, [symbol, selectedComparisons, primaryData, interval, range, basePrice]);

  const activePoint = hoveredIndex !== null && primaryData[hoveredIndex] ? primaryData[hoveredIndex] : primaryData[primaryData.length - 1];

  // Helper toggle for comparison tickers
  const toggleComparisonTicker = (sym: string) => {
    if (sym === symbol) return;
    setSelectedComparisons((prev) => {
      const filtered = prev.filter((s) => s !== symbol);
      return filtered.includes(sym) ? filtered.filter((s) => s !== sym) : [...filtered, sym];
    });
  };

  // Toggle single indicator
  const toggleIndicator = (key: keyof ActiveIndicators) => {
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Scales for Single Chart Mode
  const chartWidth = dimensions.width;
  const mainChartHeight = indicators.rsi || indicators.macd || indicators.stochastic ? 260 : 330;
  const padding = { top: 25, right: 65, bottom: 25, left: 15 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = mainChartHeight - padding.top - padding.bottom;

  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (!primaryData || primaryData.length === 0) {
      return { minPrice: 100, maxPrice: 200, maxVol: 1000000 };
    }
    let min = Infinity;
    let max = -Infinity;
    let mv = 0;
    for (const d of primaryData) {
      const lowVal = vizMode === 'heikinAshi' ? d.haLow || d.low : d.low;
      const highVal = vizMode === 'heikinAshi' ? d.haHigh || d.high : d.high;
      if (lowVal < min) min = lowVal;
      if (highVal > max) max = highVal;
      if (indicators.bollingerBands && d.bbLower && d.bbLower < min) min = d.bbLower;
      if (indicators.bollingerBands && d.bbUpper && d.bbUpper > max) max = d.bbUpper;
      if (indicators.sma200 && d.sma200 && d.sma200 < min) min = d.sma200;
      if (indicators.sma200 && d.sma200 && d.sma200 > max) max = d.sma200;
      if (d.volume > mv) mv = d.volume;
    }
    const margin = (max - min) * 0.05 || 1;
    return { minPrice: min - margin, maxPrice: max + margin, maxVol: mv || 1 };
  }, [primaryData, vizMode, indicators]);

  const priceRange = maxPrice - minPrice || 1;
  const stepX = plotWidth / Math.max(1, primaryData.length - 1);
  const getY = (val: number) => padding.top + plotHeight - ((val - minPrice) / priceRange) * plotHeight;
  const getX = (idx: number) => padding.left + idx * stepX;

  // Scales for Overlap % Mode
  const { minPct, maxPct } = useMemo(() => {
    let min = -2;
    let max = 2;
    overlapDatasets.forEach((ds) => {
      ds.data.forEach((d) => {
        if (d.pctChange < min) min = d.pctChange;
        if (d.pctChange > max) max = d.pctChange;
      });
    });
    const margin = Math.max(1, (max - min) * 0.1);
    return { minPct: min - margin, maxPct: max + margin };
  }, [overlapDatasets]);

  const pctRange = maxPct - minPct || 1;
  const getOverlapY = (pct: number) => padding.top + (300 - padding.top - padding.bottom) - ((pct - minPct) / pctRange) * (300 - padding.top - padding.bottom);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Main Mode Selection Bar: Single vs Overlap vs Side-by-Side */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        {/* Left: Mode Switcher (Subtle outline styling) */}
        <div
          className="flex items-center p-0.5 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setDisplayMode('SINGLE')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              displayMode === 'SINGLE' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: displayMode === 'SINGLE' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: displayMode === 'SINGLE' ? 'var(--accent-primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: displayMode === 'SINGLE' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Single Chart</span>
          </button>

          <button
            onClick={() => setDisplayMode('OVERLAP')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              displayMode === 'OVERLAP' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: displayMode === 'OVERLAP' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: displayMode === 'OVERLAP' ? 'var(--accent-primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: displayMode === 'OVERLAP' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Trend Overlap (% Comparison)</span>
          </button>

          <button
            onClick={() => setDisplayMode('SIDE_BY_SIDE')}
            className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              displayMode === 'SIDE_BY_SIDE' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: displayMode === 'SIDE_BY_SIDE' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: displayMode === 'SIDE_BY_SIDE' ? 'var(--accent-primary)' : 'transparent',
              borderWidth: '1px',
              borderStyle: 'solid',
              color: displayMode === 'SIDE_BY_SIDE' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side Dual View</span>
          </button>
        </div>

        {/* Right: Intervals & Visualizations Controls (Subtle outline styling) */}
        <div className="flex flex-wrap items-center gap-2 font-mono-val text-xs">
          {/* Time Interval Selector (Subtle Outline) */}
          <div
            className="flex items-center rounded-lg p-0.5 border"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            {(['1m', '5m', '15m', '1h', '4h', '1D', '1W'] as TimeInterval[]).map((int) => {
              const isSel = interval === int;
              return (
                <button
                  key={int}
                  onClick={() => setInterval(int)}
                  className="px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: isSel ? 'var(--accent-subtle)' : 'transparent',
                    borderColor: isSel ? 'var(--accent-primary)' : 'transparent',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontWeight: isSel ? 600 : 400,
                  }}
                >
                  {int}
                </button>
              );
            })}
          </div>

          {/* Time Range Selector */}
          <div
            className="flex items-center rounded-lg p-0.5 border"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            {(['1D', '1W', '1M', '3M', '1Y', 'ALL'] as TimeRange[]).map((rng) => {
              const isSel = range === rng;
              return (
                <button
                  key={rng}
                  onClick={() => setRange(rng)}
                  className="px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: isSel ? 'var(--accent-subtle)' : 'transparent',
                    borderColor: isSel ? 'var(--accent-primary)' : 'transparent',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                    fontWeight: isSel ? 600 : 400,
                  }}
                >
                  {rng}
                </button>
              );
            })}
          </div>

          {/* Visualization Modes (Single Chart / Overlay) */}
          {displayMode === 'SINGLE' && (
            <div
              className="flex items-center rounded-lg p-0.5 border"
              style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
            >
              {[
                { mode: 'candle', label: 'Candle' },
                { mode: 'line', label: 'Line' },
                { mode: 'area', label: 'Area' },
                { mode: 'bar', label: 'OHLC' },
                { mode: 'heikinAshi', label: 'H-Ashi' },
              ].map((v) => {
                const isSel = vizMode === v.mode;
                return (
                  <button
                    key={v.mode}
                    onClick={() => setVizMode(v.mode as VisualizationMode)}
                    className="px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSel ? 'var(--accent-subtle)' : 'transparent',
                      borderColor: isSel ? 'var(--accent-primary)' : 'transparent',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: isSel ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontWeight: isSel ? 600 : 400,
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Indicators Dropdown (Single Chart) */}
          {displayMode === 'SINGLE' && (
            <div className="relative">
              <button
                onClick={() => setShowIndicatorsMenu((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer transition-all"
                style={{
                  backgroundColor: showIndicatorsMenu ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                  borderColor: showIndicatorsMenu ? 'var(--accent-primary)' : 'var(--border-subtle)',
                  color: showIndicatorsMenu ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Indicators</span>
              </button>

              {showIndicatorsMenu && (
                <div
                  className="absolute right-0 top-full mt-1.5 z-40 w-64 p-2.5 rounded-xl border shadow-xl flex flex-col gap-2 bento-card font-mono-val text-xs"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-strong)' }}
                >
                  <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      TECHNICAL OVERLAYS
                    </span>
                    <button
                      onClick={() => setShowIndicatorsMenu(false)}
                      className="text-[11px] cursor-pointer hover:opacity-75"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={indicators.sma20}
                        onChange={() => toggleIndicator('sma20')}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        SMA 20
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={indicators.sma50}
                        onChange={() => toggleIndicator('sma50')}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        SMA 50
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={indicators.sma200}
                        onChange={() => toggleIndicator('sma200')}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-400" />
                        SMA 200
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={indicators.bollingerBands}
                        onChange={() => toggleIndicator('bollingerBands')}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        Bollinger (20,2)
                      </span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={indicators.vwap}
                        onChange={() => toggleIndicator('vwap')}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        VWAP Line
                      </span>
                    </label>
                  </div>

                  <div className="pt-1.5 border-t flex flex-col gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      SUB-CHART OSCILLATORS
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={indicators.volume}
                          onChange={() => toggleIndicator('volume')}
                          className="rounded"
                        />
                        <span>Volume Bars</span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={indicators.rsi}
                          onChange={() => toggleIndicator('rsi')}
                          className="rounded"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-400" />
                          RSI (14)
                        </span>
                      </label>

                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <input
                          type="checkbox"
                          checked={indicators.macd}
                          onChange={() => toggleIndicator('macd')}
                          className="rounded"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          MACD (12,26,9)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. MODE 1: SINGLE CHART VIEW */}
      {displayMode === 'SINGLE' && (
        <div className="flex flex-col gap-2">
          {/* Header Stats Info */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-3">
              <span className="text-xl font-bold font-mono-val tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {symbol}
              </span>
              {name && (
                <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  {name}
                </span>
              )}
              {((activePoint?.close ?? basePrice ?? 0) > 0) ? (
                <>
                  <span className="text-lg font-bold font-mono-val" style={{ color: 'var(--text-primary)' }}>
                    ${activePoint?.close != null ? activePoint.close.toFixed(2) : (basePrice ?? 0).toFixed(2)}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded font-mono-val"
                    style={{
                      backgroundColor: (changePct ?? 0) >= 0 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                      color: (changePct ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                      border: `1px solid ${(changePct ?? 0) >= 0 ? 'var(--color-positive-border)' : 'var(--color-negative-border)'}`,
                    }}
                  >
                    {(changePct ?? 0) >= 0 ? '+' : ''}
                    {(changePct ?? 0).toFixed(2)}% ({(change ?? 0) >= 0 ? '+' : ''}${(change ?? 0).toFixed(2)})
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono-val">
                  API offline
                </span>
              )}
            </div>

            {/* Hovered stats HUD */}
            {activePoint && (
              <div className="flex items-center gap-3 text-xs font-mono-val">
                <span style={{ color: 'var(--text-muted)' }}>
                  O: <strong style={{ color: 'var(--text-primary)' }}>${activePoint.open != null ? activePoint.open.toFixed(2) : '—'}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  H: <strong className="text-emerald-500">${activePoint.high != null ? activePoint.high.toFixed(2) : '—'}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  L: <strong className="text-rose-500">${activePoint.low != null ? activePoint.low.toFixed(2) : '—'}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  C: <strong style={{ color: 'var(--text-primary)' }}>${activePoint.close != null ? activePoint.close.toFixed(2) : '—'}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  VOL: <strong style={{ color: 'var(--text-secondary)' }}>{activePoint.volume != null ? (activePoint.volume / 1000).toFixed(0) : '0'}k</strong>
                </span>
              </div>
            )}
          </div>

          {/* SVG Canvas Area */}
          <div
            ref={containerRef}
            className="w-full relative rounded-xl border p-1 overflow-hidden select-none"
            style={{
              backgroundColor: 'var(--bg-app)',
              borderColor: 'var(--border-subtle)',
              minHeight: '380px',
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              width={chartWidth}
              height={dimensions.height}
              className="w-full block cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - padding.left;
                const idx = Math.round(mouseX / stepX);
                if (idx >= 0 && idx < primaryData.length) {
                  setHoveredIndex(idx);
                }
              }}
            >
              <defs>
                <linearGradient id="areaGradientSingle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="bbBandGradientSingle" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = padding.top + plotHeight * ratio;
                const price = maxPrice - priceRange * ratio;
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                      opacity="0.4"
                    />
                    <text
                      x={chartWidth - padding.right + 6}
                      y={y + 3}
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      ${(price ?? 0).toFixed((price ?? 0) > 10 ? 2 : 4)}
                    </text>
                  </g>
                );
              })}

              {/* Bollinger Bands */}
              {indicators.bollingerBands && (
                <path
                  d={
                    primaryData.reduce((acc, d, i) => {
                      if (d.bbUpper === undefined || d.bbLower === undefined) return acc;
                      const x = getX(i);
                      const yUp = getY(d.bbUpper);
                      if (i === 0 || acc === '') return `M ${x} ${yUp}`;
                      return `${acc} L ${x} ${yUp}`;
                    }, '') +
                    primaryData
                      .slice()
                      .reverse()
                      .reduce((acc, d, i) => {
                        if (d.bbLower === undefined) return acc;
                        const origIdx = primaryData.length - 1 - i;
                        const x = getX(origIdx);
                        const yLow = getY(d.bbLower);
                        return `${acc} L ${x} ${yLow}`;
                      }, '') +
                    ' Z'
                  }
                  fill="url(#bbBandGradientSingle)"
                  stroke="#6366f1"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
              )}

              {/* Volume bars */}
              {indicators.volume &&
                primaryData.map((d, i) => {
                  const x = getX(i);
                  const barHeight = (d.volume / maxVol) * 45;
                  const y = mainChartHeight - padding.bottom - barHeight;
                  const isUp = d.close >= d.open;
                  return (
                    <rect
                      key={`vol-${i}`}
                      x={x - 2}
                      y={y}
                      width="4"
                      height={barHeight}
                      fill={isUp ? 'var(--color-positive)' : 'var(--color-negative)'}
                      opacity="0.25"
                    />
                  );
                })}

              {/* Visualization Modes */}
              {(vizMode === 'candle' || vizMode === 'heikinAshi') &&
                primaryData.map((d, i) => {
                  const open = vizMode === 'heikinAshi' ? d.haOpen || d.open : d.open;
                  const close = vizMode === 'heikinAshi' ? d.haClose || d.close : d.close;
                  const high = vizMode === 'heikinAshi' ? d.haHigh || d.high : d.high;
                  const low = vizMode === 'heikinAshi' ? d.haLow || d.low : d.low;
                  const x = getX(i);
                  const yHigh = getY(high);
                  const yLow = getY(low);
                  const yOpen = getY(open);
                  const yClose = getY(close);
                  const isUp = close >= open;
                  const color = isUp ? 'var(--color-positive)' : 'var(--color-negative)';
                  const bodyY = Math.min(yOpen, yClose);
                  const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                  const candleWidth = Math.max(3, Math.min(10, stepX * 0.7));

                  return (
                    <g key={`candle-${i}`}>
                      <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                      <rect
                        x={x - candleWidth / 2}
                        y={bodyY}
                        width={candleWidth}
                        height={bodyHeight}
                        fill={color}
                        rx="1"
                      />
                    </g>
                  );
                })}

              {vizMode === 'line' && (
                <path
                  d={primaryData.reduce((acc, d, i) => {
                    const x = getX(i);
                    const y = getY(d.close);
                    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {vizMode === 'area' && (
                <path
                  d={
                    primaryData.reduce((acc, d, i) => {
                      const x = getX(i);
                      const y = getY(d.close);
                      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '') +
                    ` L ${getX(primaryData.length - 1)} ${mainChartHeight - padding.bottom} L ${getX(
                      0
                    )} ${mainChartHeight - padding.bottom} Z`
                  }
                  fill="url(#areaGradientSingle)"
                  stroke="var(--accent-primary)"
                  strokeWidth="2"
                />
              )}

              {vizMode === 'bar' &&
                primaryData.map((d, i) => {
                  const x = getX(i);
                  const yHigh = getY(d.high);
                  const yLow = getY(d.low);
                  const yOpen = getY(d.open);
                  const yClose = getY(d.close);
                  const isUp = d.close >= d.open;
                  const color = isUp ? 'var(--color-positive)' : 'var(--color-negative)';
                  return (
                    <g key={`bar-${i}`}>
                      <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" />
                      <line x1={x - 3} y1={yOpen} x2={x} y2={yOpen} stroke={color} strokeWidth="1.2" />
                      <line x1={x} y1={yClose} x2={x + 3} y2={yClose} stroke={color} strokeWidth="1.2" />
                    </g>
                  );
                })}

              {/* SMAs & VWAP overlays */}
              {indicators.sma20 && (
                <path
                  d={primaryData.reduce((acc, d, i) => {
                    if (d.sma20 === undefined) return acc;
                    const x = getX(i);
                    const y = getY(d.sma20);
                    if (acc === '') return `M ${x} ${y}`;
                    return `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
              )}
              {indicators.sma50 && (
                <path
                  d={primaryData.reduce((acc, d, i) => {
                    if (d.sma50 === undefined) return acc;
                    const x = getX(i);
                    const y = getY(d.sma50);
                    if (acc === '') return `M ${x} ${y}`;
                    return `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                />
              )}
              {indicators.sma200 && (
                <path
                  d={primaryData.reduce((acc, d, i) => {
                    if (d.sma200 === undefined) return acc;
                    const x = getX(i);
                    const y = getY(d.sma200);
                    if (acc === '') return `M ${x} ${y}`;
                    return `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                />
              )}
              {indicators.vwap && (
                <path
                  d={primaryData.reduce((acc, d, i) => {
                    if (d.vwap === undefined) return acc;
                    const x = getX(i);
                    const y = getY(d.vwap);
                    if (acc === '') return `M ${x} ${y}`;
                    return `${acc} L ${x} ${y}`;
                  }, '')}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Hover Crosshair */}
              {hoveredIndex !== null && primaryData[hoveredIndex] && (
                <g>
                  <line
                    x1={getX(hoveredIndex)}
                    y1={padding.top}
                    x2={getX(hoveredIndex)}
                    y2={mainChartHeight - padding.bottom}
                    stroke="var(--accent-primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={padding.left}
                    y1={getY(primaryData[hoveredIndex].close)}
                    x2={chartWidth - padding.right}
                    y2={getY(primaryData[hoveredIndex].close)}
                    stroke="var(--accent-primary)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={getX(hoveredIndex)}
                    cy={getY(primaryData[hoveredIndex].close)}
                    r="4"
                    fill="var(--accent-primary)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* X-Axis Dates */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const idx = Math.min(primaryData.length - 1, Math.floor((primaryData.length - 1) * ratio));
                const pt = primaryData[idx];
                if (!pt) return null;
                return (
                  <text
                    key={i}
                    x={getX(idx)}
                    y={mainChartHeight - 5}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                );
              })}

              {/* Sub-chart: RSI Panel */}
              {indicators.rsi && (
                <g transform="translate(0, 270)">
                  <line x1={padding.left} y1="0" x2={chartWidth - padding.right} y2="0" stroke="var(--border-subtle)" />
                  <line x1={padding.left} y1="18" x2={chartWidth - padding.right} y2="18" stroke="#f43f5e" strokeDasharray="2 2" opacity="0.4" />
                  <line x1={padding.left} y1="42" x2={chartWidth - padding.right} y2="42" stroke="#10b981" strokeDasharray="2 2" opacity="0.4" />
                  <text x={chartWidth - padding.right + 6} y="22" fill="#f43f5e" fontSize="9" fontFamily="monospace">70</text>
                  <text x={chartWidth - padding.right + 6} y="46" fill="#10b981" fontSize="9" fontFamily="monospace">30</text>
                  <text x={padding.left + 5} y="15" fill="var(--text-muted)" fontSize="9" fontFamily="monospace" fontWeight="bold">RSI (14)</text>
                  <path
                    d={primaryData.reduce((acc, d, i) => {
                      if (d.rsi === undefined) return acc;
                      const x = getX(i);
                      const y = 60 - (d.rsi / 100) * 60;
                      return i === 0 || acc === '' ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* 3. MODE 2: TREND OVERLAP COMPARISON (% NORMALIZED) */}
      {displayMode === 'OVERLAP' && (
        <div className="flex flex-col gap-3">
          {/* Comparison Controls Bar */}
          <div
            className="bento-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono-val font-semibold" style={{ color: 'var(--text-muted)' }}>
                COMPARING ASSETS (% RETURN):
              </span>

              {/* Active compared tickers pills with subtle outline styling */}
              {overlapDatasets.map((ds) => (
                <div
                  key={ds.symbol}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-val border"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: ds.color,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
                  <span className="font-bold">{ds.symbol}</span>
                  <span
                    className="text-[11px] font-semibold ml-1"
                    style={{ color: (ds.currentPct ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
                  >
                    {(ds.currentPct ?? 0) >= 0 ? '+' : ''}
                    {(ds.currentPct ?? 0).toFixed(2)}%
                  </span>
                  {!ds.isPrimary && (
                    <button
                      onClick={() => toggleComparisonTicker(ds.symbol)}
                      className="ml-1 text-[10px] opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Add Comparison Ticker Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-val">
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                + Add Benchmark:
              </span>
              {POPULAR_COMPARE_TICKERS.map((t) => {
                if (t.symbol === symbol) return null;
                const isSelected = selectedComparisons.includes(t.symbol);
                return (
                  <button
                    key={t.symbol}
                    onClick={() => toggleComparisonTicker(t.symbol)}
                    className="px-2 py-0.5 rounded text-[11px] font-medium border cursor-pointer transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                      borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {t.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overlap Multi-Asset Normalized SVG Canvas */}
          <div
            ref={containerRef}
            className="w-full relative rounded-xl border p-1 overflow-hidden select-none"
            style={{
              backgroundColor: 'var(--bg-app)',
              borderColor: 'var(--border-subtle)',
              minHeight: '380px',
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <svg
              width={chartWidth}
              height={360}
              className="w-full block cursor-crosshair"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - padding.left;
                const idx = Math.round(mouseX / stepX);
                if (idx >= 0 && idx < primaryData.length) {
                  setHoveredIndex(idx);
                }
              }}
            >
              {/* Zero Line */}
              <line
                x1={padding.left}
                y1={getOverlapY(0)}
                x2={chartWidth - padding.right}
                y2={getOverlapY(0)}
                stroke="var(--text-muted)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={chartWidth - padding.right + 6}
                y={getOverlapY(0) + 3}
                fill="var(--text-muted)"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                0.00% (Baseline)
              </text>

              {/* Grid Lines & % Axis values */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const pct = maxPct - pctRange * ratio;
                const y = getOverlapY(pct);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                    <text
                      x={chartWidth - padding.right + 6}
                      y={y + 3}
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {pct >= 0 ? '+' : ''}
                      {pct.toFixed(1)}%
                    </text>
                  </g>
                );
              })}

              {/* Overlapping Asset Trend Lines */}
              {overlapDatasets.map((ds) => {
                const pathD = ds.data.reduce((acc, d, i) => {
                  const x = getX(i);
                  const y = getOverlapY(d.pctChange);
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '');

                return (
                  <g key={ds.symbol}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke={ds.color}
                      strokeWidth={ds.isPrimary ? '2.5' : '1.75'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={ds.isPrimary ? 1.0 : 0.85}
                    />
                  </g>
                );
              })}

              {/* Hover Crosshair & Multi-Asset Legend Readout */}
              {hoveredIndex !== null && (
                <g>
                  <line
                    x1={getX(hoveredIndex)}
                    y1={padding.top}
                    x2={getX(hoveredIndex)}
                    y2={330}
                    stroke="var(--text-muted)"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  {overlapDatasets.map((ds) => {
                    const pt = ds.data[hoveredIndex];
                    if (!pt) return null;
                    const cy = getOverlapY(pt.pctChange);
                    return (
                      <circle
                        key={`circle-${ds.symbol}`}
                        cx={getX(hoveredIndex)}
                        cy={cy}
                        r="4"
                        fill={ds.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              )}

              {/* Time scale at bottom */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const idx = Math.min(primaryData.length - 1, Math.floor((primaryData.length - 1) * ratio));
                const pt = primaryData[idx];
                if (!pt) return null;
                return (
                  <text
                    key={i}
                    x={getX(idx)}
                    y={345}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {pt.time}
                  </text>
                );
              })}
            </svg>
          </div>

          {/* Performance Comparison Summary Table */}
          <div className="bento-card rounded-xl p-3.5">
            <h3 className="text-xs font-mono-val font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>
              Relative Performance Matrix ({range} Timeframe)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-val text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th className="pb-1.5 font-semibold">ASSET</th>
                    <th className="pb-1.5 font-semibold text-right">LAST PRICE</th>
                    <th className="pb-1.5 font-semibold text-right">TOTAL RETURN</th>
                    <th className="pb-1.5 font-semibold text-right">ALPHA VS BASE</th>
                    <th className="pb-1.5 font-semibold text-right">CORRELATION (r)</th>
                  </tr>
                </thead>
                <tbody>
                  {overlapDatasets.map((ds) => {
                    const primaryReturn = overlapDatasets[0].currentPct;
                    const alpha = ds.isPrimary ? 0 : ds.currentPct - primaryReturn;
                    return (
                      <tr key={ds.symbol} className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        <td className="py-2 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ds.color }} />
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                            {ds.symbol}
                          </span>
                          {ds.isPrimary && (
                            <span className="text-[10px] px-1 rounded bg-blue-500/10 text-blue-400">PRIMARY</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono-val" style={{ color: 'var(--text-primary)' }}>
                          {(ds.data[ds.data.length - 1]?.close ?? 0) > 0 ? (
                            `$${(ds.data[ds.data.length - 1]?.close ?? 0).toFixed(2)}`
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              API offline
                            </span>
                          )}
                        </td>
                        <td
                          className="py-2 text-right font-bold font-mono-val"
                          style={{ color: (ds.currentPct ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
                        >
                          {(ds.data[ds.data.length - 1]?.close ?? 0) > 0 ? (
                            `${(ds.currentPct ?? 0) >= 0 ? '+' : ''}${(ds.currentPct ?? 0).toFixed(2)}%`
                          ) : (
                            '—'
                          )}
                        </td>
                        <td
                          className="py-2 text-right font-medium"
                          style={{ color: ds.isPrimary ? 'var(--text-muted)' : (alpha ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
                        >
                          {ds.isPrimary ? '—' : `${(alpha ?? 0) >= 0 ? '+' : ''}${(alpha ?? 0).toFixed(2)}%`}
                        </td>
                        <td className="py-2 text-right text-emerald-400 font-medium">
                          {ds.isPrimary ? '1.00' : '0.82'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODE 3: SIDE-BY-SIDE DUAL SPLIT VISUALIZATION */}
      {displayMode === 'SIDE_BY_SIDE' && (
        <div className="flex flex-col gap-3">
          {/* Secondary symbol switcher */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bento-card text-xs font-mono-val">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: 'var(--accent-text)' }}>
                DUAL COMPARISON:
              </span>
              <span className="px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400">
                CHART 1: {symbol}
              </span>
              <span>vs</span>
              <span className="px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400">
                CHART 2: {secondarySymbol}
              </span>
            </div>

            {/* Select Secondary Symbol */}
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--text-muted)' }}>Compare Against:</span>
              <select
                value={secondarySymbol}
                onChange={(e) => setSecondarySymbol(e.target.value)}
                className="px-2 py-1 rounded-lg border text-xs font-mono-val focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {TICKER_VERSE.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol} - {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid of Two Side-by-Side Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Chart 1: Primary Symbol */}
            <div className="bento-card rounded-xl p-3.5 flex flex-col gap-2 border">
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="font-bold text-sm font-mono-val" style={{ color: 'var(--text-primary)' }}>
                    {symbol}
                  </span>
                  <span className="text-xs font-mono-val font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${(primaryData[primaryData.length - 1]?.close ?? 0).toFixed(2)}
                  </span>
                </div>
                <span
                  className="text-xs font-mono-val font-semibold"
                  style={{ color: (changePct ?? 0) >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
                >
                  {(changePct ?? 0) >= 0 ? '+' : ''}
                  {(changePct ?? 0).toFixed(2)}%
                </span>
              </div>

              {/* Chart 1 SVG */}
              <div className="w-full h-64 relative">
                <svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none">
                  {primaryData.map((d, i) => {
                    const step = 400 / Math.max(1, primaryData.length - 1);
                    const x = i * step;
                    const pRange = maxPrice - minPrice || 1;
                    const y = 220 - ((d.close - minPrice) / pRange) * 200;
                    const yOpen = 220 - ((d.open - minPrice) / pRange) * 200;
                    const isUp = d.close >= d.open;
                    return (
                      <g key={i}>
                        <rect
                          x={x - 2}
                          y={Math.min(y, yOpen)}
                          width="4"
                          height={Math.max(2, Math.abs(y - yOpen))}
                          fill={isUp ? 'var(--color-positive)' : 'var(--color-negative)'}
                        />
                      </g>
                    );
                  })}
                  <path
                    d={primaryData.reduce((acc, d, i) => {
                      const step = 400 / Math.max(1, primaryData.length - 1);
                      const x = i * step;
                      const pRange = maxPrice - minPrice || 1;
                      const y = 220 - ((d.close - minPrice) / pRange) * 200;
                      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>

            {/* Chart 2: Secondary Symbol */}
            <div className="bento-card rounded-xl p-3.5 flex flex-col gap-2 border">
              <div className="flex items-center justify-between pb-1 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-sm font-mono-val" style={{ color: 'var(--text-primary)' }}>
                    {secondarySymbol}
                  </span>
                  <span className="text-xs font-mono-val font-semibold" style={{ color: 'var(--text-primary)' }}>
                    ${(secondaryData[secondaryData.length - 1]?.close ?? 0).toFixed(2)}
                  </span>
                </div>
                <span className="text-xs font-mono-val font-semibold text-emerald-400">
                  +1.85%
                </span>
              </div>

              {/* Chart 2 SVG */}
              <div className="w-full h-64 relative">
                <svg width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="none">
                  {secondaryData.map((d, i) => {
                    const step = 400 / Math.max(1, secondaryData.length - 1);
                    const x = i * step;
                    const secMin = Math.min(...secondaryData.map((s) => s.low));
                    const secMax = Math.max(...secondaryData.map((s) => s.high));
                    const pRange = secMax - secMin || 1;
                    const y = 220 - ((d.close - secMin) / pRange) * 200;
                    const yOpen = 220 - ((d.open - secMin) / pRange) * 200;
                    const isUp = d.close >= d.open;
                    return (
                      <g key={i}>
                        <rect
                          x={x - 2}
                          y={Math.min(y, yOpen)}
                          width="4"
                          height={Math.max(2, Math.abs(y - yOpen))}
                          fill={isUp ? 'var(--color-positive)' : 'var(--color-negative)'}
                        />
                      </g>
                    );
                  })}
                  <path
                    d={secondaryData.reduce((acc, d, i) => {
                      const step = 400 / Math.max(1, secondaryData.length - 1);
                      const x = i * step;
                      const secMin = Math.min(...secondaryData.map((s) => s.low));
                      const secMax = Math.max(...secondaryData.map((s) => s.high));
                      const pRange = secMax - secMin || 1;
                      const y = 220 - ((d.close - secMin) / pRange) * 200;
                      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                    }, '')}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
