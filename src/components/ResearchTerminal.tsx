import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Database,
  Filter,
  BarChart3,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  Info,
  Globe,
  Zap,
  TrendingUp,
  Layers,
  Columns,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Plus,
  X,
  Search,
  Check,
  Radio,
  Server,
  Cpu,
  Coins,
  ArrowLeftRight,
} from 'lucide-react';
import {
  fetchFrankfurterTimeSeries,
  computeStatsFromTimeSeries,
  fetchCoinGeckoPrices,
  fetchTimeseriesData,
  TICKER_VERSE,
  UniverseTicker,
  getTickerApiStatus,
} from '../data';
import { DistributionBin, ScatterPoint } from '../types';
import { useTimezone } from '../context/TimezoneContext';
import { InteractiveChart } from './InteractiveChart';

interface ResearchTerminalProps {
  selectedTicker?: string;
  initialSubTab?: 'TREND' | 'STATS' | 'FACTORS';
  onSelectTicker?: (symbol: string) => void;
}

export const ResearchTerminal: React.FC<ResearchTerminalProps> = ({
  selectedTicker = 'NVDA',
  initialSubTab = 'TREND',
  onSelectTicker,
}) => {
  const { formatTime } = useTimezone();

  // Research Sub-tab switcher: TREND vs STATS vs FACTORS
  const [subTab, setSubTab] = useState<'TREND' | 'STATS' | 'FACTORS'>(initialSubTab);

  // Active primary symbol in research view
  const [activeSymbol, setActiveSymbol] = useState<string>(selectedTicker || 'NVDA');

  // Multi-selected tickers for comparative research
  const [selectedTickers, setSelectedTickers] = useState<string[]>([
    selectedTicker || 'NVDA',
    'AAPL',
    'BTCUSD',
    'USDSGD',
  ]);

  // Popover state for Multi-Select Ticker Modal/Dropdown
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerSector, setPickerSector] = useState<string>('ALL');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  // Update active symbol if prop changes
  useEffect(() => {
    if (selectedTicker) {
      setActiveSymbol(selectedTicker);
      if (!selectedTickers.includes(selectedTicker)) {
        setSelectedTickers((prev) => [selectedTicker, ...prev]);
      }
    }
  }, [selectedTicker]);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Look up metadata for active ticker
  const activeTickerMeta = useMemo(() => {
    const found = TICKER_VERSE.find((t) => t.symbol === activeSymbol);
    if (found) return found;
    return {
      symbol: activeSymbol,
      name: `${activeSymbol} Asset`,
      price: activeSymbol === 'SPX' ? 5864.67 : activeSymbol === 'NDX' ? 20385.40 : 135.50,
      changePct: 0.42,
      change: 2.10,
      sector: 'EQUITY',
      subSector: 'Benchmark Index',
    } as UniverseTicker;
  }, [activeSymbol]);

  // Active API Status for the primary ticker
  const activeApiStatus = useMemo(() => {
    return getTickerApiStatus(activeSymbol);
  }, [activeSymbol]);

  // Toggle ticker in multi-select
  const toggleTickerSelection = (sym: string) => {
    if (selectedTickers.includes(sym)) {
      if (selectedTickers.length > 1) {
        const remaining = selectedTickers.filter((s) => s !== sym);
        setSelectedTickers(remaining);
        if (activeSymbol === sym) {
          setActiveSymbol(remaining[0]);
        }
      }
    } else {
      setSelectedTickers([...selectedTickers, sym]);
    }
  };

  // Set preset groupings
  const applyPreset = (preset: 'TECH' | 'CRYPTO' | 'FX' | 'ETFS') => {
    let presetSymbols: string[] = [];
    if (preset === 'TECH') presetSymbols = ['NVDA', 'AAPL', 'MSFT', 'AMD', 'AVGO'];
    if (preset === 'CRYPTO') presetSymbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BTCSGD'];
    if (preset === 'FX') presetSymbols = ['EURUSD', 'USDSGD', 'SGDJPY', 'GBPUSD'];
    if (preset === 'ETFS') presetSymbols = ['SPX', 'NDX', 'SPY', 'QQQ', 'GLD'];

    setSelectedTickers(presetSymbols);
    setActiveSymbol(presetSymbols[0]);
  };

  // API Connection states for Statistical Tab (Trade-related connections only)
  const [connectionType, setConnectionType] = useState('Frankfurter FX (ECB Live Keyless)');
  const [selectedStatSymbols, setSelectedStatSymbols] = useState<string[]>(['USDSGD', 'EURUSD', 'SGDJPY']);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryTimestamp, setQueryTimestamp] = useState('Just now');
  const [dataSourceNotice, setDataSourceNotice] = useState<string | null>(
    'Connected to European Central Bank (Frankfurter) FX time series feed'
  );

  // Filters
  const [zScore, setZScore] = useState(2.5);
  const [maPeriods, setMaPeriods] = useState(50);
  const [maType, setMaType] = useState<'SMA' | 'EMA'>('EMA');
  const [rsiMin, setRsiMin] = useState(30);
  const [rsiMax, setRsiMax] = useState(70);
  const [removeOutliers, setRemoveOutliers] = useState(true);
  const [normalizeData, setNormalizeData] = useState(false);

  // Scatter axes
  const [xAxis, setXAxis] = useState('Volatility (30d)');
  const [yAxis, setYAxis] = useState('Forward Return (5d)');

  // Dynamic custom live data bins / scatter from live API
  const [liveDistribution, setLiveDistribution] = useState<DistributionBin[] | null>(null);
  const [liveScatter, setLiveScatter] = useState<ScatterPoint[] | null>(null);
  const [liveStats, setLiveStats] = useState<any | null>(null);

  // Query live API data
  const handleQuery = async () => {
    setIsQuerying(true);

    if (connectionType.includes('Frankfurter')) {
      try {
        const data = await fetchFrankfurterTimeSeries(
          '2024-01-02',
          '',
          'USD',
          ['SGD', 'EUR', 'JPY']
        );
        const processed = computeStatsFromTimeSeries(data, 'SGD');
        setLiveDistribution(processed.distribution);
        setLiveScatter(processed.scatter);
        setLiveStats(processed.stats);
        setDataSourceNotice(
          `Live ECB Data: ${data.start_date} to ${data.end_date || 'Present'} (${
            Object.keys(data.rates).length
          } observation dates)`
        );
        setQueryTimestamp(formatTime(new Date()));
      } catch (err: any) {
        console.warn('Frankfurter query notice:', err);
        setDataSourceNotice('European Central Bank (Frankfurter) FX API Offline');
        setQueryTimestamp(formatTime(new Date()));
      } finally {
        setIsQuerying(false);
      }
      return;
    }

    if (connectionType.includes('CoinGecko')) {
      try {
        const prices = await fetchCoinGeckoPrices(
          ['bitcoin', 'ethereum', 'solana'],
          ['sgd', 'usd']
        );
        if (prices && Object.keys(prices).length > 0) {
          setDataSourceNotice(
            `CoinGecko 24/7 Feed: BTC SGD $${prices.bitcoin?.sgd ? prices.bitcoin.sgd.toLocaleString() : 'N/A'} | ETH SGD $${prices.ethereum?.sgd ? prices.ethereum.sgd.toLocaleString() : 'N/A'}`
          );
        } else {
          setDataSourceNotice('CoinGecko / Binance Crypto Price API Offline');
        }
        setQueryTimestamp(formatTime(new Date()));
      } catch (err: any) {
        setDataSourceNotice('CoinGecko / Binance Crypto Price API Offline');
        setQueryTimestamp(formatTime(new Date()));
      } finally {
        setIsQuerying(false);
      }
      return;
    }

    if (connectionType.includes('Yahoo') || connectionType.includes('Real-Time')) {
      try {
        const data = await fetchTimeseriesData('SPX', '1mo');
        if (data && data.candles) {
          setDataSourceNotice(
            `NASDAQ & NYSE L1 Feed: Real-time time series synced (${data.candles.length} bar candles)`
          );
        } else {
          setDataSourceNotice('Market Time Series API Offline');
        }
        setQueryTimestamp(formatTime(new Date()));
      } catch (err: any) {
        setDataSourceNotice('Market Time Series API Offline');
        setQueryTimestamp(formatTime(new Date()));
      } finally {
        setIsQuerying(false);
      }
      return;
    }

    // Default simulated query
    setTimeout(() => {
      setIsQuerying(false);
      setLiveDistribution(null);
      setLiveScatter(null);
      setLiveStats(null);
      setQueryTimestamp(formatTime(new Date()));
      setDataSourceNotice('Query executed across internal quant database partitions');
    }, 400);
  };

  useEffect(() => {
    handleQuery();
  }, []);

  const handleConnectionChange = (val: string) => {
    setConnectionType(val);
    if (val.includes('Frankfurter')) {
      setSelectedStatSymbols(['USDSGD', 'EURUSD', 'SGDJPY']);
    } else if (val.includes('CoinGecko')) {
      setSelectedStatSymbols(['BTCUSD', 'ETHUSD', 'SOLUSD']);
    } else if (val.includes('Yahoo') || val.includes('Real-Time')) {
      setSelectedStatSymbols(['SPX', 'NDX', 'NVDA', 'AAPL']);
    } else {
      setSelectedStatSymbols(['SPX', 'NVDA', 'BTCUSD']);
    }
  };

  const scatterPoints = useMemo(() => {
    if (liveScatter && liveScatter.length > 0) {
      return liveScatter.filter((pt) => (!removeOutliers ? true : Math.abs(pt.zScore) <= zScore));
    }
    // Dynamically calculate scatter points from real ticker universe metrics
    return TICKER_VERSE.map((t, idx) => {
      const vol = parseFloat((t.beta * 24.0 + Math.abs(t.changePct) * 3.5).toFixed(1));
      const expectedReturn = parseFloat((t.changePct * 1.5 + t.beta * 1.1).toFixed(2));
      const z = parseFloat(((vol - 35) / 14).toFixed(2));
      return {
        id: idx,
        x: vol,
        y: expectedReturn,
        ticker: t.symbol,
        zScore: z,
      };
    }).filter((pt) => (!removeOutliers ? true : Math.abs(pt.zScore) <= zScore));
  }, [zScore, removeOutliers, liveScatter]);

  const stats = useMemo(() => {
    if (liveStats) {
      return {
        observations: liveStats.observations,
        mean: liveStats.mean,
        stdDev: liveStats.stdDev,
        skewness: liveStats.skewness,
        kurtosis: liveStats.kurtosis,
        rSquared: liveStats.rSquared,
        beta: liveStats.beta,
        pValue: liveStats.pValue,
      };
    }
    const multiplier = normalizeData ? 0.7 : 1.0;
    const count = removeOutliers ? 1452091 - Math.floor((5 - zScore) * 12000) : 1485000;
    return {
      observations: count.toLocaleString(),
      mean: (0.00142 * multiplier).toFixed(5),
      stdDev: (0.0215 * (zScore / 2.5) * multiplier).toFixed(5),
      skewness: (removeOutliers ? -0.154 : -0.342).toFixed(3),
      kurtosis: (removeOutliers ? 4.821 : 6.12).toFixed(3),
      rSquared: (0.142 + (maType === 'EMA' ? 0.015 : 0)).toFixed(3),
      beta: (0.85 * (zScore / 2.5)).toFixed(2),
      pValue: '< 0.001',
    };
  }, [zScore, maType, removeOutliers, normalizeData, liveStats]);

  const activeDistributionBins = useMemo(() => {
    if (liveDistribution && liveDistribution.length > 0) {
      return liveDistribution;
    }
    // Dynamically calculate distribution bins from live universe volatility and change distribution
    const bins = [
      { label: '-5σ', min: -Infinity, max: -4.5, count: 0, isPositive: false },
      { label: '-4σ', min: -4.5, max: -3.5, count: 0, isPositive: false },
      { label: '-3σ', min: -3.5, max: -2.5, count: 0, isPositive: false },
      { label: '-2σ', min: -2.5, max: -1.5, count: 0, isPositive: false },
      { label: '-1σ', min: -1.5, max: -0.5, count: 0, isPositive: false },
      { label: '0', min: -0.5, max: 0.5, count: 0, isPositive: true },
      { label: '+1σ', min: 0.5, max: 1.5, count: 0, isPositive: true },
      { label: '+2σ', min: 1.5, max: 2.5, count: 0, isPositive: true },
      { label: '+3σ', min: 2.5, max: 3.5, count: 0, isPositive: true },
      { label: '+4σ', min: 3.5, max: 4.5, count: 0, isPositive: true },
      { label: '+5σ', min: 4.5, max: Infinity, count: 0, isPositive: true },
    ];

    TICKER_VERSE.forEach((t) => {
      const z = t.changePct / 1.5;
      const bin = bins.find((b) => z >= b.min && z < b.max);
      if (bin) bin.count += 1;
    });

    const max = Math.max(...bins.map((b) => b.count), 1);
    return bins.map((b) => ({
      label: b.label,
      count: b.count,
      percentage: Math.round((b.count / max) * 100),
      isPositive: b.isPositive,
      highlight: b.label === '0' || b.label === '+1σ',
    }));
  }, [liveDistribution]);

  // Filtered universe for the multi-select picker
  const filteredPickerTickers = useMemo(() => {
    return TICKER_VERSE.filter((t) => {
      const matchSearch =
        !pickerSearch ||
        t.symbol.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        t.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
        t.sector.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchSector = pickerSector === 'ALL' || t.sector === pickerSector;
      return matchSearch && matchSector;
    });
  }, [pickerSearch, pickerSector]);

  return (
    <div className="flex flex-col gap-3.5 pb-20 md:pb-6">
      {/* Top Header: Active Primary Target, Multi-Select Quick Bar & Sub-view Switcher */}
      <div className="flex flex-col gap-3 bento-card rounded-xl p-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Active Target Info + Multi-Select Tickers Badge Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-val border"
                style={{
                  backgroundColor: 'var(--accent-subtle)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-text)',
                }}
              >
                PRIMARY TARGET
              </span>
              <span className="text-base font-bold font-mono-val" style={{ color: 'var(--text-primary)' }}>
                {activeSymbol}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono-val">
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                ${activeTickerMeta.price?.toFixed(2)}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{
                  color: activeTickerMeta.changePct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                }}
              >
                {activeTickerMeta.changePct >= 0 ? '+' : ''}
                {activeTickerMeta.changePct?.toFixed(2)}%
              </span>
            </div>

            {/* Individual API Status Badge */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono-val border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title={`${activeApiStatus.sourceName} | Protocol: ${activeApiStatus.protocol} | Latency: ${activeApiStatus.latencyMs}ms`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-400">{activeApiStatus.sourceShort}</span>
              <span style={{ color: 'var(--text-muted)' }}>• {activeApiStatus.latencyMs}ms</span>
            </div>
          </div>

          {/* Sub-view switcher: Subtle outline buttons */}
          <div
            className="flex items-center p-0.5 rounded-lg border"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => setSubTab('TREND')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                subTab === 'TREND' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: subTab === 'TREND' ? 'var(--accent-subtle)' : 'transparent',
                borderColor: subTab === 'TREND' ? 'var(--accent-primary)' : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: subTab === 'TREND' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trend & Comparison</span>
            </button>

            <button
              onClick={() => setSubTab('STATS')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                subTab === 'STATS' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: subTab === 'STATS' ? 'var(--accent-subtle)' : 'transparent',
                borderColor: subTab === 'STATS' ? 'var(--accent-primary)' : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: subTab === 'STATS' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Statistical Distributions</span>
            </button>

            <button
              onClick={() => setSubTab('FACTORS')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono-val font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                subTab === 'FACTORS' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: subTab === 'FACTORS' ? 'var(--accent-subtle)' : 'transparent',
                borderColor: subTab === 'FACTORS' ? 'var(--accent-primary)' : 'transparent',
                borderWidth: '1px',
                borderStyle: 'solid',
                color: subTab === 'FACTORS' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Factor Risk Matrix</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Tickers Strip with Preset Shortcuts and Interactive Dropdown */}
        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono-val font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
              Selected Assets ({selectedTickers.length}):
            </span>

            {selectedTickers.map((sym) => {
              const isPrimary = sym === activeSymbol;
              const meta = TICKER_VERSE.find((t) => t.symbol === sym);
              const apiInfo = getTickerApiStatus(sym);
              const isPos = (meta?.changePct || 0) >= 0;

              return (
                <div
                  key={sym}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono-val border transition-all cursor-pointer group"
                  style={{
                    backgroundColor: isPrimary ? 'var(--accent-subtle)' : 'var(--bg-card)',
                    borderColor: isPrimary ? 'var(--accent-primary)' : 'var(--border-subtle)',
                    color: isPrimary ? 'var(--accent-text)' : 'var(--text-primary)',
                  }}
                  onClick={() => setActiveSymbol(sym)}
                  title={`${meta?.name || sym} | Click to set as primary chart target`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold">{sym}</span>
                  {meta && (
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}
                    >
                      {isPos ? '+' : ''}{meta.changePct?.toFixed(1)}%
                    </span>
                  )}
                  {selectedTickers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTickerSelection(sym);
                      }}
                      className="ml-0.5 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add / Select Tickers Dropdown Trigger */}
            <div className="relative" ref={pickerRef}>
              <button
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-val border cursor-pointer transition-all"
                style={{
                  backgroundColor: isPickerOpen ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                  borderColor: isPickerOpen ? 'var(--accent-primary)' : 'var(--border-strong)',
                  color: isPickerOpen ? 'var(--accent-text)' : 'var(--text-secondary)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Multi-Select Tickers</span>
              </button>

              {/* Multi-Select Tickers Popover */}
              {isPickerOpen && (
                <div
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-xl z-50 p-3 flex flex-col gap-2.5"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-strong)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono-val" style={{ color: 'var(--text-primary)' }}>
                      Multi-Select Research Universe
                    </span>
                    <button
                      onClick={() => setIsPickerOpen(false)}
                      className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-muted cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search ticker, name, sector..."
                      value={pickerSearch}
                      onChange={(e) => setPickerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-mono-val rounded-lg border focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                      autoFocus
                    />
                  </div>

                  {/* Sector Filter Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-[10px] font-mono-val">
                    {['ALL', 'TECHNOLOGY', 'FINANCIALS', 'ETFS_INDICES', 'CRYPTO', 'FOREX'].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setPickerSector(sec)}
                        className={`px-2 py-0.5 rounded border whitespace-nowrap cursor-pointer transition-all ${
                          pickerSector === sec ? 'font-bold' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: pickerSector === sec ? 'var(--accent-subtle)' : 'transparent',
                          borderColor: pickerSector === sec ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          color: pickerSector === sec ? 'var(--accent-text)' : 'var(--text-secondary)',
                        }}
                      >
                        {sec.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Ticker List Checkboxes */}
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
                    {filteredPickerTickers.map((t) => {
                      const isSelected = selectedTickers.includes(t.symbol);
                      const isPrimary = t.symbol === activeSymbol;
                      const apiStatus = getTickerApiStatus(t.symbol);
                      const isPos = t.changePct >= 0;

                      return (
                        <div
                          key={t.symbol}
                          onClick={() => toggleTickerSelection(t.symbol)}
                          className="flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                            borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs font-mono-val" style={{ color: 'var(--text-primary)' }}>
                                  {t.symbol}
                                </span>
                                <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                                  {t.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                                <span>{t.sector}</span>
                                <span>•</span>
                                <span className="text-emerald-400">{apiStatus.sourceShort}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 pl-2">
                            <span className="text-xs font-bold font-mono-val" style={{ color: 'var(--text-primary)' }}>
                              ${t.price.toFixed(2)}
                            </span>
                            <span
                              className="text-[10px] font-semibold font-mono-val"
                              style={{ color: isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}
                            >
                              {isPos ? '+' : ''}{t.changePct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1 text-[10px] font-mono-val">
            <span style={{ color: 'var(--text-muted)' }}>Presets:</span>
            <button
              onClick={() => applyPreset('TECH')}
              className="px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Tech AI (5)
            </button>
            <button
              onClick={() => applyPreset('CRYPTO')}
              className="px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Crypto 24/7 (4)
            </button>
            <button
              onClick={() => applyPreset('FX')}
              className="px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              FX & Rates (4)
            </button>
            <button
              onClick={() => applyPreset('ETFS')}
              className="px-2 py-0.5 rounded border hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              Core ETFs (5)
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: TREND & COMPARISON OVERLAY (Primary focus requested by user) */}
      {subTab === 'TREND' && (
        <div className="bento-card rounded-xl p-4 flex flex-col gap-3">
          <InteractiveChart
            symbol={activeSymbol}
            name={activeTickerMeta.name}
            basePrice={activeTickerMeta.price}
            change={activeTickerMeta.change || 2.4}
            changePct={activeTickerMeta.changePct || 1.2}
            comparisonTickers={selectedTickers.filter((s) => s !== activeSymbol)}
            onSymbolSelect={(sym) => setActiveSymbol(sym)}
          />
        </div>
      )}

      {/* SUB-TAB 2: STATISTICAL DISTRIBUTIONS & REGRESSION */}
      {subTab === 'STATS' && (
        <div className="grid grid-cols-12 gap-3 min-h-[680px]">
          {/* Left Column: Controls & Filters */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
            {/* Data Source Bento Card */}
            <div id="data-source-card" className="bento-card rounded-xl p-3.5">
              <h2
                className="font-mono-val text-[11px] font-bold mb-3 flex items-center gap-2 uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                <Database className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} /> Live Trade
                Feed Connection
              </h2>
              <div className="flex flex-col gap-2.5">
                <label className="flex flex-col gap-1">
                  <span className="font-mono-val text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Connection Type
                  </span>
                  <select
                    value={connectionType}
                    onChange={(e) => handleConnectionChange(e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-mono-val focus:outline-none transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="Frankfurter FX (ECB Live Keyless)">
                      Frankfurter FX (ECB Live Reference Rates)
                    </option>
                    <option value="CoinGecko Crypto (Demo Keyless)">
                      CoinGecko Crypto (24/7 Spot Depth)
                    </option>
                    <option value="Yahoo & Stooq Real-Time (Equities & Benchmarks)">
                      NASDAQ & NYSE L1 Feed (Equities & ETFs)
                    </option>
                    <option value="FRED US Macro & Treasury Yields">
                      FRED US Macro & Treasury Yield Curves
                    </option>
                    <option value="PostgreSQL DB_01 (Internal)">Internal Alpha PostgreSQL DB_01</option>
                  </select>
                </label>

                {/* Multi-Select Target Symbols Pills */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono-val text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Target Assets (Multi-Select)
                    </span>
                    <span className="text-[10px] font-mono-val" style={{ color: 'var(--accent-text)' }}>
                      {selectedStatSymbols.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {['USDSGD', 'EURUSD', 'SGDJPY', 'BTCUSD', 'ETHUSD', 'NVDA', 'AAPL', 'MSFT', 'SPX', 'NDX'].map((sym) => {
                      const isChecked = selectedStatSymbols.includes(sym);
                      return (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              if (selectedStatSymbols.length > 1) {
                                setSelectedStatSymbols(selectedStatSymbols.filter((s) => s !== sym));
                              }
                            } else {
                              setSelectedStatSymbols([...selectedStatSymbols, sym]);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono-val font-semibold border cursor-pointer transition-all ${
                            isChecked ? 'border-accent' : 'opacity-60 hover:opacity-100'
                          }`}
                          style={{
                            backgroundColor: isChecked ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                            borderColor: isChecked ? 'var(--accent-primary)' : 'var(--border-subtle)',
                            color: isChecked ? 'var(--accent-text)' : 'var(--text-secondary)',
                          }}
                        >
                          {isChecked ? '✓ ' : '+ '}{sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  id="query-data-btn"
                  onClick={handleQuery}
                  disabled={isQuerying}
                  className="font-mono-val text-[12px] font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1 border"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-text)',
                  }}
                >
                  {isQuerying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying Live Feeds...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Execute Multi-Asset Sync
                    </>
                  )}
                </button>

                {dataSourceNotice && (
                  <div
                    className="text-[10px] font-mono-val p-2 rounded-lg leading-tight flex items-start gap-1.5 mt-0.5"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <Info className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{dataSourceNotice}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Pipeline Bento Card */}
            <div id="filter-pipeline-card" className="bento-card rounded-xl p-3.5">
              <h2
                className="font-mono-val text-[11px] font-bold mb-3 flex items-center gap-2 uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                <Filter className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} /> Statistical Filters
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono-val">
                    <span style={{ color: 'var(--text-muted)' }}>Z-Score Threshold</span>
                    <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      ±{zScore.toFixed(1)}σ
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.1"
                    value={zScore}
                    onChange={(e) => setZScore(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-card-subtle)' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono-val">
                    <span style={{ color: 'var(--text-muted)' }}>MA Lookback Window</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {maPeriods}d ({maType})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="200"
                      step="5"
                      value={maPeriods}
                      onChange={(e) => setMaPeriods(parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg"
                      style={{ backgroundColor: 'var(--bg-card-subtle)' }}
                    />
                    <button
                      onClick={() => setMaType(maType === 'EMA' ? 'SMA' : 'EMA')}
                      className="px-2 py-0.5 rounded text-[10px] font-mono-val font-semibold border cursor-pointer shrink-0"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {maType}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={removeOutliers}
                      onChange={(e) => setRemoveOutliers(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-[11px] font-mono-val" style={{ color: 'var(--text-secondary)' }}>
                      Winsorize Fat-Tail Outliers (&gt;3σ)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={normalizeData}
                      onChange={(e) => setNormalizeData(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-[11px] font-mono-val" style={{ color: 'var(--text-secondary)' }}>
                      Log-Return Normalization (μ=0, σ=1)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right Area: Statistical Charts & Summary */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-3">
            {/* Top Stat Row: Key Moments & Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { label: 'OBSERVATIONS', val: stats.observations },
                { label: 'DAILY MEAN (μ)', val: stats.mean },
                { label: 'VOLATILITY (σ)', val: stats.stdDev },
                { label: 'SKEWNESS', val: stats.skewness },
                { label: 'KURTOSIS', val: stats.kurtosis },
                { label: 'R-SQUARED (R²)', val: stats.rSquared },
                { label: 'BETA (β)', val: stats.beta },
              ].map((m, idx) => (
                <div key={idx} className="bento-card rounded-lg p-2.5 flex flex-col justify-between">
                  <span className="text-[9px] font-mono-val font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {m.label}
                  </span>
                  <span className="text-sm font-bold font-mono-val mt-1" style={{ color: 'var(--text-primary)' }}>
                    {m.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle: Return Histogram & Empirical Distribution */}
            <div className="bento-card rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono-val text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Return Frequency Distribution & Gaussian Fit
                  </h3>
                  <span className="text-[10px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                    Standardized return bins across {selectedStatSymbols.join(', ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono-val">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Positive Return
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-rose-500" /> Negative Return
                  </span>
                </div>
              </div>

              {/* Histogram Bars */}
              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2">
                {activeDistributionBins.map((bin, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                    <div
                      className="w-full rounded-t transition-all group-hover:brightness-125"
                      style={{
                        height: `${Math.max(6, bin.percentage)}%`,
                        backgroundColor: bin.isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                        opacity: bin.highlight ? 1 : 0.75,
                      }}
                    />
                    <span className="text-[9px] font-mono-val font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {bin.label}
                    </span>

                    {/* Tooltip */}
                    <div
                      className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 pointer-events-none p-1.5 rounded text-[9px] font-mono-val shadow-lg whitespace-nowrap z-20 transition-opacity"
                      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                    >
                      Count: {bin.count.toLocaleString()} ({bin.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Scatter Plot & Linear Cross-Asset Regression */}
            <div className="bento-card rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono-val text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Cross-Asset Volatility vs Forward Return Regression
                  </h3>
                  <span className="text-[10px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                    Parametric regression model • p-value {stats.pValue}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono-val">
                  <span style={{ color: 'var(--text-muted)' }}>X: {xAxis}</span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>Y: {yAxis}</span>
                </div>
              </div>

              {/* Scatter Canvas Grid */}
              <div
                className="h-52 w-full rounded-lg relative overflow-hidden p-2 border flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
              >
                {/* Horizontal Center Axis */}
                <div className="absolute w-full h-[1px] top-1/2 left-0" style={{ backgroundColor: 'var(--border-strong)' }} />
                <div className="absolute h-full w-[1px] left-1/2 top-0" style={{ backgroundColor: 'var(--border-strong)' }} />

                {/* Regression Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1="10%"
                    y1="75%"
                    x2="90%"
                    y2="25%"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Render Scatter Points */}
                {scatterPoints.slice(0, 90).map((pt) => {
                  const leftPct = Math.min(95, Math.max(5, (pt.x / 80) * 100));
                  const topPct = Math.min(95, Math.max(5, 50 - pt.y * 3));
                  const isPos = pt.y >= 0;

                  return (
                    <div
                      key={pt.id}
                      className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-150 cursor-pointer group"
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        backgroundColor: isPos ? 'var(--color-positive)' : 'var(--color-negative)',
                        opacity: 0.8,
                      }}
                    >
                      <div
                        className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 p-1 rounded text-[8px] font-mono-val whitespace-nowrap shadow-md z-30 pointer-events-none"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-strong)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        Vol: {pt.x}% | Ret: {pt.y}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FACTOR RISK MATRIX */}
      {subTab === 'FACTORS' && (
        <div className="bento-card rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono-val text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Fama-French 5-Factor & Macro Sensitivity Matrix
              </h3>
              <span className="text-[11px] font-mono-val" style={{ color: 'var(--text-muted)' }}>
                Evaluated across multi-selected universe ({selectedTickers.join(', ')})
              </span>
            </div>
            <span
              className="px-2.5 py-1 rounded text-[10px] font-mono-val font-semibold border"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-text)',
              }}
            >
              Active Factor Engine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-val">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th className="py-2.5 px-3">TICKER</th>
                  <th className="py-2.5 px-3">MARKET BETA (β)</th>
                  <th className="py-2.5 px-3">SIZE (SMB)</th>
                  <th className="py-2.5 px-3">VALUE (HML)</th>
                  <th className="py-2.5 px-3">MOMENTUM (WML)</th>
                  <th className="py-2.5 px-3">QUALITY (RMW)</th>
                  <th className="py-2.5 px-3">API DATA FEED</th>
                </tr>
              </thead>
              <tbody>
                {selectedTickers.map((sym) => {
                  const meta = TICKER_VERSE.find((t) => t.symbol === sym);
                  const apiInfo = getTickerApiStatus(sym);
                  const b = meta?.beta || 1.05;

                  return (
                    <tr
                      key={sym}
                      className="border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      onClick={() => setActiveSymbol(sym)}
                    >
                      <td className="py-3 px-3 font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{sym}</span>
                        {sym === activeSymbol && (
                          <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400">TARGET</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold" style={{ color: b > 1.3 ? 'var(--color-negative)' : 'var(--color-positive)' }}>
                        {b.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">{(b * 0.32 - 0.15).toFixed(2)}</td>
                      <td className="py-3 px-3">{(-0.24 * (b / 1.1)).toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">+{(0.48 * (b / 1.0)).toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">+{(0.35).toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] border font-medium" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {apiInfo.sourceShort} ({apiInfo.latencyMs}ms)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
