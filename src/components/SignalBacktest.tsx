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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  BacktestParams,
  PerformanceSummary,
  SignalHeatmapCell,
  ApiConfig,
} from '../types';
import {
  INITIAL_BACKTEST_PARAMS,
  INITIAL_PERFORMANCE,
  SIGNAL_HEATMAP_DATA,
} from '../data/mockData';
import { fetchLocalSignalData } from '../services/apiService';
import { useTimezone } from '../context/TimezoneContext';

interface SignalBacktestProps {
  onNotify?: (title: string, msg: string, type: 'success' | 'info' | 'warning') => void;
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
  onNotify,
  apiConfig,
  onOpenSignalSpec,
  onOpenSettings,
}) => {
  const { timezone, activeOption, currentTime } = useTimezone();
  const [params, setParams] = useState<BacktestParams>(() => {
    try {
      const saved = localStorage.getItem('quant_terminal_backtest_params');
      return saved ? JSON.parse(saved) : INITIAL_BACKTEST_PARAMS;
    } catch (e) {
      return INITIAL_BACKTEST_PARAMS;
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

  const [performance, setPerformance] = useState<PerformanceSummary>(INITIAL_PERFORMANCE);
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
  const [heatmapCells, setHeatmapCells] = useState<SignalHeatmapCell[]>(SIGNAL_HEATMAP_DATA);
  const [isSyncingSignal, setIsSyncingSignal] = useState(false);
  const [signalNotice, setSignalNotice] = useState<string>(
    'Simulated Quantitative Engine Active (Ready for Local / Custom HTTP Bridge)'
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
      // Custom strategy responsiveness
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

    // Pseudo-random deterministic walk
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

  // SVG dimensions & calculations
  const svgData = useMemo(() => {
    if (equityPoints.length === 0) return { path: '', area: '', bmkPath: '', min: 0, max: 1 };
    const equities = equityPoints.map((p) => p.equity);
    const benchmarks = equityPoints.map((p) => p.benchmark);
    const allVals = [...equities, ...benchmarks];
    const min = Math.min(...allVals) * 0.98;
    const max = Math.max(...allVals) * 1.02;
    const range = max - min || 1;

    const coords = equityPoints.map((p, idx) => {
      const x = (idx / (equityPoints.length - 1)) * 100;
      const y = 100 - ((p.equity - min) / range) * 100;
      return { x, y };
    });

    const bmkCoords = equityPoints.map((p, idx) => {
      const x = (idx / (equityPoints.length - 1)) * 100;
      const y = 100 - ((p.benchmark - min) / range) * 100;
      return { x, y };
    });

    const path = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(2)},${c.y.toFixed(2)}` : `${acc} L ${c.x.toFixed(2)},${c.y.toFixed(2)}`),
      ''
    );
    const area = `${path} L 100,100 L 0,100 Z`;
    const bmkPath = bmkCoords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(2)},${c.y.toFixed(2)}` : `${acc} L ${c.x.toFixed(2)},${c.y.toFixed(2)}`),
      ''
    );

    return { path, area, bmkPath, min, max, coords };
  }, [equityPoints]);

  // Drawdown SVG calculations
  const ddSvgData = useMemo(() => {
    if (equityPoints.length === 0) return { path: '', area: '', minDd: -15 };
    const dds = equityPoints.map((p) => p.drawdownPct);
    const minDd = Math.min(-1, ...dds); // e.g. -12.5%

    const coords = equityPoints.map((p, idx) => {
      const x = (idx / (equityPoints.length - 1)) * 100;
      const y = (p.drawdownPct / minDd) * 100; // 0% = 0, minDd = 100
      return { x, y };
    });

    const path = coords.reduce(
      (acc, c, i) => (i === 0 ? `M ${c.x.toFixed(2)},${c.y.toFixed(2)}` : `${acc} L ${c.x.toFixed(2)},${c.y.toFixed(2)}`),
      ''
    );
    const area = `${path} L 100,0 L 0,0 Z`;

    return { path, area, minDd };
  }, [equityPoints]);

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
        setSignalNotice('Simulated Quantitative Engine Active (High-Frequency Algorithmic Fallback)');
        if (!silent && onNotify) {
          onNotify(
            'Algorithmic Fallback Active',
            'Local server unreachable. Full simulated quantitative engine is operational.',
            'info'
          );
        }
      }
    } catch (e: any) {
      setSignalDataSource('simulated');
      setHeatmapCells(dynamicHeatmap);
      setSignalNotice('Simulated Quantitative Engine Active (Local server offline)');
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

          // Calculate precise realistic performance based on final point
          const lastPoint = equityPoints[equityPoints.length - 1];
          const firstPoint = equityPoints[0];
          const totalReturn = lastPoint && firstPoint
            ? parseFloat((((lastPoint.equity - firstPoint.equity) / firstPoint.equity) * 100).toFixed(1))
            : 145.2;

          const worstDd = Math.min(...equityPoints.map((p) => p.drawdownPct));
          const winRate = parseFloat((58 + (totalReturn > 50 ? 12 : 5) - (params.slippagePct * 10)).toFixed(1));
          const sharpe = parseFloat((1.4 + (totalReturn / 100) * 0.8 - params.slippagePct * 0.6).toFixed(2));
          const cagr = parseFloat((totalReturn * 0.45).toFixed(1));

          const newPerf: PerformanceSummary = {
            totalReturn,
            cagr,
            maxDrawdown: parseFloat(worstDd.toFixed(1)),
            winRate,
            sharpeRatio: sharpe,
            totalTrades: Math.floor(850 + (params.initialCapital / 1000) * 8 + (totalReturn * 2)),
            sortinoRatio: parseFloat((sharpe * 1.35).toFixed(2)),
            profitFactor: parseFloat((1.6 + (totalReturn / 200)).toFixed(2)),
            alpha: parseFloat((totalReturn - 18.5).toFixed(1)),
            beta: parseFloat((0.75 + (params.slippagePct * 2)).toFixed(2)),
          };

          setPerformance(newPerf);

          // Celebrate with confetti
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
              `Strategy ${params.strategyId} finished. Total Return: +${totalReturn}%, Sharpe: ${sharpe}`,
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
      let minVal = baseVal;

      for (let s = 0; s < steps; s++) {
        const shock = (Math.random() + Math.random() + Math.random() - 1.5) * 2; // Approximate normal
        pathVal = pathVal * (1 + dailyDrift + shock * dailyVol);
        pathArr.push(pathVal);
        if (pathVal < minVal) minVal = pathVal;
      }

      finalEquities.push(pathVal);
      if (p < 8) {
        samplePaths.push(pathArr);
      }
    }

    finalEquities.sort((a, b) => a - b);
    const var95 = parseFloat((((baseVal - finalEquities[Math.floor(numPaths * 0.05)]) / baseVal) * 100).toFixed(2));
    const var99 = parseFloat((((baseVal - finalEquities[Math.floor(numPaths * 0.01)]) / baseVal) * 100).toFixed(2));
    const worstCaseDd = parseFloat((((baseVal - finalEquities[0]) / baseVal) * 100).toFixed(2));
    const medianReturn = parseFloat((((finalEquities[Math.floor(numPaths * 0.5)] - baseVal) / baseVal) * 100).toFixed(2));
    const worst5Pct = finalEquities.slice(0, Math.floor(numPaths * 0.05));
    const expectedShortfall = parseFloat((((baseVal - (worst5Pct.reduce((a, b) => a + b, 0) / worst5Pct.length)) / baseVal) * 100).toFixed(2));

    setMonteCarloRuns({
      var95,
      var99,
      expectedShortfall,
      medianReturn,
      worstCaseDd,
      simulatedPaths: samplePaths,
    });

    if (onNotify) {
      onNotify('Monte Carlo Complete', `1,000 paths simulated. 95% 1-Mo VaR: ${var95}%, Expected Shortfall: ${expectedShortfall}%`, 'success');
    }
  };

  // Save Hyperparameters
  const handleSaveParams = () => {
    try {
      localStorage.setItem('quant_terminal_backtest_params', JSON.stringify(params));
      localStorage.setItem('quant_terminal_custom_rules', JSON.stringify(customRules));
    } catch (e) {
      // benign
    }
    if (onNotify) {
      onNotify(
        'Hyperparameters Saved',
        `Configuration for ${params.strategyId} persisted to storage.`,
        'info'
      );
    }
  };

  // Export Backtest Report as JSON
  const handleExportJson = () => {
    const data = {
      strategyId: params.strategyId,
      timeframe,
      generatedAt: new Date().toISOString(),
      parameters: params,
      customRules,
      performance,
      equityCurve: equityPoints,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_report_${params.strategyId}_${timeframe}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onNotify) {
      onNotify('Report Exported', 'JSON backtest analytics downloaded successfully.', 'success');
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

  // Handle heatmap cell selection
  const handleCellClick = (asset: string, hour: string, cell: SignalHeatmapCell) => {
    const action = cell.heatLevel === 5 ? 'STRONG BUY' : cell.heatLevel === 4 ? 'BUY' : cell.heatLevel === 1 ? 'STRONG SELL' : cell.heatLevel === 2 ? 'SELL' : 'NEUTRAL';
    const basePrice = asset === 'BTC' ? 68450 : asset === 'ETH' ? 2540 : asset === 'SOL' ? 168.5 : asset === 'AVAX' ? 26.4 : asset === 'SPX' ? 5890 : asset === 'NVDA' ? 128.4 : 224.5;
    const targetPrice = cell.heatLevel >= 4 ? basePrice * 1.045 : cell.heatLevel <= 2 ? basePrice * 0.955 : basePrice;
    const stopLoss = cell.heatLevel >= 4 ? basePrice * 0.978 : cell.heatLevel <= 2 ? basePrice * 1.022 : basePrice;

    setSelectedCell({
      asset,
      hour,
      heatLevel: cell.heatLevel,
      strength: cell.strength,
      action,
      targetPrice: parseFloat(targetPrice.toFixed(2)),
      stopLoss: parseFloat(stopLoss.toFixed(2)),
      confidence: Math.round(cell.strength * 100),
      indicators: {
        'RSI (14)': cell.heatLevel >= 4 ? (42 + cell.strength * 25).toFixed(1) : (68 - cell.strength * 25).toFixed(1),
        'MACD Hist': cell.heatLevel >= 4 ? `+${(cell.strength * 1.8).toFixed(2)}` : `-${(cell.strength * 1.8).toFixed(2)}`,
        'Vol Z-Score': (cell.strength * 1.5 - 0.75).toFixed(2),
        'ATR Vol %': '2.45%',
      },
    });
  };

  // Python template for local backend
  const pythonBridgeCode = `# Python FastAPI Quantitative Signal Bridge
from fastapi import FastAPI
from pydantic import BaseModel
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
            "totalTrades": ${performance.totalTrades}
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)`;

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Mouse Move over chart to calculate interactive crosshair position
  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
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
              {signalDataSource === 'local' ? 'LOCAL ENGINE ACTIVE' : 'QUANTUM ENGINE (BROWSER FALLBACK)'}
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
                Connect your local Python machine learning or quant models directly to this terminal. When offline, the terminal automatically switches to the built-in browser quantitative fallback engine.
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
                Customize indicators, trigger levels, dynamic risk targets, and execution sizing. All parameters immediately update the backtest and signal matrices in real-time.
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
          {/* Equity Curve Chart with Real Mouse Tracking */}
          <div
            id="equity-curve-card"
            className="bento-card rounded-xl flex-1 flex flex-col relative overflow-hidden min-h-[300px]"
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
                    className="font-mono-val text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                      color: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)',
                    }}
                  >
                    ${activeHoverPoint.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({activeHoverPoint.pnlPct >= 0 ? '+' : ''}{activeHoverPoint.pnlPct}%)
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

            {/* Interactive SVG Chart Container */}
            <div
              ref={chartContainerRef}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
              className="flex-1 relative p-4 min-h-[220px] cursor-crosshair select-none"
            >
              {/* Axis Boundaries */}
              <div
                className="absolute inset-4 border-l border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Y-Axis Labels */}
                <div
                  className="absolute -left-12 bottom-0 top-0 flex flex-col justify-between font-mono-val text-[10px] text-right w-10 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>${Math.round(svgData.max / 1000)}k</span>
                  <span>${Math.round((svgData.max * 0.75 + svgData.min * 0.25) / 1000)}k</span>
                  <span>${Math.round((svgData.max * 0.5 + svgData.min * 0.5) / 1000)}k</span>
                  <span>${Math.round((svgData.max * 0.25 + svgData.min * 0.75) / 1000)}k</span>
                  <span>${Math.round(svgData.min / 1000)}k</span>
                </div>

                {/* X-Axis Labels */}
                <div
                  className="absolute -bottom-5 left-0 right-0 flex justify-between font-mono-val text-[10px] pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>{equityPoints[0]?.date || 'Start'}</span>
                  <span>{equityPoints[Math.floor(equityPoints.length / 2)]?.date || 'Mid'}</span>
                  <span>{equityPoints[equityPoints.length - 1]?.date || 'End'}</span>
                </div>

                {/* Dynamic SVG Curves */}
                <svg
                  className="absolute inset-0 overflow-visible w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Benchmark Dotted Curve */}
                  {svgData.bmkPath && (
                    <path
                      d={svgData.bmkPath}
                      fill="none"
                      stroke="var(--text-muted)"
                      strokeDasharray="3,3"
                      strokeWidth="1.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Gradient Fill Area */}
                  {svgData.area && (
                    <path d={svgData.area} fill="url(#equityGrad)" />
                  )}

                  {/* Strategy Line */}
                  {svgData.path && (
                    <path
                      d={svgData.path}
                      fill="none"
                      stroke="var(--accent-primary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Interactive Cursor Marker */}
                  {hoverIndex !== null && svgData.coords && svgData.coords[hoverIndex] && (
                    <circle
                      cx={svgData.coords[hoverIndex].x}
                      cy={svgData.coords[hoverIndex].y}
                      r="4"
                      fill="var(--accent-primary)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>

                {/* Interactive Crosshair & Tooltip Overlay */}
                {hoverIndex !== null && activeHoverPoint && svgData.coords && svgData.coords[hoverIndex] && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 border-l border-dashed w-px pointer-events-none"
                      style={{
                        left: `${svgData.coords[hoverIndex].x}%`,
                        borderColor: 'var(--border-strong)',
                      }}
                    />
                    <div
                      className="absolute p-2 rounded-lg pointer-events-none z-20 shadow-lg font-mono-val text-[11px]"
                      style={{
                        left: `${Math.min(78, Math.max(2, svgData.coords[hoverIndex].x - 10))}%`,
                        top: '10%',
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      <div className="text-[10px] text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
                        {activeHoverPoint.date}
                      </div>
                      <div className="font-bold text-[13px]" style={{ color: 'var(--text-primary)' }}>
                        ${activeHoverPoint.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] font-semibold" style={{ color: activeHoverPoint.pnlPct >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                        PnL: {activeHoverPoint.pnlPct >= 0 ? '+' : ''}{activeHoverPoint.pnlPct}%
                      </div>
                      <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        Benchmark: ${activeHoverPoint.benchmark.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Drawdown Chart */}
          <div
            id="drawdown-card"
            className="bento-card rounded-xl h-32 flex flex-col relative overflow-hidden"
          >
            <div
              className="p-2 border-b flex justify-between items-center"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Drawdown Profile (%)
              </h2>
              <span
                className="font-mono-val text-[10px] font-semibold"
                style={{ color: 'var(--color-negative)' }}
              >
                Max Drawdown: {performance.maxDrawdown}%
              </span>
            </div>

            <div className="flex-1 relative p-3">
              <div
                className="absolute inset-3 border-l border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Y Axis Labels */}
                <div
                  className="absolute -left-9 top-0 bottom-0 flex flex-col justify-between font-mono-val text-[9px] text-right w-7 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>0%</span>
                  <span>{Math.round(ddSvgData.minDd / 2)}%</span>
                  <span>{Math.round(ddSvgData.minDd)}%</span>
                </div>

                <svg
                  className="absolute inset-0 overflow-visible w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-negative)" stopOpacity="0.0" />
                      <stop offset="100%" stopColor="var(--color-negative)" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  {ddSvgData.area && <path d={ddSvgData.area} fill="url(#ddGrad)" />}
                  {ddSvgData.path && (
                    <path
                      d={ddSvgData.path}
                      fill="none"
                      stroke="var(--color-negative)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Signal Heatmap with Interactive Cell Inspector */}
          <div
            id="heatmap-card"
            className="bento-card rounded-xl flex flex-col relative overflow-hidden"
          >
            <div
              className="p-2.5 border-b flex flex-wrap justify-between items-center gap-2"
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
                  Signal Matrix & Heatmap (Click cell to inspect quantitative breakdown)
                </h2>
              </div>
              <div
                className="flex items-center gap-1.5 font-mono-val text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Bearish</span>
                <span className="w-2.5 h-2.5 heat-1 rounded-xs" title="Strong Sell" />
                <span className="w-2.5 h-2.5 heat-2 rounded-xs" title="Sell" />
                <span className="w-2.5 h-2.5 heat-3 rounded-xs" title="Neutral" />
                <span className="w-2.5 h-2.5 heat-4 rounded-xs" title="Buy" />
                <span className="w-2.5 h-2.5 heat-5 rounded-xs" title="Strong Buy" />
                <span>Bullish</span>
              </div>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 pb-1 font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      ASSET
                    </th>
                    {hours.map((h) => (
                      <th
                        key={h}
                        className="font-mono-val text-[10px] font-normal text-center w-12 pb-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono-val text-[11px]">
                  {assets.map((asset) => (
                    <tr key={asset}>
                      <td
                        className="font-semibold pr-2 text-right py-1 font-mono-val"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {asset}
                      </td>
                      {hours.map((hour) => {
                        const cellList = heatmapCells.length > 0 ? heatmapCells : dynamicHeatmap;
                        const cell = cellList.find(
                          (c) => c.asset === asset && c.hour === hour
                        ) || { heatLevel: 3, strength: 0.5 };
                        const isSelected = selectedCell?.asset === asset && selectedCell?.hour === hour;

                        return (
                          <td key={`${asset}-${hour}`} className="p-0.5">
                            <button
                              onClick={() => handleCellClick(asset, hour, cell)}
                              title={`Click to inspect ${asset} @ ${hour} (Confidence: ${Math.round(cell.strength * 100)}%)`}
                              className={`w-full h-7 rounded-xs transition-all hover:scale-105 cursor-pointer heat-${cell.heatLevel} ${
                                isSelected ? 'ring-2 ring-blue-500 scale-105' : ''
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg font-mono-val text-[12px] font-bold text-center min-w-[90px]"
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
                    <div className="font-bold text-[13px] font-mono-val" style={{ color: 'var(--text-primary)' }}>
                      {selectedCell.asset} Signal Breakdown @ {selectedCell.hour}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] font-mono-val mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <span>Target: <strong style={{ color: 'var(--color-positive)' }}>${selectedCell.targetPrice}</strong></span>
                      <span>Stop: <strong style={{ color: 'var(--color-negative)' }}>${selectedCell.stopLoss}</strong></span>
                      {Object.entries(selectedCell.indicators).map(([k, v]) => (
                        <span key={k}>• {k}: <strong>{v}</strong></span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onNotify) {
                        onNotify(
                          'Paper Order Simulated',
                          `Simulated market ${selectedCell.action} on ${selectedCell.asset} @ target $${selectedCell.targetPrice}`,
                          'success'
                        );
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-mono-val font-semibold cursor-pointer"
                    style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff' }}
                  >
                    Simulate Fill
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
          {/* Performance Summary Card */}
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
                  className="font-mono-val text-[20px] font-bold"
                  style={{ color: 'var(--color-positive)' }}
                >
                  +{performance.totalReturn}%
                </div>
              </div>

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

              <div
                className="col-span-2 p-2 rounded-lg border flex justify-between items-center font-mono-val text-[11px]"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Total Executed Trades
                </div>
                <div
                  className="font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {performance.totalTrades.toLocaleString()}
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
