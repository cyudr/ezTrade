import React, { useState } from 'react';
import {
  Download,
  Plus,
  Filter,
  PieChart,
  Search,
  MoreVertical,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PositionItem, WatchlistItem, SectorAllocation } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { getUniverseTicker } from '../data/tickerVerse';

interface PortfolioSummaryProps {
  positions: PositionItem[];
  watchlist: WatchlistItem[];
  sectors: SectorAllocation[];
  nav: number;
  dayPnlPct: number;
  searchQuery?: string;
  onExecuteOrder: (order: {
    ticker: string;
    side: 'BUY' | 'SELL';
    qty: number;
    type: string;
    limitPrice: number;
  }) => void;
  onOpenNewAllocation: () => void;
  onExportCsv?: () => void;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  positions,
  watchlist,
  sectors,
  nav,
  dayPnlPct,
  searchQuery = '',
  onExecuteOrder,
  onOpenNewAllocation,
  onExportCsv,
}) => {
  const { formatMoney, currencySymbol } = useCurrency();
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderTicker, setOrderTicker] = useState('AMD');
  const [orderQty, setOrderQty] = useState(1000);
  const [orderType, setOrderType] = useState('LMT');
  const [limitPrice, setLimitPrice] = useState('165.50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTicker, setFilterTicker] = useState(searchQuery);

  React.useEffect(() => {
    if (searchQuery !== undefined) {
      setFilterTicker(searchQuery);
    }
  }, [searchQuery]);

  const dayPnlDollars = (nav * dayPnlPct) / 100;

  const handleQuickOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTicker || orderQty <= 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onExecuteOrder({
        ticker: orderTicker.toUpperCase(),
        side: orderSide,
        qty: orderQty,
        type: orderType,
        limitPrice: parseFloat(limitPrice) || 165.5,
      });

      setIsSubmitting(false);

      // Confetti effect
      try {
        confetti({
          particleCount: 40,
          spread: 40,
          origin: { y: 0.7 },
          colors: orderSide === 'BUY' ? ['#4ae176', '#6bff8f'] : ['#ffb4ab', '#ff5451'],
        });
      } catch (err) {
        // benign
      }
    }, 350);
  };

  const handleSelectFromWatchlist = (item: WatchlistItem) => {
    setOrderTicker(item.ticker);
    setOrderSide(item.signal === 'SELL' ? 'SELL' : 'BUY');
    const uTicker = getUniverseTicker(item.ticker);
    if (uTicker) {
      setLimitPrice(uTicker.price.toFixed(2));
    } else {
      setLimitPrice('150.00');
    }
  };

  const effectiveFilter = filterTicker.toLowerCase().trim();

  const filteredPositions = positions.filter((p) => {
    if (!effectiveFilter) return true;
    return (
      p.ticker.toLowerCase().includes(effectiveFilter) ||
      (p as any).name?.toLowerCase().includes(effectiveFilter)
    );
  });

  const filteredWatchlist = watchlist.filter((item) => {
    if (!effectiveFilter) return true;
    return (
      item.ticker.toLowerCase().includes(effectiveFilter) ||
      item.name?.toLowerCase().includes(effectiveFilter)
    );
  });

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Header Module */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-1 gap-3">
        <div>
          <h1
            className="font-bold text-[24px] tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Portfolio Summary
          </h1>
          <p
            className="font-mono-val text-[12px] mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            NAV:{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {formatMoney(nav, 2)}
            </strong>{' '}
            | Day PnL:{' '}
            <strong style={{ color: 'var(--color-positive)' }}>
              +{dayPnlPct.toFixed(2)}% (+{formatMoney(dayPnlDollars, 0)})
            </strong>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="export-portfolio-btn"
            onClick={onExportCsv}
            className="font-mono-val text-[11px] uppercase px-3.5 py-1.5 rounded-lg flex items-center transition-all cursor-pointer font-medium"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </button>
          <button
            id="new-allocation-btn"
            onClick={onOpenNewAllocation}
            className="font-mono-val text-[11px] font-semibold uppercase px-3.5 py-1.5 rounded-lg flex items-center transition-all cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Allocation
          </button>
        </div>
      </div>

      {/* Bento Grid Row 1: Active Positions + Allocation */}
      <div className="grid grid-cols-12 gap-3">
        {/* Active Positions Bento Card */}
        <div
          id="active-positions-card"
          className="bento-card col-span-12 lg:col-span-8 rounded-xl flex flex-col p-3.5 h-[390px]"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3
              className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              Active Positions ({positions.length})
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filterTicker}
                onChange={(e) => setFilterTicker(e.target.value)}
                placeholder="Filter ticker..."
                className="rounded-md px-2 py-0.5 text-[11px] font-mono-val focus:outline-none w-28"
                style={{
                  backgroundColor: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar">
            <table className="w-full text-left border-collapse font-mono-val text-[11px]">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-card)' }}>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="pb-2 font-medium">TICKER</th>
                  <th className="pb-2 font-medium text-right">SIZE</th>
                  <th className="pb-2 font-medium text-right">ENTRY</th>
                  <th className="pb-2 font-medium text-right">LAST</th>
                  <th className="pb-2 font-medium text-right">UNREALIZED PNL</th>
                  <th className="pb-2 font-medium text-right">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPositions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr
                      key={pos.id}
                      onClick={() => {
                        setOrderTicker(pos.ticker);
                        setLimitPrice(pos.lastPrice.toFixed(2));
                      }}
                      className="border-b transition-colors group cursor-pointer"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <td className="py-2.5 flex items-center">
                        <div
                          className="w-2 h-2 rounded-full mr-2 shrink-0"
                          style={{ backgroundColor: pos.color }}
                        />
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {pos.ticker}
                        </span>
                      </td>
                      <td className="py-2.5 text-right" style={{ color: 'var(--text-primary)' }}>
                        {pos.size.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {pos.entryPrice.toFixed(2)}
                      </td>
                      <td
                        className="py-2.5 text-right font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {pos.lastPrice.toFixed(2)}
                      </td>
                      <td
                        className="py-2.5 text-right font-semibold"
                        style={{
                          color: isProfit ? 'var(--color-positive)' : 'var(--color-negative)',
                        }}
                      >
                        {isProfit ? '+' : ''}{formatMoney(pos.unrealizedPnl, 2)}
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className="px-2 py-0.5 rounded text-[9px] font-semibold"
                          style={{
                            backgroundColor:
                              pos.status === 'ACTIVE'
                                ? 'var(--color-positive-bg)'
                                : 'var(--color-neutral-badge-bg)',
                            color:
                              pos.status === 'ACTIVE'
                                ? 'var(--color-positive)'
                                : 'var(--color-neutral-badge-text)',
                            border: `1px solid ${
                              pos.status === 'ACTIVE'
                                ? 'var(--color-positive-border)'
                                : 'var(--border-subtle)'
                            }`,
                          }}
                        >
                          {pos.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocation (Sector) Bento Card */}
        <div
          id="sector-allocation-card"
          className="bento-card col-span-12 lg:col-span-4 rounded-xl flex flex-col p-3.5 h-[390px]"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3
              className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              Sector Allocation
            </h3>
            <PieChart className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center relative">
            {/* SVG Donut Ring */}
            <div className="w-40 h-40 rounded-full relative flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Sector 1: Tech (45%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--accent-primary)"
                  strokeWidth="11"
                  strokeDasharray="107.4 238.7"
                  strokeDashoffset="0"
                />
                {/* Sector 2: Healthcare (25%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--color-positive)"
                  strokeWidth="11"
                  strokeDasharray="59.7 238.7"
                  strokeDashoffset="-107.4"
                />
                {/* Sector 3: Financials (15%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--color-negative)"
                  strokeWidth="11"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-167.1"
                />
                {/* Sector 4: Other (15%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="var(--text-muted)"
                  strokeWidth="11"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-202.9"
                />
              </svg>
              <div className="absolute text-center">
                <span
                  className="font-mono-val text-[22px] font-bold block leading-none"
                  style={{ color: 'var(--text-primary)' }}
                >
                  100%
                </span>
                <span
                  className="font-mono-val text-[9px] tracking-wider mt-1 block uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ALLOCATED
                </span>
              </div>
            </div>

            <div className="w-full mt-3 space-y-1 font-mono-val text-[11px]">
              {sectors.map((sec) => (
                <div key={sec.name} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="w-2 h-2 rounded mr-2 shrink-0"
                      style={{ backgroundColor: sec.color }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{sec.name}</span>
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {sec.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Row 2: Quant Watchlist + Quick Order Widget */}
      <div className="grid grid-cols-12 gap-3">
        {/* Custom Quant Watchlist */}
        <div
          id="watchlist-card"
          className="bento-card col-span-12 lg:col-span-7 rounded-xl flex flex-col p-3.5 min-h-[290px]"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3
              className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              Quant Watchlist
            </h3>
            <div className="flex gap-2" style={{ color: 'var(--text-muted)' }}>
              <Search className="w-3.5 h-3.5 cursor-pointer hover:opacity-100" />
              <MoreVertical className="w-3.5 h-3.5 cursor-pointer hover:opacity-100" />
            </div>
          </div>

          <div className="flex-grow overflow-y-auto">
            <table className="w-full text-left border-collapse font-mono-val text-[11px]">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="pb-2 font-medium">TICKER</th>
                  <th className="pb-2 font-medium text-right">BETA (1Y)</th>
                  <th className="pb-2 font-medium text-right">VOL (30D)</th>
                  <th className="pb-2 font-medium text-right">DIST 200d MA</th>
                  <th className="pb-2 font-medium text-right">SIGNAL</th>
                </tr>
              </thead>
              <tbody>
                {filteredWatchlist.map((item) => {
                  const isDistPos = item.dist200dMa >= 0;
                  return (
                    <tr
                      key={item.ticker}
                      onClick={() => handleSelectFromWatchlist(item)}
                      className="border-b transition-colors cursor-pointer group"
                      style={{ borderColor: 'var(--border-subtle)' }}
                      title="Click to populate Quick Order"
                    >
                      <td className="py-2">
                        <span
                          className="font-semibold"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {item.ticker}
                        </span>
                        {item.name && (
                          <span
                            className="text-[10px] ml-2 hidden sm:inline"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {item.name}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {item.beta.toFixed(2)}
                      </td>
                      <td className="py-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {item.volatility30d}
                      </td>
                      <td
                        className="py-2 text-right font-semibold"
                        style={{
                          color: isDistPos ? 'var(--color-positive)' : 'var(--color-negative)',
                        }}
                      >
                        {isDistPos ? '+' : ''}
                        {item.dist200dMa.toFixed(1)}%
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className="font-semibold text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor:
                              item.signal === 'BUY'
                                ? 'var(--color-positive-bg)'
                                : item.signal === 'SELL'
                                ? 'var(--color-negative-bg)'
                                : 'var(--color-neutral-badge-bg)',
                            color:
                              item.signal === 'BUY'
                                ? 'var(--color-positive)'
                                : item.signal === 'SELL'
                                ? 'var(--color-negative)'
                                : 'var(--color-neutral-badge-text)',
                            border: `1px solid ${
                              item.signal === 'BUY'
                                ? 'var(--color-positive-border)'
                                : item.signal === 'SELL'
                                ? 'var(--color-negative-border)'
                                : 'var(--border-subtle)'
                            }`,
                          }}
                        >
                          {item.signal}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Entry Widget */}
        <div
          id="quick-order-card"
          className="bento-card col-span-12 lg:col-span-5 rounded-xl flex flex-col p-3.5 min-h-[290px] relative overflow-hidden"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b relative z-10"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3
              className="font-mono-val text-[11px] font-bold uppercase tracking-wider"
              style={{ color: 'var(--text-primary)' }}
            >
              Quick Order Entry
            </h3>
            <ExternalLink className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </div>

          <form onSubmit={handleQuickOrder} className="flex flex-col gap-2.5 relative z-10">
            {/* BUY / SELL Switch */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderSide('BUY')}
                className="flex-1 font-mono-val text-[11px] py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    orderSide === 'BUY'
                      ? 'var(--color-positive-bg)'
                      : 'var(--bg-card-subtle)',
                  color:
                    orderSide === 'BUY'
                      ? 'var(--color-positive)'
                      : 'var(--text-secondary)',
                  border: `1px solid ${
                    orderSide === 'BUY'
                      ? 'var(--color-positive-border)'
                      : 'var(--border-subtle)'
                  }`,
                }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('SELL')}
                className="flex-1 font-mono-val text-[11px] py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
                style={{
                  backgroundColor:
                    orderSide === 'SELL'
                      ? 'var(--color-negative-bg)'
                      : 'var(--bg-card-subtle)',
                  color:
                    orderSide === 'SELL'
                      ? 'var(--color-negative)'
                      : 'var(--text-secondary)',
                  border: `1px solid ${
                    orderSide === 'SELL'
                      ? 'var(--color-negative-border)'
                      : 'var(--border-subtle)'
                  }`,
                }}
              >
                SELL
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <label
                  className="font-mono-val text-[10px] block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  TICKER
                </label>
                <input
                  type="text"
                  value={orderTicker}
                  onChange={(e) => setOrderTicker(e.target.value.toUpperCase())}
                  className="w-full rounded-lg p-1.5 font-mono-val text-[12px] uppercase focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  className="font-mono-val text-[10px] block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  QTY
                </label>
                <input
                  type="number"
                  value={orderQty}
                  onChange={(e) => setOrderQty(parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg p-1.5 font-mono-val text-[12px] focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  min="1"
                  required
                />
              </div>

              <div>
                <label
                  className="font-mono-val text-[10px] block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  TYPE
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="w-full rounded-lg p-1.5 font-mono-val text-[12px] focus:outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="LMT">LMT</option>
                  <option value="MKT">MKT</option>
                  <option value="STP">STP</option>
                </select>
              </div>

              <div className="col-span-2">
                <label
                  className="font-mono-val text-[10px] block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  LIMIT PRICE ($)
                </label>
                <input
                  type="text"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full rounded-lg p-1.5 font-mono-val text-[12px] text-right focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>
            </div>

            <button
              id="submit-order-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full font-mono-val text-[12px] py-2 rounded-lg mt-1 transition-all font-semibold cursor-pointer"
              style={{
                backgroundColor:
                  orderSide === 'BUY' ? 'var(--accent-primary)' : 'var(--color-negative)',
                color: '#ffffff',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              {isSubmitting ? 'ROUTING ORDER...' : 'SUBMIT ORDER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
