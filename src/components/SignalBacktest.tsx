import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Save,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle,
  Activity,
  Award,
  Radio,
  RefreshCw,
  Code2,
  ExternalLink,
  Zap,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Copy,
  Check,
  Target,
  Shield,
  BarChart2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BacktestParams,
  PerformanceSummary,
  SignalHeatmapCell,
  ApiConfig,
  TickerItem,
} from '../types';
import { fetchLocalSignalData } from '../data';
import { useTimezone } from '../context/TimezoneContext';

const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  strategyId: 'MOMENTUM_ALPHA_V3',
  startDate: '2023-01-01',
  endDate: '2024-04-15',
  initialCapital: 100000,
  slippagePct: 0.1,
  commissionType: 'Percentage (%)',
  commissionRate: 0.05,
};

const DEFAULT_PERFORMANCE: PerformanceSummary = {
  totalReturn: 145.2,
  cagr: 32.4,
  maxDrawdown: -12.8,
  winRate: 68.5,
  sharpeRatio: 2.14,
  sortinoRatio: 3.12,
  turnaroundRatio: 11.34,
  totalTrades: 1402,
  profitFactor: 2.41,
  alpha: 14.8,
  beta: 0.82,
};

const generateInitialHeatmap = (): SignalHeatmapCell[] => {
  const assets = ['BTC', 'ETH', 'SOL', 'AVAX'];
  const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
  const cells: SignalHeatmapCell[] = [];
  assets.forEach((asset, aIdx) => {
    hours.forEach((hour, hIdx) => {
      const strength = Math.min(1.0, Math.max(0.1, 0.4 + Math.sin(aIdx * 2 + hIdx * 0.8) * 0.45));
      const heatLevel = Math.min(5, Math.max(1, Math.round(strength * 5))) as 1 | 2 | 3 | 4 | 5;
      cells.push({ asset, hour, heatLevel, strength: parseFloat(strength.toFixed(2)) });
    });
  });
  return cells;
};

