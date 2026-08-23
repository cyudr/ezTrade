import React, { useState, useEffect } from 'react';
import {
  StopCircle,
  Download,
  Clock,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Sliders,
  Layers,
  Play,
  RotateCcw,
  Wifi,
} from 'lucide-react';
import { SystemHealth } from '../types';
import { fetchApiHealth } from '../data';

interface StrategyPerformanceProps {
  onExportCsv?: () => void;
  onNotify?: (title: string, msg: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const StrategyPerformance: React.FC<StrategyPerformanceProps> = ({
  onExportCsv,
  onNotify,
}) => {
  const [strategyStatus, setStrategyStatus] = useState<'ACTIVE' | 'HALTED'>('ACTIVE');
  const [showHaltModal, setShowHaltModal] = useState(false);
  const [health, setHealth] = useState<SystemHealth>({
    apiLatency: { status: 'ok', value: '11ms' },
    marginLevel: { status: 'ok', value: '42.8%' },
    dataFeed: { status: 'ok', value: '99.98%' },
    slippage: { status: 'ok', value: '0.02%' },
  });
  const [selectedSubTab, setSelectedSubTab] = useState<'FILLS' | 'RISK' | 'PARAMETERS'>('FILLS');

  // Real-time API telemetry ping
  useEffect(() => {
    let isMounted = true;
    const pingTelemetry = async () => {
      const start = performance.now();
      try {
        const res = await fetchApiHealth();
        const latency = Math.round(performance.now() - start);
        if (isMounted) {
          setHealth({
            apiLatency: {
              status: res.status === 'ok' ? 'ok' : 'error',
              value: `${latency}ms`,
            },
            marginLevel: { status: 'ok', value: '42.8%' },
            dataFeed: {
              status: res.status === 'ok' ? 'ok' : 'warning',
              value: res.status === 'ok' ? '100% Live' : 'API Offline',
            },
            slippage: { status: 'ok', value: '0.02%' },
          });
        }
      } catch (err) {
        if (isMounted) {
          setHealth({
            apiLatency: { status: 'error', value: 'Offline' },
            marginLevel: { status: 'ok', value: '42.8%' },
            dataFeed: { status: 'error', value: 'API Offline' },
            slippage: { status: 'warning', value: 'N/A' },
          });
        }
      }
    };

    pingTelemetry();
    const interval = setInterval(pingTelemetry, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Simulated live execution logs
  const [executions] = useState([
    {
      id: 'fill-101',
      time: '18:44:12',
      symbol: 'AAPL',
      side: 'BUY',
      qty: 500,
      price: 182.25,
      slippageBps: 0.8,
      latencyMs: 12,
      engine: 'Opti-Core DMA',
    },
    {
      id: 'fill-102',
      time: '18:41:05',
      symbol: 'NVDA',
      side: 'BUY',
      qty: 200,
      price: 720.15,
      slippageBps: 1.4,
      latencyMs: 14,
      engine: 'Opti-Core Dark',
    },
    {
      id: 'fill-103',
      time: '18:38:50',
      symbol: 'TSLA',
      side: 'SELL',
      qty: 400,
      price: 198.4,
      slippageBps: 3.2,
      latencyMs: 18,
      engine: 'Opti-Core DMA',
    },
    {
      id: 'fill-104',
      time: '18:30:19',
      symbol: 'MSFT',
      side: 'BUY',
      qty: 350,
      price: 402.5,
      slippageBps: 0.5,
      latencyMs: 11,
      engine: 'Opti-Core Internal',
    },
    {
      id: 'fill-105',
      time: '18:22:44',
      symbol: 'AMD',
      side: 'BUY',
      qty: 1000,
      price: 165.5,
      slippageBps: 1.1,
      latencyMs: 15,
      engine: 'Opti-Core DMA',
    },
  ]);

  const handleToggleHalt = () => {
    if (strategyStatus === 'ACTIVE') {
      setShowHaltModal(true);
    } else {
      setStrategyStatus('ACTIVE');
      if (onNotify) {
        onNotify('Strategy Resumed', 'Alpha_Omega_v2.4 trading engine is now ACTIVE.', 'success');
      }
    }
  };

  const confirmHalt = () => {
    setStrategyStatus('HALTED');
    setShowHaltModal(false);
    if (onNotify) {
      onNotify(
        'Emergency Halt Triggered',
        'Alpha_Omega_v2.4 paused. Active quotes canceled.',
        'error'
      );
    }
  };

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
    } else if (onNotify) {
      onNotify(
        'CSV Exported',
        'Downloaded strategy performance telemetry logs (Alpha_Omega_v2.4_perf.csv)',
        'info'
      );
    }
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-1 gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="font-bold text-[24px] tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              Alpha_Omega_v2.4
            </h1>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-md font-mono-val text-[11px] uppercase tracking-wider font-semibold border"
              style={{
                backgroundColor:
                  strategyStatus === 'ACTIVE'
                    ? 'var(--color-positive-bg)'
                    : 'var(--color-negative-bg)',
                color:
                  strategyStatus === 'ACTIVE'
                    ? 'var(--color-positive)'
                    : 'var(--color-negative)',
                borderColor:
                  strategyStatus === 'ACTIVE'
                    ? 'var(--color-positive-border)'
                    : 'var(--color-negative-border)',
              }}
            >
              {strategyStatus}
            </span>
          </div>

          <div
            className="flex items-center gap-4 font-mono-val text-[11px]"
            style={{ color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Runtime: 243d 14h
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} /> Engine:
              Opti-Core v4.2
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExport}
            className="px-3.5 py-1.5 rounded-lg font-mono-val text-[11px] uppercase transition-all flex items-center gap-1.5 cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            id="halt-strategy-btn"
            onClick={handleToggleHalt}
            className="px-3.5 py-1.5 rounded-lg font-mono-val text-[11px] uppercase transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
            style={{
              backgroundColor:
                strategyStatus === 'ACTIVE'
                  ? 'var(--color-negative-bg)'
                  : 'var(--color-positive-bg)',
              color:
                strategyStatus === 'ACTIVE'
                  ? 'var(--color-negative)'
                  : 'var(--color-positive)',
              border: `1px solid ${
                strategyStatus === 'ACTIVE'
                  ? 'var(--color-negative-border)'
                  : 'var(--color-positive-border)'
              }`,
            }}
          >
            {strategyStatus === 'ACTIVE' ? (
              <>
                <StopCircle className="w-3.5 h-3.5" /> HALT
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> RESUME
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-3">
        {/* Net PnL (4 cols on desktop) */}
        <div
          id="kpi-net-pnl"
          className="col-span-12 md:col-span-4 bento-card rounded-xl p-3.5 flex flex-col justify-between h-[125px] relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <h3
              className="font-mono-val text-[11px] uppercase tracking-wider font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Net PnL
            </h3>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-positive)' }} />
          </div>
          <div>
            <div
              className="font-mono-val text-[24px] font-bold leading-tight"
              style={{ color: 'var(--color-positive)' }}
            >
              +$142,890.50
            </div>
            <div
              className="font-mono-val text-[11px] flex items-center gap-1 mt-0.5 font-medium"
              style={{ color: 'var(--color-positive)' }}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% (YTD)
            </div>
          </div>
        </div>

        {/* Win Rate (2 cols on desktop) */}
        <div
          id="kpi-win-rate"
          className="col-span-6 md:col-span-2 bento-card rounded-xl p-3.5 flex flex-col justify-between h-[125px]"
        >
          <h3
            className="font-mono-val text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Win Rate
          </h3>
          <div>
            <div
              className="font-mono-val text-[20px] font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              68.4%
            </div>
            <div
              className="w-full h-1.5 rounded-full mt-2 overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card-subtle)' }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: '68.4%', backgroundColor: 'var(--accent-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Max Drawdown (2 cols on desktop) */}
        <div
          id="kpi-drawdown"
          className="col-span-6 md:col-span-2 bento-card rounded-xl p-3.5 flex flex-col justify-between h-[125px]"
        >
          <h3
            className="font-mono-val text-[11px] uppercase tracking-wider font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Max Drawdown
          </h3>
          <div>
            <div
              className="font-mono-val text-[20px] font-bold"
              style={{ color: 'var(--color-negative)' }}
            >
              -4.2%
            </div>
            <div className="font-mono-val text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              $42,000
            </div>
          </div>
        </div>

        {/* Health Check (4 cols on desktop) */}
        <div
          id="kpi-health"
          className="col-span-12 md:col-span-4 bento-card rounded-xl p-3.5 flex flex-col justify-between h-[125px]"
        >
          <div className="flex justify-between items-center mb-1">
            <h3
              className="font-mono-val text-[11px] uppercase tracking-wider font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Health Telemetry
            </h3>
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--color-positive)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
              <span className="font-mono-val text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Latency ({health.apiLatency.value})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
              <span className="font-mono-val text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Margin ({health.marginLevel.value})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
              <span className="font-mono-val text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                Feed ({health.dataFeed.value})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--color-negative)' }} />
              <span className="font-mono-val text-[10px]" style={{ color: 'var(--color-negative)' }}>
                Slippage (Elevated)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Telemetry Tabs */}
      <div className="bento-card rounded-xl p-3.5 mt-1">
        <div
          className="flex justify-between items-center mb-3 pb-2 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex gap-1.5">
            {(
              [
                { id: 'FILLS', label: 'Order Fills' },
                { id: 'RISK', label: 'Risk & Exposure' },
                { id: 'PARAMETERS', label: 'Tuning Knobs' },
              ] as const
            ).map((tab) => {
              const isSelected = selectedSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSubTab(tab.id)}
                  className="font-mono-val text-[11px] px-3 py-1 rounded-md uppercase transition-all cursor-pointer font-medium"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                    border: isSelected
                      ? '1px solid var(--accent-primary)'
                      : '1px solid transparent',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            className="text-[10px] font-mono-val flex items-center gap-1.5 font-medium"
            style={{ color: 'var(--color-positive)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-positive)' }}
            />
            <span>Opti-Core Router: Low Latency Route</span>
          </div>
        </div>

        {selectedSubTab === 'FILLS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-val text-[11px] border-collapse">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="pb-2 font-medium">TIME</th>
                  <th className="pb-2 font-medium">SYMBOL</th>
                  <th className="pb-2 font-medium">SIDE</th>
                  <th className="pb-2 font-medium text-right">QTY</th>
                  <th className="pb-2 font-medium text-right">FILL PRICE</th>
                  <th className="pb-2 font-medium text-right">SLIPPAGE</th>
                  <th className="pb-2 font-medium text-right">LATENCY</th>
                  <th className="pb-2 font-medium text-right">ROUTER</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((fill) => (
                  <tr
                    key={fill.id}
                    className="border-b transition-colors"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <td className="py-2" style={{ color: 'var(--text-muted)' }}>
                      {fill.time}
                    </td>
                    <td className="py-2 font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      {fill.symbol}
                    </td>
                    <td className="py-2">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{
                          backgroundColor:
                            fill.side === 'BUY'
                              ? 'var(--color-positive-bg)'
                              : 'var(--color-negative-bg)',
                          color:
                            fill.side === 'BUY'
                              ? 'var(--color-positive)'
                              : 'var(--color-negative)',
                          border: `1px solid ${
                            fill.side === 'BUY'
                              ? 'var(--color-positive-border)'
                              : 'var(--color-negative-border)'
                          }`,
                        }}
                      >
                        {fill.side}
                      </span>
                    </td>
                    <td
                      className="py-2 text-right"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {fill.qty.toLocaleString()}
                    </td>
                    <td
                      className="py-2 text-right font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      ${fill.price.toFixed(2)}
                    </td>
                    <td
                      className="py-2 text-right font-medium"
                      style={{ color: 'var(--color-negative)' }}
                    >
                      +{fill.slippageBps} bps
                    </td>
                    <td
                      className="py-2 text-right font-medium"
                      style={{ color: 'var(--color-positive)' }}
                    >
                      {fill.latencyMs} ms
                    </td>
                    <td
                      className="py-2 text-right text-[10px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {fill.engine}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedSubTab === 'RISK' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1">
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Value at Risk (VaR 99% - 1D)
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--color-negative)' }}
              >
                $184,200
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Within 1.2% allowable limit
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Sortino Ratio (Downside Adj)
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--accent-primary)' }}
              >
                3.12
              </div>
              <div
                className="text-[10px] mt-1 font-medium"
                style={{ color: 'var(--color-positive)' }}
              >
                Excess return vs downside semivariance
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Turnaround Ratio (Recovery Factor)
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--color-positive)' }}
              >
                11.34x
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Total Net PnL / Maximum Peak Drawdown
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Beta to S&P 500
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--accent-primary)' }}
              >
                0.42
              </div>
              <div
                className="text-[10px] mt-1 font-medium"
                style={{ color: 'var(--color-positive)' }}
              >
                Market neutral target met
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Gross Leverage
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--text-primary)' }}
              >
                1.68x
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Cap: 2.50x Max
              </div>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-[10px] font-mono-val mb-1" style={{ color: 'var(--text-muted)' }}>
                Sharpe Ratio
              </div>
              <div
                className="text-[18px] font-bold font-mono-val"
                style={{ color: 'var(--color-positive)' }}
              >
                2.14
              </div>
              <div className="text-[10px] mt-1 font-medium" style={{ color: 'var(--color-positive)' }}>
                Above 2.0 institutional benchmark
              </div>
            </div>
          </div>
        )}

