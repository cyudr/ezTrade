import React, { useState, useEffect } from 'react';
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

export const SignalBacktest: React.FC<SignalBacktestProps> = ({
  onNotify,
  apiConfig,
  onOpenSignalSpec,
  onOpenSettings,
}) => {
  const { timezone, activeOption, currentTime } = useTimezone();
  const [params, setParams] = useState<BacktestParams>(INITIAL_BACKTEST_PARAMS);
  const [performance, setPerformance] = useState<PerformanceSummary>(INITIAL_PERFORMANCE);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'YTD'>('1M');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    val: number;
    bmk: number;
  } | null>({
    date: 'Apr 15, 2024',
    val: 138450.2,
    bmk: 2.4,
  });

  // Local signal state & engine detection
  const [signalDataSource, setSignalDataSource] = useState<'local' | 'simulated'>('simulated');
  const [signalEndpoint, setSignalEndpoint] = useState(
    apiConfig?.localSignalEndpoint || 'http://localhost:8000/api/signals'
  );
  const [heatmapCells, setHeatmapCells] = useState<SignalHeatmapCell[]>(SIGNAL_HEATMAP_DATA);
  const [isSyncingSignal, setIsSyncingSignal] = useState(false);
  const [signalNotice, setSignalNotice] = useState<string>(
    'Simulated Signal Generator active (Ready to stream from your local FastAPI / Flask backend)'
  );

  const strategies = [
    { id: 'MOMENTUM_ALPHA_V3', name: 'Momentum Alpha v3 (Trend + Vol filter)' },
    { id: 'VOL_ARBITRAGE_V1', name: 'Volatility Arbitrage v1 (Cross-Asset dispersion)' },
    { id: 'MEAN_REVERSION_PRO', name: 'Mean Reversion Pro (Ornstein-Uhlenbeck)' },
    { id: 'LOCAL_CUSTOM_MODEL', name: 'Local Machine Learning Engine (Custom HTTP)' },
  ];

  // Group heatmap rows
  const assets = ['BTC', 'ETH', 'SOL', 'AVAX'];
  const hours = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  // Check / Fetch Signal Data from Local API or Fallback
  const handleFetchSignals = async (silent = false) => {
    setIsSyncingSignal(true);
    try {
      const result = await fetchLocalSignalData(signalEndpoint);
      if (result.success && result.data && result.data.signals && result.data.signals.length > 0) {
        setSignalDataSource('local');
        setHeatmapCells(result.data.signals);
        if (result.data.performance) {
          setPerformance(result.data.performance);
        }
        setSignalNotice(
          `Connected to Local Signal Engine (${signalEndpoint}) | Strategy: ${
            result.data.strategyId || 'Local'
          }`
        );
        if (!silent && onNotify) {
          onNotify(
            'Local Engine Connected',
            `Streamed ${result.data.signals.length} live signal matrices from local endpoint.`,
            'success'
          );
        }
      } else {
        setSignalDataSource('simulated');
        setHeatmapCells(SIGNAL_HEATMAP_DATA);
        setSignalNotice('Local server offline/unreachable - fallback active');
      }
    } catch (e: any) {
      setSignalDataSource('simulated');
      setHeatmapCells(SIGNAL_HEATMAP_DATA);
      setSignalNotice('Local server offline/unreachable - fallback active');
    } finally {
      setIsSyncingSignal(false);
    }
  };

  useEffect(() => {
    handleFetchSignals(true);
  }, [signalEndpoint]);

  const handleRunBacktest = () => {
    setIsRunning(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRunning(false);

          // Calculate new randomized performance based on parameters
          const slippagePenalty = params.slippagePct * 8;
          const newReturn = Math.max(
            20,
            parseFloat((145.2 - slippagePenalty + (Math.random() * 12 - 6)).toFixed(1))
          );
          const newSharpe = Math.max(
            1.1,
            parseFloat((2.14 - params.slippagePct * 0.5 + (Math.random() * 0.2 - 0.1)).toFixed(2))
          );

          setPerformance({
            totalReturn: newReturn,
            cagr: parseFloat((32.4 + (Math.random() * 4 - 2)).toFixed(1)),
            maxDrawdown: parseFloat((-12.8 - params.slippagePct * 2).toFixed(1)),
            winRate: parseFloat((68.5 + (Math.random() * 3 - 1.5)).toFixed(1)),
            sharpeRatio: newSharpe,
            totalTrades: Math.floor(1402 + (Math.random() * 60 - 30)),
          });

          // Trigger celebration confetti
          try {
            confetti({
              particleCount: 50,
              spread: 50,
              origin: { y: 0.6 },
              colors: ['#4ae176', '#4d8eff', '#6bff8f'],
            });
          } catch (e) {
            // benign
          }

          if (onNotify) {
            onNotify(
              'Backtest Complete',
              `Strategy ${params.strategyId} simulation finished. Total Return: +${newReturn}%, Sharpe: ${newSharpe}`,
              'success'
            );
          }
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleSaveParams = () => {
    if (onNotify) {
      onNotify(
        'Parameters Saved',
        `Hyperparameters for ${params.strategyId} stored to local state.`,
        'info'
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Signal API Integration Banner */}
      <div className="bento-card rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-val"
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
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  signalDataSource === 'local' ? 'var(--color-positive)' : 'var(--accent-primary)',
              }}
            />
            <span className="font-semibold">
              {signalDataSource === 'local' ? 'LOCAL ENGINE ACTIVE' : 'SIMULATED FALLBACK ACTIVE'}
            </span>
          </div>
          <span
            className="text-[11px] font-mono-val truncate max-w-md hidden sm:inline"
            style={{ color: 'var(--text-muted)' }}
          >
            {signalNotice}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono-val text-[11px]">
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
            <span>{isSyncingSignal ? 'Connecting...' : 'Ping Local Engine'}</span>
          </button>

          {onOpenSignalSpec && (
            <button
              onClick={onOpenSignalSpec}
              className="px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer transition-all font-medium"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--accent-primary)',
                color: 'var(--accent-text)',
              }}
            >
              <Code2 className="w-3 h-3" />
              <span>API Spec / Python Setup</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-1">
        <div>
          <h1
            className="font-bold text-[22px] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Signal Visualization & Backtest
          </h1>
          <div
            className="flex items-center gap-2 font-mono-val text-[11px] mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>STRATEGY:</span>
            <select
              value={params.strategyId}
              onChange={(e) => setParams({ ...params, strategyId: e.target.value })}
              className="rounded-md px-2 py-0.5 font-semibold focus:outline-none cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="save-params-btn"
            onClick={handleSaveParams}
            className="px-3.5 py-1.5 rounded-lg font-mono-val text-[12px] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Save className="w-3.5 h-3.5" /> SAVE PARAMS
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
          className="w-full h-1 rounded-full overflow-hidden"
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 min-h-[640px]">
        {/* Main Chart Area */}
        <div className="col-span-1 md:col-span-9 flex flex-col gap-3">
          {/* Equity Curve Chart */}
          <div
            id="equity-curve-card"
            className="bento-card rounded-xl flex-1 flex flex-col relative overflow-hidden min-h-[290px]"
          >
            <div
              className="p-3 border-b flex justify-between items-center"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Portfolio Equity Curve (USD)
              </h2>
              <div className="flex gap-1 font-mono-val text-[11px]">
                {(['1D', '1W', '1M', '3M', 'YTD'] as const).map((tf) => {
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

            <div className="flex-1 relative p-4 min-h-[210px]">
              {/* Axis Boundaries */}
              <div
                className="absolute inset-4 border-l border-b"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Y-Axis Labels */}
                <div
                  className="absolute -left-11 bottom-0 top-0 flex flex-col justify-between font-mono-val text-[10px] text-right w-9"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>$160k</span>
                  <span>$140k</span>
                  <span>$120k</span>
                  <span>$100k</span>
                  <span>$80k</span>
                </div>

                {/* X-Axis Labels */}
                <div
                  className="absolute -bottom-5 left-0 right-0 flex justify-between font-mono-val text-[10px]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>

                {/* SVG Curve representing equity */}
                <svg
                  className="absolute inset-0 overflow-visible"
                  height="100%"
                  width="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area */}
                  <path
                    d="M0,80 Q10,75 20,60 T40,50 T60,30 T80,40 T100,10 L100,100 L0,100 Z"
                    fill="url(#equityGrad)"
                  />

                  {/* Active Strategy Line */}
                  <path
                    d="M0,80 Q10,75 20,60 T40,50 T60,30 T80,40 T100,10"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Benchmark Dotted Curve */}
                  <path
                    d="M0,80 Q20,70 40,65 T70,55 T100,45"
                    fill="none"
                    stroke="var(--text-muted)"
                    strokeDasharray="4,4"
                    strokeWidth="1.2"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Endpoint Marker */}
                  <circle cx="100" cy="10" r="4" fill="var(--accent-primary)" />
                </svg>

                {/* Tooltip & Crosshair */}
                {hoveredPoint && (
                  <>
                    <div
                      className="absolute left-[60%] top-0 bottom-0 border-l border-dashed w-px pointer-events-none"
                      style={{ borderColor: 'var(--border-strong)' }}
                    />
                    <div
                      className="absolute left-[60%] top-[30%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 pointer-events-none"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        borderColor: 'var(--bg-card)',
                      }}
                    />
                    <div
                      className="absolute left-[62%] top-[15%] p-2 rounded-lg pointer-events-none z-20 shadow-md"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-strong)',
                      }}
                    >
                      <div className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {hoveredPoint.date}
                      </div>
                      <div
                        className="font-mono-val text-[14px] font-bold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        ${hoveredPoint.val.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className="font-mono-val text-[10px] font-semibold"
                        style={{ color: 'var(--color-positive)' }}
                      >
                        +{hoveredPoint.bmk}% vs BMK (S&P)
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
                Drawdown (%)
              </h2>
              <span
                className="font-mono-val text-[10px] font-semibold"
                style={{ color: 'var(--color-negative)' }}
              >
                Max: {performance.maxDrawdown}%
              </span>
            </div>

            <div className="flex-1 relative p-3">
              <div
                className="absolute inset-3 border-l border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {/* Y Axis Labels */}
                <div
                  className="absolute -left-9 top-0 bottom-0 flex flex-col justify-between font-mono-val text-[9px] text-right w-7"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>0%</span>
                  <span>-5%</span>
                  <span>-10%</span>
                  <span>-15%</span>
                </div>

                <svg
                  className="absolute inset-0 overflow-visible"
                  height="100%"
                  width="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-negative)" stopOpacity="0.0" />
                      <stop offset="100%" stopColor="var(--color-negative)" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,0 L20,0 Q25,20 30,30 T40,10 L50,0 L60,0 Q65,40 70,50 T80,0 L100,0 L100,0 L0,0 Z"
                    fill="url(#ddGrad)"
                  />
                  <path
                    d="M0,0 L20,0 Q25,20 30,30 T40,10 L50,0 L60,0 Q65,40 70,50 T80,0 L100,0"
                    fill="none"
                    stroke="var(--color-negative)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Signal Heatmap */}
          <div
            id="heatmap-card"
            className="bento-card rounded-xl h-52 flex flex-col relative overflow-hidden"
          >
            <div
              className="p-2.5 border-b flex justify-between items-center"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Signal Heatmap (Asset vs Hour)
              </h2>
              <div
                className="flex items-center gap-1.5 font-mono-val text-[10px]"
                style={{ color: 'var(--text-muted)' }}
              >
                <span>Bearish</span>
                <span className="w-2.5 h-2.5 heat-1 rounded-xs" />
                <span className="w-2.5 h-2.5 heat-2 rounded-xs" />
                <span className="w-2.5 h-2.5 heat-3 rounded-xs" />
                <span className="w-2.5 h-2.5 heat-4 rounded-xs" />
                <span className="w-2.5 h-2.5 heat-5 rounded-xs" />
                <span>Bullish</span>
              </div>
            </div>

            <div className="flex-1 p-2 overflow-x-auto">
              <table className="w-full h-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="w-14" />
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
                        className="font-semibold pr-2 text-right py-0.5"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {asset}
                      </td>
                      {hours.map((hour) => {
                        const cell = heatmapCells.find(
                          (c) => c.asset === asset && c.hour === hour
                        ) || { heatLevel: 3, strength: 0.5 };
                        return (
                          <td key={`${asset}-${hour}`} className="p-0.5">
                            <div
                              title={`${asset} @ ${hour} - Strength: ${(
                                cell.strength * 100
                              ).toFixed(0)}%`}
                              className={`w-full h-full min-h-[22px] rounded-xs transition-opacity hover:opacity-80 cursor-pointer heat-${cell.heatLevel}`}
                            />
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

        {/* Sidebar Column: Performance Summary & Parameters */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-3">
          {/* Performance Summary Card */}
          <div id="performance-summary-card" className="bento-card rounded-xl flex flex-col">
            <div
              className="p-2.5 border-b"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold tracking-wider uppercase"
                style={{ color: 'var(--accent-primary)' }}
              >
                Performance Summary
              </h2>
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
                  Total Return
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
                className="col-span-2 p-2 rounded-lg border flex justify-between items-center"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-mono-val text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                  Trades
                </div>
                <div
                  className="font-mono-val text-[13px] font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {performance.totalTrades.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Backtest Parameters Card */}
          <div id="backtest-params-card" className="bento-card rounded-xl flex flex-col flex-1">
            <div
              className="p-2.5 border-b"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--bg-card-subtle)',
              }}
            >
              <h2
                className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Parameters
              </h2>
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
                  <span style={{ color: 'var(--text-muted)' }}>SLIPPAGE (%)</span>
                  <span style={{ color: 'var(--accent-primary)' }} className="font-bold">
                    {params.slippagePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
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
                  COMMISSION TYPE
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
                    setParams({ ...params, commissionRate: parseFloat(e.target.value) || 0.05 })
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