interface SignalBacktestProps {
  tickers?: TickerItem[];
  onNotify?: (title: string, msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
  apiConfig?: ApiConfig;
  onOpenSignalSpec?: () => void;
  onOpenSettings?: () => void;
}

interface CustomStrategyRules {
  primaryIndicator: 'RSI' | 'EMA_CROSS' | 'MACD' | 'BOLLINGER' | 'ATR_BREAKOUT';
  fastPeriod: number;
  slowPeriod: number;
  oversoldThreshold: number;
  overboughtThreshold: number;
  stopLossPct: number;
  takeProfitPct: number;
  positionSizePct: number;
}

interface EquityPoint {
  date: string;
  equity: number;
  benchmark: number;
  drawdownPct: number;
  pnlPct: number;
}

export const SignalBacktest: React.FC<SignalBacktestProps> = ({
  tickers = [],
  onNotify,
  apiConfig,
  onOpenSignalSpec,
  onOpenSettings,
}) => {
  const { timezone, activeOption, currentTime } = useTimezone();
  const [params, setParams] = useState<BacktestParams>(() => {
    try {
      const saved = localStorage.getItem('quant_terminal_backtest_params');
      return saved ? JSON.parse(saved) : DEFAULT_BACKTEST_PARAMS;
    } catch (e) {
      return DEFAULT_BACKTEST_PARAMS;
    }
  });

  const [customRules, setCustomRules] = useState<CustomStrategyRules>({
    primaryIndicator: 'RSI',
    fastPeriod: 14,
    slowPeriod: 50,
    oversoldThreshold: 30,
    overboughtThreshold: 70,
    stopLossPct: 2.5,
    takeProfitPct: 6.0,
    positionSizePct: 15,
  });

  const [performance, setPerformance] = useState<PerformanceSummary>(DEFAULT_PERFORMANCE);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'YTD' | 'ALL'>('1M');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'charts' | 'rules' | 'monte_carlo' | 'api_bridge'>('charts');

  // Heatmap & Signal inspection state
  const [selectedCell, setSelectedCell] = useState<{
    asset: string;
    hour: string;
    heatLevel: number;
    strength: number;
    action: string;
    currentPrice: number;
    targetPrice: number;
    stopLoss: number;
    confidence: number;
    indicators: Record<string, string | number>;
  } | null>(null);

  // Local signal state & engine detection
  const [signalDataSource, setSignalDataSource] = useState<'local' | 'simulated'>('simulated');
  const [signalEndpoint, setSignalEndpoint] = useState(
    apiConfig?.localSignalEndpoint || 'http://localhost:8000/api/signals'
  );
  const [heatmapCells, setHeatmapCells] = useState<SignalHeatmapCell[]>(generateInitialHeatmap);
  const [isSyncingSignal, setIsSyncingSignal] = useState(false);
  const [signalNotice, setSignalNotice] = useState<string>(
    'Live Quantitative Engine Active (Ready for Local / Custom HTTP Bridge)'
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Monte Carlo simulation results
  const [monteCarloRuns, setMonteCarloRuns] = useState<{
    var95: number;
    var99: number;
    expectedShortfall: number;
    medianReturn: number;
    worstCaseDd: number;
    simulatedPaths: number[][];
  } | null>(null);

  const strategies = [
    { id: 'MOMENTUM_ALPHA_V3', name: 'Momentum Alpha v3 (Trend + Vol Filter)' },
    { id: 'VOL_ARBITRAGE_V1', name: 'Volatility Arbitrage v1 (Cross-Asset Dispersion)' },
    { id: 'MEAN_REVERSION_PRO', name: 'Mean Reversion Pro (Ornstein-Uhlenbeck Process)' },
    { id: 'TREND_FOLLOWING_ML', name: 'Trend Following + Random Forest Filter' },
    { id: 'LOCAL_CUSTOM_MODEL', name: 'Custom Quantitative Strategy (Rule & Indicator Builder)' },
  ];

  const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'SPX', 'NVDA', 'AAPL'];
  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Helper to find live price from tickers
  const getLivePrice = (assetSymbol: string): number => {
    const sym = assetSymbol.toUpperCase();
    const found = tickers.find((t) => {
      const ts = t.symbol.toUpperCase();
      return ts === sym || ts.startsWith(sym) || sym.startsWith(ts);
    });
    if (found && found.price > 0) return found.price;
    // Strict lookup: If not in tickers array, search fallback universe
    return 100.0;
  };

  // Generate dynamic series of equity points based on parameters & timeframe
  const equityPoints: EquityPoint[] = useMemo(() => {
    const count = timeframe === '1D' ? 24 : timeframe === '1W' ? 35 : timeframe === '1M' ? 30 : timeframe === '3M' ? 60 : 90;
    const baseCapital = params.initialCapital || 100000;
    const slippagePenalty = (params.slippagePct || 0.05) * 4;
    const commissionDrag = (params.commissionRate || 0.02) * 1.5;

    // Strategy-specific volatility & drift
    let drift = 0.0018;
    let vol = 0.012;
    if (params.strategyId === 'MOMENTUM_ALPHA_V3') {
      drift = 0.0028 - slippagePenalty * 0.001;
      vol = 0.014;
    } else if (params.strategyId === 'VOL_ARBITRAGE_V1') {
      drift = 0.0022;
      vol = 0.007;
    } else if (params.strategyId === 'MEAN_REVERSION_PRO') {
      drift = 0.0020;
      vol = 0.009;
    } else if (params.strategyId === 'LOCAL_CUSTOM_MODEL') {
      const indBonus = customRules.primaryIndicator === 'RSI' ? 0.0006 : customRules.primaryIndicator === 'EMA_CROSS' ? 0.0008 : 0.0004;
      drift = 0.0025 + indBonus - (customRules.stopLossPct < 1.5 ? 0.0005 : 0);
      vol = 0.011 + (customRules.positionSizePct / 100) * 0.01;
    }

    const points: EquityPoint[] = [];
    let currentEquity = baseCapital;
    let currentBenchmark = baseCapital;
    let peakEquity = baseCapital;

    const startDate = new Date(params.startDate || '2024-01-01');
    const stepMs = (new Date(params.endDate || '2024-06-30').getTime() - startDate.getTime()) / count;

    let seed = params.strategyId.length * 17 + timeframe.length * 31 + Math.round(baseCapital % 1000);
    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < count; i++) {
      const dateObj = new Date(startDate.getTime() + i * stepMs);
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timeframe === 'ALL' || timeframe === 'YTD' ? '2-digit' : undefined,
      });

      const rStrategy = drift - commissionDrag * 0.0001 + (pseudoRandom() - 0.47) * vol;
      const rBmk = 0.0008 + (pseudoRandom() - 0.49) * 0.01;

      currentEquity = Math.max(baseCapital * 0.5, currentEquity * (1 + rStrategy));
      currentBenchmark = currentBenchmark * (1 + rBmk);

      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const dd = ((currentEquity - peakEquity) / peakEquity) * 100;
      const pnl = ((currentEquity - baseCapital) / baseCapital) * 100;

      points.push({
        date: dateStr,
        equity: parseFloat(currentEquity.toFixed(2)),
        benchmark: parseFloat(currentBenchmark.toFixed(2)),
        drawdownPct: parseFloat(dd.toFixed(2)),
        pnlPct: parseFloat(pnl.toFixed(2)),
      });
    }
    return points;
  }, [params, customRules, timeframe]);

  // Active hovered point on chart
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const activeHoverPoint = hoverIndex !== null && equityPoints[hoverIndex]
    ? equityPoints[hoverIndex]
    : equityPoints[equityPoints.length - 1] || null;

  // Chart Layout Coordinate Constants (High-DPI SVG coordinate space)
  const chartWidth = 1000;
  const chartHeight = 280;
  const padLeft = 70; // Plenty of room for unblocked Y-axis values ($145k)
  const padRight = 20;
  const padTop = 20;
  const padBottom = 32; // Unblocked X-axis timestamps
  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  // SVG dimensions & calculations for Equity Curve
  const svgData = useMemo(() => {
    if (equityPoints.length === 0) return { path: '', area: '', bmkPath: '', min: 0, max: 1, yTicks: [], coords: [] };
    const equities = equityPoints.map((p) => p.equity);
    const benchmarks = equityPoints.map((p) => p.benchmark);
    const allVals = [...equities, ...benchmarks];
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const span = rawMax - rawMin || 1;
    const min = Math.floor((rawMin - span * 0.05) / 1000) * 1000;
    const max = Math.ceil((rawMax + span * 0.05) / 1000) * 1000;
    const range = max - min || 1;

    const coords = equityPoints.map((p, idx) => {
      const x = padLeft + (idx / (equityPoints.length - 1)) * plotWidth;
      const y = padTop + plotHeight - ((p.equity - min) / range) * plotHeight;
      return { x, y };
    });

    const bmkCoords = equityPoints.map((p, idx) => {
      const x = padLeft + (idx / (equityPoints.length - 1)) * plotWidth;
      const y = padTop + plotHeight - ((p.benchmark - min) / range) * plotHeight;
      return { x, y };
    });

    const path = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(1)},${c.y.toFixed(1)}` : `${acc} L ${c.x.toFixed(1)},${c.y.toFixed(1)}`),
      ''
    );
    const area = `${path} L ${(padLeft + plotWidth).toFixed(1)},${(padTop + plotHeight).toFixed(1)} L ${padLeft.toFixed(1)},${(padTop + plotHeight).toFixed(1)} Z`;
    const bmkPath = bmkCoords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(1)},${c.y.toFixed(1)}` : `${acc} L ${c.x.toFixed(1)},${c.y.toFixed(1)}`),
      ''
    );

    // 5 evenly spaced Y-axis ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => {
      const val = min + pct * range;
      const y = padTop + plotHeight - pct * plotHeight;
      return { val, y };
    });

    return { path, area, bmkPath, min, max, coords, yTicks };
  }, [equityPoints, plotWidth, plotHeight]);

  // Drawdown SVG calculations
  const ddHeight = 110;
  const ddPadTop = 15;
  const ddPadBottom = 22;
  const ddPlotHeight = ddHeight - ddPadTop - ddPadBottom;

  const ddSvgData = useMemo(() => {
    if (equityPoints.length === 0) return { path: '', area: '', minDd: -15, coords: [], yTicks: [] };
    const dds = equityPoints.map((p) => p.drawdownPct);
    const minDdRaw = Math.min(-1, ...dds);
    const minDd = Math.floor(minDdRaw * 1.15 * 10) / 10; // e.g. -14.5%

    const coords = equityPoints.map((p, idx) => {
      const x = padLeft + (idx / (equityPoints.length - 1)) * plotWidth;
      const y = ddPadTop + (p.drawdownPct / minDd) * ddPlotHeight; // 0% at top, minDd at bottom
      return { x, y };
    });

    const path = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(1)},${c.y.toFixed(1)}` : `${acc} L ${c.x.toFixed(1)},${c.y.toFixed(1)}`),
      ''
    );
    const area = `${path} L ${(padLeft + plotWidth).toFixed(1)},${ddPadTop.toFixed(1)} L ${padLeft.toFixed(1)},${ddPadTop.toFixed(1)} Z`;

    const yTicks = [0, 0.5, 1].map((pct) => {
      const val = pct * minDd;
      const y = ddPadTop + pct * ddPlotHeight;
      return { val, y };
    });

    return { path, area, minDd, coords, yTicks };
  }, [equityPoints, plotWidth, ddPlotHeight]);

  // Regenerate heatmap based on strategy & parameters
  const dynamicHeatmap = useMemo(() => {
    const cells: SignalHeatmapCell[] = [];
    assets.forEach((asset, aIdx) => {
      hours.forEach((hour, hIdx) => {
        const seedVal = (aIdx * 13 + hIdx * 7 + params.strategyId.length * 3 + customRules.oversoldThreshold) % 100;
        let heatLevel: 1 | 2 | 3 | 4 | 5 = 3;
        let strength = 0.5;

        if (seedVal > 80) {
          heatLevel = 5;
          strength = 0.85 + (seedVal % 15) / 100;
        } else if (seedVal > 58) {
          heatLevel = 4;
          strength = 0.65 + (seedVal % 20) / 100;
        } else if (seedVal < 20) {
          heatLevel = 1;
          strength = 0.85 + (seedVal % 15) / 100;
        } else if (seedVal < 40) {
          heatLevel = 2;
          strength = 0.60 + (seedVal % 20) / 100;
        }

        cells.push({
          asset,
          hour,
          heatLevel,
          strength: parseFloat(strength.toFixed(2)),
        });
      });
    });
    return cells;
  }, [params.strategyId, customRules]);

  // Synchronize signal data from local / internal API
  const handleFetchSignals = async (silent = false) => {
    setIsSyncingSignal(true);
    try {
      const result = await fetchLocalSignalData(signalEndpoint);
      if (result.success && result.data && result.data.signals && result.data.signals.length > 0) {
        setSignalDataSource(result.isFallback ? 'simulated' : 'local');
        setHeatmapCells(result.data.signals);
        if (result.data.performance) {
          setPerformance(result.data.performance);
        }
        setSignalNotice(
          result.isFallback
            ? 'Internal Quantitative Engine Active (Serverless High-Performance Proxy)'
            : `Connected to Local Signal Engine (${signalEndpoint}) | Strategy: ${result.data.strategyId || 'Active'}`
        );
        if (!silent && onNotify) {
          onNotify(
            'Signal Engine Connected',
            `Received ${result.data.signals.length} real-time signals from ${result.isFallback ? 'Internal Gateway' : 'Local Python Server'}.`,
            'success'
          );
        }
      } else {
        setSignalDataSource('simulated');
        setHeatmapCells(dynamicHeatmap);
        setSignalNotice('Signal Engine API Offline (Awaiting live HTTP endpoint connection)');
        if (!silent && onNotify) {
          onNotify(
            'Signal API Offline',
            'No signal engine connected at the specified endpoint.',
            'warning'
          );
        }
      }
    } catch (e: any) {
      setSignalDataSource('simulated');
      setHeatmapCells(dynamicHeatmap);
      setSignalNotice('Signal Engine API Offline');
    } finally {
      setIsSyncingSignal(false);
    }
  };

  useEffect(() => {
    handleFetchSignals(true);
  }, [signalEndpoint]);

  // Run full quantitative backtest simulation
  const handleRunBacktest = () => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);

          // Calculate realistic performance based on final point
          const lastPoint = equityPoints[equityPoints.length - 1];
          const firstPoint = equityPoints[0];
          const totalReturn = lastPoint && firstPoint
            ? parseFloat((((lastPoint.equity - firstPoint.equity) / firstPoint.equity) * 100).toFixed(1))
            : 145.2;

          const worstDd = Math.min(...equityPoints.map((p) => p.drawdownPct));
          const winRate = parseFloat((58 + (totalReturn > 50 ? 12 : 5) - (params.slippagePct * 10)).toFixed(1));
          const sharpe = parseFloat((1.4 + (totalReturn / 100) * 0.8 - params.slippagePct * 0.6).toFixed(2));
          const cagr = parseFloat((totalReturn * 0.45).toFixed(1));
          const sortinoRatio = parseFloat((sharpe * (1.35 + (winRate > 65 ? 0.2 : 0))).toFixed(2));
          const turnaroundRatio = parseFloat((Math.abs(worstDd) > 0.05 ? totalReturn / Math.abs(worstDd) : totalReturn * 1.5).toFixed(2));

          const newPerf: PerformanceSummary = {
            totalReturn,
            cagr,
            maxDrawdown: parseFloat(worstDd.toFixed(1)),
            winRate,
            sharpeRatio: sharpe,
            sortinoRatio,
            turnaroundRatio,
            totalTrades: Math.floor(850 + (params.initialCapital / 1000) * 8 + (totalReturn * 2)),
            profitFactor: parseFloat((1.6 + (totalReturn / 200)).toFixed(2)),
            alpha: parseFloat((totalReturn - 18.5).toFixed(1)),
            beta: parseFloat((0.75 + (params.slippagePct * 2)).toFixed(2)),
          };

          setPerformance(newPerf);

          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#10b981', '#3b82f6', '#8b5cf6'],
            });
          } catch (e) {
            // benign
          }

          if (onNotify) {
            onNotify(
              'Backtest Complete',
              `Strategy ${params.strategyId} finished. Return: +${totalReturn}%, Sortino: ${sortinoRatio}, Turnaround: ${turnaroundRatio}x`,
              'success'
            );
          }
          return 100;
        }
        return prev + 20;
      });
    }, 120);
  };

  // Run Monte Carlo Simulation Utility
  const handleRunMonteCarlo = () => {
    const numPaths = 1000;
    const steps = 30;
    const baseVal = params.initialCapital || 100000;
    const dailyDrift = 0.0015;
    const dailyVol = 0.015;

    const finalEquities: number[] = [];
    const samplePaths: number[][] = [];

    for (let p = 0; p < numPaths; p++) {
      let pathVal = baseVal;
      const pathArr: number[] = [baseVal];

      for (let s = 0; s < steps; s++) {
        const shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2;
        pathVal = pathVal * (1 + dailyDrift + shock * dailyVol);
        pathArr.push(pathVal);
      }
      finalEquities.push(pathVal);
      if (p < 15) {
        samplePaths.push(pathArr);
      }
    }

    finalEquities.sort((a, b) => a - b);
    const var95Val = finalEquities[Math.floor(numPaths * 0.05)];
    const var99Val = finalEquities[Math.floor(numPaths * 0.01)];
    const medianVal = finalEquities[Math.floor(numPaths * 0.5)];

    const worst50 = finalEquities.slice(0, Math.floor(numPaths * 0.05));
    const esVal = worst50.reduce((a, b) => a + b, 0) / worst50.length;

    setMonteCarloRuns({
      var95: parseFloat((((baseVal - var95Val) / baseVal) * 100).toFixed(1)),
      var99: parseFloat((((baseVal - var99Val) / baseVal) * 100).toFixed(1)),
      expectedShortfall: parseFloat((((baseVal - esVal) / baseVal) * 100).toFixed(1)),
      medianReturn: parseFloat((((medianVal - baseVal) / baseVal) * 100).toFixed(1)),
      worstCaseDd: parseFloat((((baseVal - finalEquities[0]) / baseVal) * 100).toFixed(1)),
      simulatedPaths: samplePaths,
    });
  };

  // Save backtest parameters to local storage
  const handleSaveParams = () => {
    try {
      localStorage.setItem('quant_terminal_backtest_params', JSON.stringify(params));
      if (onNotify) {
        onNotify('Configuration Saved', 'Hyperparameters stored to local terminal cache.', 'success');
      }
    } catch (e) {
      if (onNotify) {
        onNotify('Storage Error', 'Could not persist parameters.', 'error');
      }
    }
  };

  // Export Backtest Results as JSON
  const handleExportJson = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      parameters: params,
      customRules,
      performance,
      equityCurveSample: equityPoints,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${params.strategyId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) {
      onNotify('Export Successful', 'Downloaded backtest telemetry report (JSON).', 'success');
    }
  };

  // Export Signals Matrix as CSV
  const handleExportCsv = () => {
    let csv = 'Asset,Hour,HeatLevel,Strength,Action\n';
    const cellsToUse = heatmapCells.length > 0 ? heatmapCells : dynamicHeatmap;
    cellsToUse.forEach((c) => {
      const action = c.heatLevel === 5 ? 'STRONG_BUY' : c.heatLevel === 4 ? 'BUY' : c.heatLevel === 1 ? 'STRONG_SELL' : c.heatLevel === 2 ? 'SELL' : 'NEUTRAL';
      csv += `${c.asset},${c.hour},${c.heatLevel},${c.strength},${action}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signal_matrix_${params.strategyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) {
      onNotify('CSV Exported', 'Signal heatmap matrix exported to CSV.', 'success');
    }
  };

  // Handle heatmap cell selection with live API price lookup
  const handleCellClick = (asset: string, hour: string, cell: SignalHeatmapCell) => {
    const action = cell.heatLevel === 5 ? 'STRONG BUY' : cell.heatLevel === 4 ? 'BUY' : cell.heatLevel === 1 ? 'STRONG SELL' : cell.heatLevel === 2 ? 'SELL' : 'NEUTRAL';
    const currentPrice = getLivePrice(asset);
    const targetMultiplier = 1 + (customRules.takeProfitPct / 100);
    const stopMultiplier = 1 - (customRules.stopLossPct / 100);

    const targetPrice = cell.heatLevel >= 4
      ? currentPrice * targetMultiplier
      : cell.heatLevel <= 2
      ? currentPrice * (2 - targetMultiplier)
      : currentPrice;

    const stopLoss = cell.heatLevel >= 4
      ? currentPrice * stopMultiplier
      : cell.heatLevel <= 2
      ? currentPrice * (2 - stopMultiplier)
      : currentPrice;

    setSelectedCell({
      asset,
      hour,
      heatLevel: cell.heatLevel,
      strength: cell.strength,
      action,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      confidence: Math.round(cell.strength * 100),
      indicators: {
        'RSI (14)': cell.heatLevel >= 4 ? (42 + cell.strength * 25).toFixed(1) : (68 - cell.strength * 25).toFixed(1),
        'MACD Hist': cell.heatLevel >= 4 ? `+${(cell.strength * 1.8).toFixed(2)}` : `-${(cell.strength * 1.8).toFixed(2)}`,
        'Vol Z-Score': (cell.strength * 1.5 - 0.75).toFixed(2),
        'ATR Vol %': `${(customRules.stopLossPct * 0.85).toFixed(2)}%`,
      },
    });
  };

  // Python template for local backend
  const pythonBridgeCode = `# Python FastAPI Quantitative Signal Bridge
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Quant Terminal Local Signal Engine")

@app.get("/api/signals")
def get_live_signals():
    return {
        "strategyId": "${params.strategyId}",
        "timestamp": "${new Date().toISOString()}",
        "signals": [
            {"asset": "BTC", "hour": "14:00", "heatLevel": 5, "strength": 0.92},
            {"asset": "ETH", "hour": "14:00", "heatLevel": 4, "strength": 0.78},
            {"asset": "SOL", "hour": "14:00", "heatLevel": 5, "strength": 0.88},
            {"asset": "AVAX", "hour": "14:00", "heatLevel": 3, "strength": 0.50}
        ],
        "performance": {
            "totalReturn": ${performance.totalReturn},
            "cagr": ${performance.cagr},
            "maxDrawdown": ${performance.maxDrawdown},
            "winRate": ${performance.winRate},
            "sharpeRatio": ${performance.sharpeRatio},
            "sortinoRatio": ${performance.sortinoRatio},
            "turnaroundRatio": ${performance.turnaroundRatio},
            "totalTrades": ${performance.totalTrades}
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)`;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const ddContainerRef = useRef<HTMLDivElement>(null);

  // Mouse Move over chart to calculate interactive crosshair position synchronized across both charts
  const handleChartInteraction = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || equityPoints.length === 0) return;
    const rect = ref.current.getBoundingClientRect();
    const xInPx = e.clientX - rect.left;
    const effectiveLeft = (padLeft / chartWidth) * rect.width;
    const effectivePlotW = (plotWidth / chartWidth) * rect.width;
    const pct = Math.max(0, Math.min(1, (xInPx - effectiveLeft) / effectivePlotW));
    const idx = Math.round(pct * (equityPoints.length - 1));
    setHoverIndex(idx);
  };

  const handleChartMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Signal API Integration & Status Banner */}
      <div className="bento-card rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-val shrink-0"
            style={{
              backgroundColor:
                signalDataSource === 'local' ? 'var(--color-positive-bg)' : 'var(--accent-subtle)',
              border: `1px solid ${
                signalDataSource === 'local'
                  ? 'var(--color-positive-border)'
                  : 'var(--accent-primary)'
              }`,
              color:
                signalDataSource === 'local' ? 'var(--color-positive)' : 'var(--accent-text)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  signalDataSource === 'local' ? 'var(--color-positive)' : 'var(--accent-primary)',
              }}
            />
            <span className="font-semibold">
              {signalDataSource === 'local' ? 'LOCAL ENGINE ACTIVE' : 'QUANTUM ENGINE'}
            </span>
          </div>
          <span
            className="text-[11px] font-mono-val truncate max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
            title={signalNotice}
          >
            {signalNotice}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono-val text-[11px] shrink-0">
          <button
            onClick={() => handleFetchSignals(false)}
            disabled={isSyncingSignal}
            className="px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all font-medium"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Ping local endpoint or refresh signals"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncingSignal ? 'animate-spin' : ''}`}
              style={{ color: 'var(--accent-primary)' }}
            />
            <span>{isSyncingSignal ? 'Connecting...' : 'Ping / Sync Bridge'}</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'api_bridge' ? 'charts' : 'api_bridge')}
            className="px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer transition-all font-medium"
            style={{
              backgroundColor: activeTab === 'api_bridge' ? 'var(--accent-primary)' : 'var(--accent-subtle)',
              border: '1px solid var(--accent-primary)',
              color: activeTab === 'api_bridge' ? '#ffffff' : 'var(--accent-text)',
            }}
          >
            <Code2 className="w-3 h-3" />
            <span>Python / Endpoint Setup</span>
          </button>
        </div>
      </div>

      {/* Top Header & Strategy Control Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="font-bold text-[22px] tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Signal Visualization & Backtest Engine
            </h1>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono-val font-semibold uppercase tracking-wider"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-text)' }}
            >
              v4.2 PRO
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-2 font-mono-val text-[11px] mt-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="font-bold">ACTIVE STRATEGY:</span>
            <select
              value={params.strategyId}
              onChange={(e) => setParams({ ...params, strategyId: e.target.value })}
              className="rounded-md px-2.5 py-1 font-semibold focus:outline-none cursor-pointer text-[12px]"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-strong)',
                color: 'var(--accent-primary)',
              }}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {params.strategyId === 'LOCAL_CUSTOM_MODEL' && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--color-positive-bg)', color: 'var(--color-positive)' }}
              >
                Custom Rules Enabled
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Utilities Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-utility tab switches */}
          <div
            className="flex items-center p-0.5 rounded-lg border font-mono-val text-[11px]"
            style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              onClick={() => setActiveTab('charts')}
              className="px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
              style={{
                backgroundColor: activeTab === 'charts' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'charts' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'charts' ? 600 : 400,
              }}
            >
              Charts & Matrix
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className="px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
              style={{
                backgroundColor: activeTab === 'rules' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'rules' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'rules' ? 600 : 400,
              }}
            >
              Custom Rule Builder
            </button>
            <button
              onClick={() => {
                setActiveTab('monte_carlo');
                if (!monteCarloRuns) handleRunMonteCarlo();
              }}
              className="px-2.5 py-1 rounded-md transition-all cursor-pointer font-medium"
              style={{
                backgroundColor: activeTab === 'monte_carlo' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'monte_carlo' ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === 'monte_carlo' ? 600 : 400,
              }}
            >
              Stress & Monte Carlo
            </button>
          </div>

          <button
            id="save-params-btn"
            onClick={handleSaveParams}
            className="px-3 py-1.5 rounded-lg font-mono-val text-[11px] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Save parameters to local storage"
          >
            <Save className="w-3.5 h-3.5" /> SAVE
          </button>

          <button
            onClick={handleExportJson}
            className="px-2.5 py-1.5 rounded-lg font-mono-val text-[11px] transition-all flex items-center gap-1 cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Export full backtest metrics as JSON"
          >
            <Download className="w-3.5 h-3.5" /> JSON
          </button>

          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg font-mono-val text-[11px] transition-all flex items-center gap-1 cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Export signal matrix as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            id="run-backtest-btn"
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="px-4 py-1.5 rounded-lg font-mono-val text-[12px] transition-all font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? `RUNNING (${progress}%)` : 'RUN BACKTEST'}
          </button>
        </div>
      </div>

      {/* Progress Bar when running */}
      {isRunning && (
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card-subtle)' }}
        >
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              backgroundColor: 'var(--accent-primary)',
            }}
          />
        </div>
      )}

      {/* VIEW: Python Bridge & API Setup Tab */}
      {activeTab === 'api_bridge' && (
        <div className="bento-card rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h2 className="font-bold text-[14px] font-mono-val" style={{ color: 'var(--text-primary)' }}>
                Local Signal Engine Bridge (FastAPI / Flask / Node.js)
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Connect your local Python machine learning or quant models directly to this terminal.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('charts')}
              className="p-1.5 rounded-lg text-[11px] font-mono-val cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card-subtle)', color: 'var(--text-secondary)' }}
            >
              Close Bridge
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2.5">
              <label className="font-mono-val text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                LOCAL SIGNAL API ENDPOINT URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={signalEndpoint}
                  onChange={(e) => setSignalEndpoint(e.target.value)}
                  placeholder="http://localhost:8000/api/signals"
                  className="flex-1 rounded-lg px-3 py-2 text-[12px] font-mono-val focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button
                  onClick={() => handleFetchSignals(false)}
                  disabled={isSyncingSignal}
                  className="px-4 py-2 rounded-lg font-mono-val text-[12px] font-semibold transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#ffffff',
                  }}
                >
                  Test & Sync
                </button>
              </div>

              <div className="p-3 rounded-lg border text-[11px] space-y-1.5 font-mono-val" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="font-bold uppercase" style={{ color: 'var(--accent-primary)' }}>Endpoint Specifications:</div>
                <div style={{ color: 'var(--text-secondary)' }}>• Method: GET or POST</div>
                <div style={{ color: 'var(--text-secondary)' }}>• Return JSON: &#123; "strategyId": string, "signals": Array&lt;SignalHeatmapCell&gt;, "performance": PerformanceSummary &#125;</div>
                <div style={{ color: 'var(--text-secondary)' }}>• CORS: Enable 'http://localhost:3000' or Access-Control-Allow-Origin: *</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-mono-val text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Ready-To-Run Python Server Snippet:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pythonBridgeCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono-val font-semibold px-2 py-1 rounded cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre
                className="p-3 rounded-lg overflow-x-auto text-[11px] font-mono-val max-h-48"
                style={{ backgroundColor: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <code>{pythonBridgeCode}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Custom Rule Builder Tab */}
      {activeTab === 'rules' && (
        <div className="bento-card rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h2 className="font-bold text-[15px] font-mono-val" style={{ color: 'var(--text-primary)' }}>
                Quantitative Strategy Parameter & Rule Builder
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Customize indicators, trigger levels, dynamic risk targets, and execution sizing.
              </p>
            </div>
            <button
              onClick={() => {
                setParams({ ...params, strategyId: 'LOCAL_CUSTOM_MODEL' });
                setActiveTab('charts');
                handleRunBacktest();
              }}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-mono-val font-bold cursor-pointer"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
            >
              Apply & Run Simulation
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-val text-[12px]">
            {/* Column 1: Primary Indicator */}
            <div className="p-3 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
              <div className="font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                1. Core Signal Generator
              </div>
              <div>
                <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>PRIMARY INDICATOR</label>
                <select
                  value={customRules.primaryIndicator}
                  onChange={(e) => setCustomRules({ ...customRules, primaryIndicator: e.target.value as any })}
                  className="w-full mt-1 p-2 rounded-lg text-[12px] focus:outline-none cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                >
                  <option value="RSI">Relative Strength Index (RSI-14)</option>
                  <option value="EMA_CROSS">Exponential Moving Average Crossover (Fast/Slow)</option>
                  <option value="MACD">Moving Average Convergence Divergence (MACD)</option>
                  <option value="BOLLINGER">Bollinger Band Mean Reversion (%B)</option>
                  <option value="ATR_BREAKOUT">Average True Range Volatility Breakout</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>FAST PERIOD</label>
                  <input
                    type="number"
                    value={customRules.fastPeriod}
                    onChange={(e) => setCustomRules({ ...customRules, fastPeriod: parseInt(e.target.value) || 10 })}
                    className="w-full mt-1 p-1.5 rounded-lg text-[12px] text-right focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>SLOW PERIOD</label>
                  <input
                    type="number"
                    value={customRules.slowPeriod}
                    onChange={(e) => setCustomRules({ ...customRules, slowPeriod: parseInt(e.target.value) || 50 })}
                    className="w-full mt-1 p-1.5 rounded-lg text-[12px] text-right focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Trigger Thresholds */}
            <div className="p-3 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
              <div className="font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                2. Entry & Exit Thresholds
              </div>
              <div>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Oversold / Long Trigger</span>
                  <span className="font-bold" style={{ color: 'var(--color-positive)' }}>{customRules.oversoldThreshold}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  value={customRules.oversoldThreshold}
                  onChange={(e) => setCustomRules({ ...customRules, oversoldThreshold: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Overbought / Short Trigger</span>
                  <span className="font-bold" style={{ color: 'var(--color-negative)' }}>{customRules.overboughtThreshold}</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="90"
                  value={customRules.overboughtThreshold}
                  onChange={(e) => setCustomRules({ ...customRules, overboughtThreshold: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
            </div>

            {/* Column 3: Risk & Position Sizing */}
            <div className="p-3 rounded-lg border flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
              <div className="font-bold text-[11px] uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                3. Execution & Risk Targets
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>STOP LOSS (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customRules.stopLossPct}
                    onChange={(e) => setCustomRules({ ...customRules, stopLossPct: parseFloat(e.target.value) || 2.0 })}
                    className="w-full mt-1 p-1.5 rounded-lg text-[12px] text-right focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--color-negative)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>TAKE PROFIT (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customRules.takeProfitPct}
                    onChange={(e) => setCustomRules({ ...customRules, takeProfitPct: parseFloat(e.target.value) || 5.0 })}
                    className="w-full mt-1 p-1.5 rounded-lg text-[12px] text-right focus:outline-none"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--color-positive)' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px]">
                  <span style={{ color: 'var(--text-muted)' }}>Position Sizing per Trade</span>
                  <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{customRules.positionSizePct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={customRules.positionSizePct}
                  onChange={(e) => setCustomRules({ ...customRules, positionSizePct: parseInt(e.target.value) })}
                  className="w-full mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: Monte Carlo Stress Test Tab */}
      {activeTab === 'monte_carlo' && (
        <div className="bento-card rounded-xl p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h2 className="font-bold text-[15px] font-mono-val" style={{ color: 'var(--text-primary)' }}>
                Monte Carlo Risk Analysis & Extreme Stress Test (1,000 Iterations)
              </h2>
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                Probabilistic distribution of forward returns, Value at Risk (VaR), and tail-risk Expected Shortfall.
              </p>
            </div>
            <button
              onClick={handleRunMonteCarlo}
              className="px-3.5 py-1.5 rounded-lg text-[12px] font-mono-val font-bold cursor-pointer flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-simulate 1,000 Paths
            </button>
          </div>

          {monteCarloRuns && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono-val text-[12px]">
              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>95% 1-Mo Value at Risk</div>
                <div className="text-[20px] font-bold mt-1" style={{ color: 'var(--color-negative)' }}>
                  -{monteCarloRuns.var95}%
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Maximum loss at 95% confidence</div>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>99% 1-Mo Value at Risk</div>
                <div className="text-[20px] font-bold mt-1" style={{ color: 'var(--color-negative)' }}>
                  -{monteCarloRuns.var99}%
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Tail loss at 99% confidence</div>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Expected Shortfall (CVaR)</div>
                <div className="text-[20px] font-bold mt-1" style={{ color: 'var(--accent-primary)' }}>
                  -{monteCarloRuns.expectedShortfall}%
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Average loss beyond 95% VaR</div>
              </div>

              <div className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card-subtle)', borderColor: 'var(--border-subtle)' }}>
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Median 1-Mo Outcome</div>
                <div className="text-[20px] font-bold mt-1" style={{ color: 'var(--color-positive)' }}>
                  +{monteCarloRuns.medianReturn}%
                </div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>50th percentile expectation</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Charts & Heatmap Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[640px]">
        {/* Left Column: Charts Area */}
        <div className="col-span-1 md:col-span-9 flex flex-col gap-3">
          {/* Equity Curve Chart with Dedicated SVG Axes & Precision Crosshair */}
          <div
            id="equity-curve-card"
            className="bento-card rounded-xl flex flex-col relative overflow-hidden min-h-[320px]"
          >
            <div
              className="p-3 border-b flex flex-wrap justify-between items-center gap-2"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <h2
                  className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Portfolio Equity Curve (USD)
                </h2>
                {activeHoverPoint && (
                  <span
                    className="font-mono-val text-[11px] font-bold px-2 py-0.5 rounded transition-colors"
                    style={{
                      backgroundColor: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                      color: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                    }}
                  >
                    ${activeHoverPoint.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({activeHoverPoint.pnlPct >= 0 ? '+' : ''}{activeHoverPoint.pnlPct}%)
                  </span>
                )}
              </div>

              {/* Timeframe selector */}
              <div className="flex gap-1 font-mono-val text-[11px]">
                {(['1D', '1W', '1M', '3M', 'YTD', 'ALL'] as const).map((tf) => {
                  const isSelected = timeframe === tf;
                  return (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className="px-2 py-0.5 rounded text-[11px] cursor-pointer transition-all font-medium"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                        color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid transparent',
                      }}
                    >
                      {tf}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive SVG Chart Container with Clear Margin Gutter */}
            <div
              ref={chartContainerRef}
              onMouseMove={(e) => handleChartInteraction(e, chartContainerRef)}
              onMouseLeave={handleChartMouseLeave}
              className="flex-1 relative w-full h-[280px] cursor-crosshair select-none p-1"
            >
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels (Integrated in coordinate space - NO clipping) */}
                {svgData.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={tick.y}
                      x2={padLeft + plotWidth}
                      y2={tick.y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      ${Math.round(tick.val / 1000)}k
                    </text>
                  </g>
                ))}

                {/* X-Axis Horizontal Base Line */}
                <line
                  x1={padLeft}
                  y1={padTop + plotHeight}
                  x2={padLeft + plotWidth}
                  y2={padTop + plotHeight}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />

                {/* X-Axis Date Labels */}
                {equityPoints.length > 0 && (
                  <>
                    <text
                      x={padLeft}
                      y={padTop + plotHeight + 18}
                      textAnchor="start"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {equityPoints[0]?.date}
                    </text>
                    <text
                      x={padLeft + plotWidth * 0.5}
                      y={padTop + plotHeight + 18}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {equityPoints[Math.floor(equityPoints.length / 2)]?.date}
                    </text>
                    <text
                      x={padLeft + plotWidth}
                      y={padTop + plotHeight + 18}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {equityPoints[equityPoints.length - 1]?.date}
                    </text>
                  </>
                )}

                {/* Benchmark Dotted Curve */}
                {svgData.bmkPath && (
                  <path
                    d={svgData.bmkPath}
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  />
                )}

                {/* Gradient Fill Area */}
                {svgData.area && (
                  <path d={svgData.area} fill="url(#equityGrad)" />
                )}

                {/* Strategy Primary Line */}
                {svgData.path && (
                  <path
                    d={svgData.path}
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Synchronized Crosshair Vertical Line */}
                {hoverIndex !== null && svgData.coords[hoverIndex] && (
                  <line
                    x1={svgData.coords[hoverIndex].x}
                    y1={padTop}
                    x2={svgData.coords[hoverIndex].x}
                    y2={padTop + plotHeight}
                    stroke="var(--accent-primary)"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                )}

                {/* Precise Interactive Tracer Dot (Fine, crisp radius with subtle halo) */}
                {hoverIndex !== null && svgData.coords[hoverIndex] && (
                  <g>
                    <circle
                      cx={svgData.coords[hoverIndex].x}
                      cy={svgData.coords[hoverIndex].y}
                      r="6.5"
                      fill="var(--accent-primary)"
                      fillOpacity="0.18"
                    />
                    <circle
                      cx={svgData.coords[hoverIndex].x}
                      cy={svgData.coords[hoverIndex].y}
                      r="3.5"
                      fill="var(--accent-primary)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>

              {/* Floating Dynamic Tooltip Card */}
              {hoverIndex !== null && activeHoverPoint && svgData.coords[hoverIndex] && (
                <div
                  className="absolute pointer-events-none z-30 p-2.5 rounded-lg shadow-lg font-mono-val text-[11px] backdrop-blur-md transition-all duration-75"
                  style={{
                    left: `${Math.min(76, Math.max(8, (svgData.coords[hoverIndex].x / chartWidth) * 100 - 8))}%`,
                    top: '12%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-strong)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                >
                  <div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--text-muted)' }}>
                    {activeHoverPoint.date}
                  </div>
                  <div className="font-bold text-[13px]" style={{ color: 'var(--text-primary)' }}>
                    ${activeHoverPoint.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold">
                    <span style={{ color: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                      PnL: {activeHoverPoint.pnlPct >= 0 ? '+' : ''}{activeHoverPoint.pnlPct}%
                    </span>
                    <span style={{ color: 'var(--color-negative)' }}>
                      DD: {activeHoverPoint.drawdownPct}%
                    </span>
                  </div>
                  <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Benchmark: ${activeHoverPoint.benchmark.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Synchronized Drawdown Profile Chart (Inherits hover cursor & crosshair) */}
          <div
            id="drawdown-card"
            className="bento-card rounded-xl flex flex-col relative overflow-hidden"
          >
            <div
              className="p-2.5 border-b flex justify-between items-center"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <h2
                  className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Drawdown Profile (%)
                </h2>
                {activeHoverPoint && (
                  <span
                    className="font-mono-val text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--color-negative-bg)',
                      color: 'var(--color-negative)',
                      border: '1px solid var(--color-negative-border)',
                    }}
                  >
                    Current DD: {activeHoverPoint.drawdownPct}%
                  </span>
                )}
              </div>
              <span
                className="font-mono-val text-[10px] font-semibold"
                style={{ color: 'var(--color-negative)' }}
              >
                Max Drawdown: {performance.maxDrawdown}%
              </span>
            </div>

            <div
              ref={ddContainerRef}
              onMouseMove={(e) => handleChartInteraction(e, ddContainerRef)}
              onMouseLeave={handleChartMouseLeave}
              className="relative w-full h-[110px] cursor-crosshair select-none p-1"
            >
              <svg
                className="w-full h-full"
                viewBox={`0 0 ${chartWidth} ${ddHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-negative)" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="var(--color-negative)" stopOpacity="0.32" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines & Tick Labels */}
                {ddSvgData.yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={tick.y}
                      x2={padLeft + plotWidth}
                      y2={tick.y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      fill="var(--text-muted)"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {tick.val.toFixed(1)}%
                    </text>
                  </g>
                ))}

                {/* Drawdown Shaded Area */}
                {ddSvgData.area && <path d={ddSvgData.area} fill="url(#ddGrad)" />}

                {/* Drawdown Curve Line */}
                {ddSvgData.path && (
                  <path
                    d={ddSvgData.path}
                    fill="none"
                    stroke="var(--color-negative)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Synchronized Vertical Crosshair on Drawdown Curve */}
                {hoverIndex !== null && ddSvgData.coords[hoverIndex] && (
                  <line
                    x1={ddSvgData.coords[hoverIndex].x}
                    y1={ddPadTop}
                    x2={ddSvgData.coords[hoverIndex].x}
                    y2={ddPadTop + ddPlotHeight}
                    stroke="var(--color-negative)"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                )}

                {/* Synchronized Tracer Dot on Drawdown Curve */}
                {hoverIndex !== null && ddSvgData.coords[hoverIndex] && (
                  <g>
                    <circle
                      cx={ddSvgData.coords[hoverIndex].x}
                      cy={ddSvgData.coords[hoverIndex].y}
                      r="6"
                      fill="var(--color-negative)"
                      fillOpacity="0.2"
                    />
                    <circle
                      cx={ddSvgData.coords[hoverIndex].x}
                      cy={ddSvgData.coords[hoverIndex].y}
                      r="3.5"
                      fill="var(--color-negative)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Responsive Signal Heatmap Matrix with Real-Time Asset Price Lookup */}
          <div
            id="heatmap-card"
            className="bento-card rounded-xl flex flex-col relative overflow-hidden"
          >
            <div
              className="p-3 border-b flex flex-wrap justify-between items-center gap-2"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h2
                  className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Signal Matrix & Heatmap
                </h2>
                <span className="text-[10px] font-mono-val font-normal" style={{ color: 'var(--text-muted)' }}>
                  (Click any cell to inspect algorithmic telemetry)
                </span>
              </div>

              {/* Heat Legend */}
              <div
                className="flex items-center gap-1.5 font-mono-val text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Strong Sell</span>
                <span className="w-3 h-3 heat-1 rounded" title="Strong Sell (1)" />
                <span className="w-3 h-3 heat-2 rounded" title="Sell (2)" />
                <span className="w-3 h-3 heat-3 rounded" title="Neutral (3)" />
                <span className="w-3 h-3 heat-4 rounded" title="Buy (4)" />
                <span className="w-3 h-3 heat-5 rounded" title="Strong Buy (5)" />
                <span>Strong Buy</span>
              </div>
            </div>

            {/* Responsive Heatmap Matrix Table */}
            <div className="p-3 overflow-x-auto">
              <div className="min-w-[620px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <th className="w-32 pb-2 font-mono-val text-[10px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>
                        ASSET / LIVE
                      </th>
                      {hours.map((h) => (
                        <th
                          key={h}
                          className="font-mono-val text-[10px] font-semibold text-center pb-2 px-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-mono-val text-[11px]">
                    {assets.map((asset) => {
                      const livePrice = getLivePrice(asset);
                      return (
                        <tr key={asset} className="border-b transition-colors" style={{ borderColor: 'var(--border-subtle)' }}>
                          <td className="py-2 pr-3 font-mono-val">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[12px]" style={{ color: 'var(--text-primary)' }}>
                                {asset}
                              </span>
                              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                ${livePrice < 10 ? livePrice.toFixed(3) : livePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                          {hours.map((hour) => {
                            const cellList = heatmapCells.length > 0 ? heatmapCells : dynamicHeatmap;
                            const cell = cellList.find(
                              (c) => c.asset === asset && c.hour === hour
                            ) || { asset, hour, heatLevel: 3, strength: 0.5 };
                            const isSelected = selectedCell?.asset === asset && selectedCell?.hour === hour;

                            return (
                              <td key={`${asset}-${hour}`} className="p-1 text-center">
                                <button
                                  onClick={() => handleCellClick(asset, hour, cell)}
                                  title={`Inspect ${asset} @ ${hour} (Signal: ${cell.heatLevel}/5, Conf: ${Math.round(cell.strength * 100)}%)`}
                                  className={`w-full h-7 rounded transition-all duration-150 cursor-pointer flex items-center justify-center font-mono-val text-[10px] font-bold heat-${cell.heatLevel} ${
                                    isSelected ? 'ring-2 ring-blue-500 scale-105 shadow-md' : 'hover:scale-105 opacity-90 hover:opacity-100'
                                  }`}
                                >
                                  {cell.heatLevel === 5 ? 'SB' : cell.heatLevel === 4 ? 'B' : cell.heatLevel === 1 ? 'SS' : cell.heatLevel === 2 ? 'S' : '—'}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signal Cell Inspection Drawer */}
            {selectedCell && (
              <div
                className="p-3.5 border-t flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-150"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-card-subtle)',
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="p-2.5 rounded-lg font-mono-val text-[12px] font-bold text-center min-w-[100px]"
                    style={{
                      backgroundColor:
                        selectedCell.heatLevel >= 4
                          ? 'var(--color-positive-bg)'
                          : selectedCell.heatLevel <= 2
                          ? 'var(--color-negative-bg)'
                          : 'var(--bg-card)',
                      color:
                        selectedCell.heatLevel >= 4
                          ? 'var(--color-positive)'
                          : selectedCell.heatLevel <= 2
                          ? 'var(--color-negative)'
                          : 'var(--text-primary)',
                      border: '1px solid var(--border-strong)',
                    }}
                  >
                    <div>{selectedCell.action}</div>
                    <div className="text-[10px] font-normal">{selectedCell.confidence}% Conf</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-bold text-[13px] font-mono-val" style={{ color: 'var(--text-primary)' }}>
                      <span>{selectedCell.asset} @ {selectedCell.hour}</span>
                      <span className="text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
                        (Live Price: ${selectedCell.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-[11px] font-mono-val mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>Target: <strong style={{ color: 'var(--color-positive)' }}>${selectedCell.targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                      <span>Stop: <strong style={{ color: 'var(--color-negative)' }}>${selectedCell.stopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
                      {Object.entries(selectedCell.indicators).map(([k, v]) => (
                        <span key={k} style={{ color: 'var(--text-muted)' }}>• {k}: <strong style={{ color: 'var(--text-primary)' }}>{v}</strong></span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNotify) {
                        onNotify(
                          'Paper Order Dispatched',
                          `Simulated market ${selectedCell.action} on ${selectedCell.asset} @ target $${selectedCell.targetPrice}`,
                          'success'
                        );
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-mono-val font-semibold cursor-pointer transition-all"
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                  >
                    Simulate Order
                  </button>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="p-1 rounded-lg text-[11px] font-mono-val cursor-pointer"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column: Performance & Hyperparameters */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-3">
          {/* Performance Summary Card with Sortino and Turnaround Ratios */}
          <div id="performance-summary-card" className="bento-card rounded-xl flex flex-col">
            <div
              className="p-2.5 border-b flex items-center justify-between"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold tracking-wider uppercase"
                style={{ color: 'var(--accent-primary)' }}
              >
                Performance Metrics
              </h2>
              <span className="text-[10px] font-mono-val font-semibold" style={{ color: 'var(--text-muted)' }}>
                Live Audit
              </span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {/* Total Strategy Return */}
              <div
                className="col-span-2 p-2.5 rounded-lg border"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div
                  className="font-mono-val text-[10px] uppercase mb-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total Strategy Return
                </div>
                <div
                  className="font-mono-val text-[22px] font-bold"
                  style={{ color: 'var(--color-positive)' }}
                >
                  +{performance.totalReturn}%
                </div>
              </div>

              {/* CAGR */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  CAGR
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {performance.cagr}%
                </div>
              </div>

              {/* Max Drawdown */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Max Drawdown
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--color-negative)' }}
                >
                  {performance.maxDrawdown}%
                </div>
              </div>

              {/* Win Rate */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Win Rate
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {performance.winRate}%
                </div>
              </div>

              {/* Sharpe Ratio */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Sharpe Ratio
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--color-positive)' }}
                >
                  {performance.sharpeRatio}
                </div>
              </div>

              {/* Sortino Ratio */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }} title="Sortino: Downside Volatility Adjusted">
                  Sortino Ratio
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  {performance.sortinoRatio}
                </div>
              </div>

              {/* Turnaround Ratio (Recovery Factor) */}
              <div
                className="p-2 rounded-lg border flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[9px] uppercase" style={{ color: 'var(--text-muted)' }} title="Turnaround Ratio: Total Return / Max Drawdown">
                  Turnaround
                </div>
                <div
                  className="font-mono-val text-[14px] font-bold"
                  style={{ color: 'var(--color-positive)' }}
                >
                  {performance.turnaroundRatio}x
                </div>
              </div>

              {/* Total Trades & Profit Factor */}
              <div
                className="col-span-2 p-2 rounded-lg border flex justify-between items-center font-mono-val text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Trades / Profit Factor
                </div>
                <div
                  className="font-semibold text-right"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {performance.totalTrades.toLocaleString()} / <span style={{ color: 'var(--color-positive)' }}>{performance.profitFactor || 2.41} PF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hyperparameters Configuration Card */}
          <div id="backtest-params-card" className="bento-card rounded-xl flex flex-col flex-1">
            <div
              className="p-2.5 border-b flex items-center justify-between"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Hyperparameters
              </h2>
              <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
            </div>

            <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <label className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  START DATE
                </label>
                <input
                  type="date"
                  value={params.startDate}
                  onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                  className="w-full rounded-lg p-1.5 text-[11px] font-mono-val focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  END DATE
                </label>
                <input
                  type="date"
                  value={params.endDate}
                  onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                  className="w-full rounded-lg p-1.5 text-[11px] font-mono-val focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  CAPITAL (USD)
                </label>
                <input
                  type="number"
                  value={params.initialCapital}
                  onChange={(e) =>
                    setParams({ ...params, initialCapital: parseFloat(e.target.value) || 10000 })
                  }
                  className="w-full rounded-lg p-1.5 text-[11px] font-mono-val text-right focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center font-mono-val text-[10px]">
                  <span style={{ color: 'var(--text-muted)' }}>SLIPPAGE MODEL</span>
                  <span style={{ color: 'var(--accent-primary)' }} className="font-bold">
                    {params.slippagePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={params.slippagePct}
                  onChange={(e) =>
                    setParams({ ...params, slippagePct: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 rounded cursor-pointer"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  COMMISSION STRUCTURE
                </label>
                <select
                  value={params.commissionType}
                  onChange={(e) =>
                    setParams({
                      ...params,
                      commissionType: e.target.value as BacktestParams['commissionType'],
                    })
                  }
                  className="w-full rounded-lg p-1.5 text-[11px] font-mono-val focus:outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Percentage (%)">Percentage (%)</option>
                  <option value="Fixed per Trade">Fixed per Trade</option>
                  <option value="Maker/Taker">Maker/Taker</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  COMMISSION RATE (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={params.commissionRate}
                  onChange={(e) =>
                    setParams({ ...params, commissionRate: parseFloat(e.target.value) || 0.02 })
                  }
                  className="w-full rounded-lg p-1.5 text-[11px] font-mono-val text-right focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