        {selectedSubTab === 'PARAMETERS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 font-mono-val text-[11px]">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Momentum Lookback (Half-Life)</span>
                  <span style={{ color: 'var(--accent-primary)' }} className="font-semibold">
                    14.5 Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="48"
                  defaultValue="14"
                  className="w-full cursor-pointer h-1.5 rounded"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Volatility Sizing Multiplier</span>
                  <span style={{ color: 'var(--accent-primary)' }} className="font-semibold">
                    1.25x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  defaultValue="1.25"
                  className="w-full cursor-pointer h-1.5 rounded"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Max Position Weight</span>
                  <span style={{ color: 'var(--accent-primary)' }} className="font-semibold">
                    8.0%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  defaultValue="8"
                  className="w-full cursor-pointer h-1.5 rounded"
                  style={{ accentColor: 'var(--accent-primary)' }}
                />
              </div>
              <div>
                <div className="flex justify-between mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Stop Loss Threshold</span>
                  <span style={{ color: 'var(--color-negative)' }} className="font-semibold">
                    -2.5%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  defaultValue="2.5"
                  className="w-full cursor-pointer h-1.5 rounded"
                  style={{ accentColor: 'var(--color-negative)' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Halt Modal Confirmation */}
      {showHaltModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="bento-card rounded-xl max-w-md w-full p-4 shadow-xl space-y-3"
            style={{
              borderColor: 'var(--color-negative-border)',
            }}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" style={{ color: 'var(--color-negative)' }} />
              <h3
                className="font-bold text-[15px]"
                style={{ color: 'var(--text-primary)' }}
              >
                EMERGENCY HALT STRATEGY
              </h3>
            </div>
            <p
              className="text-[12px] leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Halting <strong style={{ color: 'var(--accent-primary)' }}>Alpha_Omega_v2.4</strong> will immediately:
              <br />• Cancel all resting Limit orders on active exchanges.
              <br />• Cease automated algorithmic quote generations.
              <br />• Switch order routing to passive containment mode.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowHaltModal(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-mono-val font-medium cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmHalt}
                className="px-4 py-1.5 rounded-lg text-[11px] font-mono-val font-semibold cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-negative)',
                  color: '#ffffff',
                }}
              >
                Confirm Halt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
