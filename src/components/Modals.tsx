import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sliders,
  Keyboard,
  Check,
  Trash2,
  Globe,
  Clock,
  Server,
  Activity,
  Zap,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { TerminalNotification } from '../types';
import { useTimezone, TIMEZONE_OPTIONS } from '../context/TimezoneContext';
import {
  fetchApiHealth,
  fetchLtaCarparks,
  fetchOneMapSearch,
  fetchFrankfurterLatest,
  fetchCoinGeckoPrices,
  fetchLocalSignalData,
} from '../services/apiService';

interface NewAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (allocation: {
    strategyName: string;
    targetAsset: string;
    amount: number;
    benchmark: string;
    riskLimitPct: number;
  }) => void;
}

export const NewAllocationModal: React.FC<NewAllocationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [strategyName, setStrategyName] = useState('ALPHA_MOMENTUM_EXP');
  const [targetAsset, setTargetAsset] = useState('NVDA');
  const [amount, setAmount] = useState(250000);
  const [benchmark, setBenchmark] = useState('NASDAQ 100');
  const [riskLimitPct, setRiskLimitPct] = useState(3.5);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      strategyName,
      targetAsset,
      amount,
      benchmark,
      riskLimitPct,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bento-card rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <h3
              className="font-bold text-[15px] tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              PROVISION NEW CAPITAL ALLOCATION
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 font-mono-val text-[11px]">
          <div>
            <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>
              STRATEGY / ALPHA NAME
            </label>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="w-full rounded-lg p-2 focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>
                TARGET ASSET / TICKER
              </label>
              <input
                type="text"
                value={targetAsset}
                onChange={(e) => setTargetAsset(e.target.value.toUpperCase())}
                className="w-full rounded-lg p-2 uppercase focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>
            <div>
              <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>
                ALLOCATION AMOUNT (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg p-2 text-right focus:outline-none"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                min="1000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1" style={{ color: 'var(--text-muted)' }}>
                BENCHMARK INDEX
              </label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full rounded-lg p-2 focus:outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="S&P 500">S&P 500</option>
                <option value="NASDAQ 100">NASDAQ 100</option>
                <option value="Russell 2000">Russell 2000</option>
                <option value="US 10Y Treasury">US 10Y Treasury</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>RISK LIMIT (MAX DD)</span>
                <span style={{ color: 'var(--color-negative)' }} className="font-semibold">
                  -{riskLimitPct}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={riskLimitPct}
                onChange={(e) => setRiskLimitPct(parseFloat(e.target.value))}
                className="w-full cursor-pointer mt-2"
                style={{ accentColor: 'var(--color-negative)' }}
              />
            </div>
          </div>

          <div
            className="flex justify-end gap-2 pt-3 border-t"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold rounded-lg text-[11px] cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              DEPLOY ALLOCATION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TerminalNotification[];
  onMarkAllRead: () => void;
  onClear: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bento-card rounded-xl max-w-md w-full p-4 shadow-2xl flex flex-col max-h-[80vh]">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h3
              className="font-bold text-[14px]"
              style={{ color: 'var(--text-primary)' }}
            >
              System Notifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="flex justify-between items-center py-2 text-[11px] font-mono-val border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onMarkAllRead}
            className="hover:underline flex items-center gap-1 cursor-pointer font-medium"
            style={{ color: 'var(--accent-primary)' }}
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
          <button
            onClick={onClear}
            className="hover:underline flex items-center gap-1 cursor-pointer font-medium"
            style={{ color: 'var(--color-negative)' }}
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 py-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div
              className="text-center py-8 font-mono-val text-[11px]"
              style={{ color: 'var(--text-muted)' }}
            >
              No active notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-lg border text-[11px] font-mono-val transition-colors"
                style={{
                  backgroundColor: !n.read ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                  borderColor: !n.read ? 'var(--accent-primary)' : 'var(--border-subtle)',
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {n.type === 'success' && (
                      <CheckCircle
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--color-positive)' }}
                      />
                    )}
                    {n.type === 'warning' && (
                      <AlertTriangle
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--color-negative)' }}
                      />
                    )}
                    {n.type === 'error' && (
                      <ShieldAlert
                        className="w-3.5 h-3.5"
                        style={{ color: 'var(--color-negative)' }}
                      />
                    )}
                    {n.type === 'info' && (
                      <Info className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    )}
                    <span style={{ color: 'var(--text-primary)' }}>{n.title}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {n.time}
                  </span>
                </div>
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {n.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLiveTicking: boolean;
  onToggleLiveTicking: () => void;
  apiConfig?: {
    frankfurterEnabled: boolean;
    coinGeckoEnabled: boolean;
    coinGeckoApiKey: string;
    localSignalEndpoint: string;
    localSignalMode: 'auto_fallback' | 'local_only' | 'simulated_only';
    localSignalStatus: 'connected' | 'offline' | 'checking' | 'error';
  };
  onUpdateApiConfig?: (newConfig: any) => void;
  onTestLocalApi?: () => Promise<void>;
  onOpenSignalSpec?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isLiveTicking,
  onToggleLiveTicking,
  apiConfig,
  onUpdateApiConfig,
  onOpenSignalSpec,
}) => {
  const [activeTab, setActiveTab] = useState<'TIMEZONE' | 'APIS' | 'LOCAL'>('TIMEZONE');
  const [latencyGuard, setLatencyGuard] = useState(true);
  const [dmaRoute, setDmaRoute] = useState('Direct Ultra-Low (NY4)');
  const [localUrl, setLocalUrl] = useState(
    apiConfig?.localSignalEndpoint || 'http://localhost:8000/api/signals'
  );
  const [cgKey, setCgKey] = useState(apiConfig?.coinGeckoApiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // API Verification state for serverless endpoints
  const [apiStatuses, setApiStatuses] = useState<Record<string, { status: string; latency?: number; details?: string }>>({});
  const [isVerifyingApis, setIsVerifyingApis] = useState(false);

  const { timezone, setTimezone, activeOption, currentTime, formatTime, formatDate } = useTimezone();

  if (!isOpen) return null;

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const startTime = performance.now();
      const res = await fetch(localUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2500),
      });
      const latency = Math.round(performance.now() - startTime);
      if (res.ok) {
        setTestResult(`🟢 Connected (${latency}ms) - HTTP ${res.status}`);
      } else {
        setTestResult(`🟡 Server reached but returned HTTP ${res.status}`);
      }
    } catch (e: any) {
      setTestResult(`⚪ Local server offline / unreachable (Fallback active)`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleVerifyServerlessApis = async () => {
    setIsVerifyingApis(true);
    const results: Record<string, { status: string; latency?: number; details?: string }> = {};

    const endpoints = [
      { name: '/api/health', fetcher: fetchApiHealth },
      { name: '/api/lta/carparks', fetcher: fetchLtaCarparks },
      { name: '/api/onemap/search', fetcher: () => fetchOneMapSearch('Marina Bay') },
      { name: '/api/market/latest', fetcher: () => fetchFrankfurterLatest('SGD', ['USD', 'EUR', 'JPY']) },
      { name: '/api/crypto/prices', fetcher: () => fetchCoinGeckoPrices(['bitcoin', 'ethereum'], ['sgd', 'usd'], cgKey) },
      { name: '/api/signals', fetcher: () => fetchLocalSignalData(localUrl) },
    ];

    for (const ep of endpoints) {
      const start = performance.now();
      try {
        const data = await ep.fetcher();
        const latency = Math.round(performance.now() - start);
        results[ep.name] = {
          status: 'SUCCESS',
          latency,
          details: typeof data === 'object' ? JSON.stringify(data).slice(0, 70) + '...' : 'OK',
        };
      } catch (err: any) {
        results[ep.name] = {
          status: 'OFFLINE_OR_FALLBACK',
          latency: Math.round(performance.now() - start),
          details: err?.message || 'Fallback mode',
        };
      }
    }

    setApiStatuses(results);
    setIsVerifyingApis(false);
  };

  const handleSave = () => {
    if (onUpdateApiConfig) {
      onUpdateApiConfig({
        ...apiConfig,
        localSignalEndpoint: localUrl,
        coinGeckoApiKey: cgKey,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bento-card rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4 font-mono-val max-h-[85vh] overflow-y-auto custom-scrollbar">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h3
              className="font-bold text-[14px]"
              style={{ color: 'var(--text-primary)' }}
            >
              Terminal Configuration & System Engine
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2 text-[11px]" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('TIMEZONE')}
            className="px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'TIMEZONE' ? 'var(--accent-subtle)' : 'transparent',
              color: activeTab === 'TIMEZONE' ? 'var(--accent-text)' : 'var(--text-muted)',
              border: activeTab === 'TIMEZONE' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Timezone & Clock</span>
          </button>
          <button
            onClick={() => setActiveTab('APIS')}
            className="px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'APIS' ? 'var(--accent-subtle)' : 'transparent',
              color: activeTab === 'APIS' ? 'var(--accent-text)' : 'var(--text-muted)',
              border: activeTab === 'APIS' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            }}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Serverless API Routes</span>
          </button>
          <button
            onClick={() => setActiveTab('LOCAL')}
            className="px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === 'LOCAL' ? 'var(--accent-subtle)' : 'transparent',
              color: activeTab === 'LOCAL' ? 'var(--accent-text)' : 'var(--text-muted)',
              border: activeTab === 'LOCAL' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            }}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Local Engine & Market</span>
          </button>
        </div>

        <div className="space-y-3 text-[11px]">
          {/* 1. TIMEZONE TAB */}
          {activeTab === 'TIMEZONE' && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg border space-y-2.5"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider">
                  <span style={{ color: 'var(--accent-primary)' }}>Terminal Active Timezone</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {formatTime()} • {formatDate()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
                    Select Primary Timezone (All charts, feeds, and orders synchronize instantly):
                  </label>
                  <select
                    id="modal-timezone-select"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    aria-label="Select Primary Timezone"
                    className="w-full rounded-lg p-2 text-[12px] font-mono-val focus:outline-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.flag} {opt.label} ({opt.offset})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* World Financial Centers Clock Grid */}
              <div
                className="p-3 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Global Financial Centers (Live Time)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TIMEZONE_OPTIONS.slice(0, 6).map((opt) => {
                    const isSelected = timezone === opt.id;
                    const cityTime = new Intl.DateTimeFormat('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                      timeZone: opt.id,
                    }).format(currentTime);

                    return (
                      <button
                        key={opt.id}
                        onClick={() => setTimezone(opt.id)}
                        className="p-2 rounded-lg border text-left flex items-center justify-between cursor-pointer transition-all"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card)',
                          borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{opt.flag}</span>
                          <div>
                            <div className="font-semibold text-[11px] leading-tight" style={{ color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                              {opt.city}
                            </div>
                            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                              {opt.code} • {opt.offset}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono-val font-bold text-[11px]" style={{ color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                          {cityTime}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Execution & Latency Settings */}
              <div className="flex justify-between items-center pt-1">
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    DMA Routing Gateway
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Primary execution exchange co-lo
                  </div>
                </div>
                <select
                  value={dmaRoute}
                  onChange={(e) => setDmaRoute(e.target.value)}
                  className="rounded-lg p-1 text-[11px] focus:outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <option value="Direct Ultra-Low (NY4)">NY4 (Secaucus)</option>
                  <option value="Equinix (LD4)">LD4 (Slough)</option>
                  <option value="Tokyo (TY3)">TY3 (Tokyo)</option>
                  <option value="Singapore (SG1)">SG1 (Jurong West)</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. SERVERLESS APIS TAB */}
          {activeTab === 'APIS' && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                    Serverless API Endpoints (/api/*)
                  </div>
                  <button
                    onClick={handleVerifyServerlessApis}
                    disabled={isVerifyingApis}
                    className="px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifyingApis ? 'animate-spin' : ''}`} />
                    {isVerifyingApis ? 'Verifying...' : 'Verify All Endpoints'}
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Configured according to standard serverless architecture (root <code className="text-[10px]">api/</code> directory with dedicated route handlers).
                </p>

                <div className="space-y-1.5 pt-1">
                  {[
                    { path: '/api/health', desc: 'System status & uptime checker' },
                    { path: '/api/lta/carparks', desc: 'Singapore LTA DataMall v2 live bridge' },
                    { path: '/api/onemap/search', desc: 'OneMap Singapore geo search API' },
                    { path: '/api/market/latest', desc: 'Frankfurter FX reference rate proxy' },
                    { path: '/api/crypto/prices', desc: 'CoinGecko multi-asset price proxy' },
                    { path: '/api/signals', desc: 'Quant strategy & heatmap engine' },
                  ].map((ep) => {
                    const result = apiStatuses[ep.path];
                    return (
                      <div
                        key={ep.path}
                        className="p-2 rounded-lg border flex items-center justify-between"
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div>
                          <div className="font-bold text-[11px]" style={{ color: 'var(--text-primary)' }}>
                            {ep.path}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {ep.desc}
                          </div>
                        </div>
                        <div className="text-right">
                          {result ? (
                            <span
                              className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: result.status === 'SUCCESS' ? 'var(--color-positive-bg)' : 'var(--accent-subtle)',
                                color: result.status === 'SUCCESS' ? 'var(--color-positive)' : 'var(--accent-text)',
                                border: `1px solid ${result.status === 'SUCCESS' ? 'var(--color-positive-border)' : 'var(--border-subtle)'}`,
                              }}
                            >
                              {result.status} ({result.latency}ms)
                            </span>
                          ) : (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              READY
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div
                className="p-2.5 rounded-lg border text-[10px] space-y-1"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="font-bold uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
                  Environment Variables Setup (Vercel / Container)
                </div>
                <div>Set <code className="text-[10px]">LTA_ACCOUNT_KEY</code>, <code className="text-[10px]">ONEMAP_EMAIL</code>, <code className="text-[10px]">ONEMAP_PASSWORD</code> in Settings.</div>
              </div>
            </div>
          )}

          {/* 3. LOCAL ENGINE TAB */}
          {activeTab === 'LOCAL' && (
            <div className="space-y-3">
              <div
                className="p-3 rounded-lg border space-y-2.5"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-semibold text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span style={{ color: 'var(--accent-primary)' }}>Local Signal Engine API</span>
                  <button
                    onClick={onOpenSignalSpec}
                    className="hover:underline text-[10px] font-normal cursor-pointer flex items-center gap-1"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    View API Spec / Python Code ↗
                  </button>
                </div>

                <label className="block text-[11px]">
                  <span className="block mb-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Local Signal Endpoint URL:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localUrl}
                      onChange={(e) => setLocalUrl(e.target.value)}
                      placeholder="http://localhost:8000/api/signals"
                      className="flex-1 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={handleTestPing}
                      disabled={isTesting}
                      className="px-3 py-1 rounded-lg text-[10px] font-semibold cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {isTesting ? 'Pinging...' : 'Test Ping'}
                    </button>
                  </div>
                </label>

                {testResult && (
                  <div
                    className="text-[10px] p-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {testResult}
                  </div>
                )}
              </div>

              {/* Data Sources Section */}
              <div
                className="p-3 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Crypto API Configuration
                </div>
                <label className="text-[10px] block" style={{ color: 'var(--text-muted)' }}>
                  Optional CoinGecko API Key (Header: x-cg-demo-api-key)
                </label>
                <input
                  type="text"
                  value={cgKey}
                  placeholder="Leave blank for keyless public tier"
                  onChange={(e) => setCgKey(e.target.value)}
                  className="w-full rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="pt-3 border-t flex justify-end gap-2"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 font-semibold rounded-lg text-[11px] cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};


export const SignalApiSpecModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  localEndpoint: string;
}> = ({ isOpen, onClose, localEndpoint }) => {
  const [activeTab, setActiveTab] = useState<'fastapi' | 'json' | 'flask'>('fastapi');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonFastApiCode = `# requirements: pip install fastapi uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import random

app = FastAPI(title="Quant Signal Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/signals")
def get_signals():
    assets = ["BTC", "ETH", "SOL", "AVAX"]
    hours = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"]
    
    signals = []
    for asset in assets:
        for hour in hours:
            strength = round(random.uniform(0.1, 0.99), 2)
            heat_level = int(1 + strength * 4)  # 1 to 5
            signals.append({
                "asset": asset,
                "hour": hour,
                "heatLevel": heat_level,
                "strength": strength
            })
            
    return {
        "status": "ok",
        "strategyId": "LOCAL_MOMENTUM_ML_V1",
        "marketBias": "BULLISH",
        "activeSignalsCount": len(signals),
        "signals": signals,
        "performance": {
            "totalReturn": 168.4,
            "cagr": 36.2,
            "maxDrawdown": -10.4,
            "sharpeRatio": 2.38,
            "winRate": 71.2,
            "totalTrades": 1520
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
`;

  const jsonSchemaCode = `{
  "status": "ok",
  "strategyId": "LOCAL_ALPHA_V1",
  "marketBias": "BULLISH",
  "signals": [
    { "asset": "BTC", "hour": "10:00", "heatLevel": 5, "strength": 0.95 },
    { "asset": "ETH", "hour": "10:00", "heatLevel": 4, "strength": 0.81 }
  ],
  "performance": {
    "totalReturn": 145.2,
    "cagr": 32.4,
    "maxDrawdown": -12.8,
    "sharpeRatio": 2.14,
    "winRate": 68.5,
    "totalTrades": 1402
  }
}`;

  const currentCode = activeTab === 'fastapi' ? pythonFastApiCode : jsonSchemaCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bento-card rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 font-mono-val max-h-[85vh] flex flex-col">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <h3
              className="font-bold text-[14px]"
              style={{ color: 'var(--text-primary)' }}
            >
              Local Signal Engine Integration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="text-[11px] leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          The terminal is ready to connect directly to your local algorithms. Run a simple local
          endpoint serving JSON signals, or rely on the seamless fallback engine when offline.
        </div>

        <div className="flex justify-between items-center pt-1">
          <div className="flex gap-2 text-[10px]">
            <button
              onClick={() => setActiveTab('fastapi')}
              className="px-3 py-1 rounded-md cursor-pointer font-semibold transition-all"
              style={{
                backgroundColor:
                  activeTab === 'fastapi' ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                color:
                  activeTab === 'fastapi' ? 'var(--accent-text)' : 'var(--text-muted)',
                border: `1px solid ${
                  activeTab === 'fastapi' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }`,
              }}
            >
              Python (FastAPI)
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className="px-3 py-1 rounded-md cursor-pointer font-semibold transition-all"
              style={{
                backgroundColor:
                  activeTab === 'json' ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                color:
                  activeTab === 'json' ? 'var(--accent-text)' : 'var(--text-muted)',
                border: `1px solid ${
                  activeTab === 'json' ? 'var(--accent-primary)' : 'var(--border-subtle)'
                }`,
              }}
            >
              JSON Schema
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5" style={{ color: 'var(--color-positive)' }} />
            ) : null}
            {copied ? 'Copied to Clipboard!' : 'Copy Code'}
          </button>
        </div>

        <div
          className="flex-1 rounded-lg p-3 overflow-y-auto text-[11px] custom-scrollbar border"
          style={{
            backgroundColor: 'var(--bg-app)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--accent-primary)',
          }}
        >
          <pre className="whitespace-pre font-mono-val">{currentCode}</pre>
        </div>

        <div
          className="pt-2 border-t flex justify-between items-center text-[10px]"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <span>
            Endpoint: <strong style={{ color: 'var(--text-primary)' }}>{localEndpoint}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold rounded-lg text-[11px] cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
};

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { key: '1', desc: 'Switch to Market Overview' },
    { key: '2', desc: 'Switch to Research Terminal' },
    { key: '3', desc: 'Switch to Signals & Backtest' },
    { key: '4', desc: 'Switch to Strategy Performance' },
    { key: '5', desc: 'Switch to Portfolio Summary' },
    { key: 'R', desc: 'Run Active Backtest Simulation' },
    { key: 'B', desc: 'Switch Quick Order to BUY' },
    { key: 'S', desc: 'Switch Quick Order to SELL' },
    { key: '/', desc: 'Focus Global Search' },
    { key: 'ESC', desc: 'Close open modal or drawer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bento-card rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 font-mono-val">
        <div
          className="flex justify-between items-center pb-3 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h3
              className="font-bold text-[14px]"
              style={{ color: 'var(--text-primary)' }}
            >
              Terminal Hotkeys & Docs
            </h3>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-[11px]">
          {hotkeys.map((h) => (
            <div
              key={h.key}
              className="flex justify-between items-center py-1.5 px-2.5 rounded-lg border"
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{h.desc}</span>
              <kbd
                className="px-2 py-0.5 rounded border font-semibold text-[10px]"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                }}
              >
                {h.key}
              </kbd>
            </div>
          ))}
        </div>

        <div
          className="pt-3 border-t flex justify-end"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold rounded-lg text-[11px] cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
