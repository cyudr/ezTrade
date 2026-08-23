import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Rss,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { TickerItem, SentimentItem } from '../types';
import { CORRELATION_MATRICES } from '../data/mockData';

interface MarketOverviewProps {
  tickers: TickerItem[];
  sentimentFeed: SentimentItem[];
  onSelectTicker?: (symbol: string) => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  tickers,
  sentimentFeed,
  onSelectTicker,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'1W' | '30D' | '90D'>('30D');
  const [activeSentimentFilter, setActiveSentimentFilter] = useState<
    'ALL' | 'HAWKISH' | 'BEARISH' | 'NEUTRAL'
  >('ALL');
  const [hoveredCell, setHoveredCell] = useState<{ row: string; col: string; val: number } | null>(
    null
  );

  const [selectedAssetCategory, setSelectedAssetCategory] = useState<
    'INDICES' | 'FX_SGD' | 'CRYPTO_SGD'
  >('INDICES');

  const spx = tickers.find((t) => t.symbol === 'SPX') || tickers[0];
  const ndx = tickers.find((t) => t.symbol === 'NDX') || tickers[1];
  const vix = tickers.find((t) => t.symbol === 'VIX') || tickers[2];

  const usdSgd = tickers.find((t) => t.symbol === 'USDSGD') || {
    symbol: 'USDSGD',
    price: 1.342,
    changePct: 0.05,
    sparkline: [1.34, 1.341, 1.3415, 1.342],
  };
  const eurSgd = tickers.find((t) => t.symbol === 'EURSGD') || {
    symbol: 'EURSGD',
    price: 1.458,
    changePct: -0.12,
    sparkline: [1.46, 1.459, 1.4585, 1.458],
  };
  const sgdJpy = tickers.find((t) => t.symbol === 'SGDJPY') || {
    symbol: 'SGDJPY',
    price: 115.42,
    changePct: 0.28,
    sparkline: [115.1, 115.2, 115.35, 115.42],
  };

  const btcSgd = tickers.find((t) => t.symbol === 'BTCSGD' || t.symbol === 'BTCUSD') || {
    symbol: 'BTCSGD',
    price: 128450,
    changePct: 2.15,
    sparkline: [126000, 127200, 128100, 128450],
  };
  const ethSgd = tickers.find((t) => t.symbol === 'ETHSGD' || t.symbol === 'ETHUSD') || {
    symbol: 'ETHSGD',
    price: 4520,
    changePct: -1.05,
    sparkline: [4580, 4550, 4530, 4520],
  };
  const solSgd = tickers.find((t) => t.symbol === 'SOLSGD' || t.symbol === 'SOLUSD') || {
    symbol: 'SOLSGD',
    price: 242.8,
    changePct: 4.35,
    sparkline: [232, 236, 240, 242.8],
  };

  const primaryCards =
    selectedAssetCategory === 'FX_SGD'
      ? [
          { item: usdSgd, label: 'USD / SGD (ECB)' },
          { item: eurSgd, label: 'EUR / SGD (ECB)' },
          { item: sgdJpy, label: 'SGD / JPY (ECB)' },
        ]
      : selectedAssetCategory === 'CRYPTO_SGD'
      ? [
          { item: btcSgd, label: 'BTC / SGD' },
          { item: ethSgd, label: 'ETH / SGD' },
          { item: solSgd, label: 'SOL / SGD' },
        ]
      : [
          { item: spx, label: 'S&P 500 IDX' },
          { item: ndx, label: 'NASDAQ 100' },
          { item: vix, label: 'CBOE VIX' },
        ];

  const correlationData = CORRELATION_MATRICES[selectedPeriod];

  const filteredSentiment = sentimentFeed.filter((item) => {
    if (activeSentimentFilter === 'ALL') return true;
    return item.sentiment === activeSentimentFilter;
  });

  // Helper for subtle correlation cell style
  const getCellStyle = (val: number): React.CSSProperties => {
    if (val === 1.0) {
      return {
        backgroundColor: 'var(--bg-card-subtle)',
        color: 'var(--text-muted)',
        fontWeight: 600,
      };
    }
    if (val > 0.6) {
      return {
        backgroundColor: 'var(--color-positive-bg)',
        color: 'var(--color-positive)',
        fontWeight: 700,
      };
    }
    if (val > 0.2) {
      return {
        backgroundColor: 'var(--color-positive-bg)',
        color: 'var(--color-positive)',
        opacity: 0.85,
      };
    }
    if (val >= -0.2) {
      return {
        backgroundColor: 'var(--bg-card-subtle)',
        color: 'var(--text-secondary)',
      };
    }
    if (val >= -0.5) {
      return {
        backgroundColor: 'var(--color-negative-bg)',
        color: 'var(--color-negative)',
        opacity: 0.85,
      };
    }
    return {
      backgroundColor: 'var(--color-negative-bg)',
      color: 'var(--color-negative)',
      fontWeight: 700,
    };
  };

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-6">
      {/* Ticker Tape Banner */}
      <div
        id="ticker-tape"
        className="w-full h-8 overflow-hidden rounded-lg flex items-center font-mono-val text-[11px] select-none transition-colors"
        style={{
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="ticker-animation flex items-center">
          {tickers.concat(tickers).map((t, idx) => {
            const isPos = t.changePct >= 0;
            return (
              <span
                key={`${t.symbol}-${idx}`}
                onClick={() => onSelectTicker && onSelectTicker(t.symbol)}
                className="inline-flex items-center mx-3 gap-1.5 cursor-pointer transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span className="font-bold" style={{ color: 'var(--text-muted)' }}>
                  {t.symbol}
                </span>
                <span
                  className={t.tickStatus ? `tick-${t.tickStatus} font-semibold` : 'font-semibold'}
                  style={{
                    color: isPos ? 'var(--color-positive)' : 'var(--color-negative)',
                  }}
                >
                  {t.price > 1000
                    ? t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })
                    : t.price.toFixed(t.price < 10 ? 4 : 2)}
                </span>
                <span
                  className="text-[10px] opacity-90"
                  style={{ color: isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}
                >
                  {isPos ? `+${t.changePct.toFixed(2)}%` : `${t.changePct.toFixed(2)}%`}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Grid Canvas */}
      <div className="grid grid-cols-12 gap-3">
        {/* Primary Benchmark / FX / Crypto Cards Row */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono-val text-[11px]">
              <span style={{ color: 'var(--text-muted)' }} className="font-semibold">
                ASSET FEED:
              </span>
              {(
                [
                  { id: 'INDICES', label: 'Global Indices' },
                  { id: 'FX_SGD', label: 'SGD Forex (ECB)' },
                  { id: 'CRYPTO_SGD', label: 'SGD Crypto' },
                ] as const
              ).map((cat) => {
                const isSelected = selectedAssetCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedAssetCategory(cat.id)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {primaryCards.map((card, idx) => {
              const item = card.item;
              const isUp = item.changePct >= 0;
              return (
                <div
                  key={`${item.symbol}-${idx}`}
                  id={`card-${item.symbol.toLowerCase()}`}
                  className="bento-card bento-card-interactive rounded-xl p-3.5 flex flex-col justify-between h-[155px] relative overflow-hidden group cursor-pointer transition-all"
                  onClick={() => onSelectTicker && onSelectTicker(item.symbol)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span
                      className="font-mono-val text-[11px] font-semibold tracking-wide uppercase truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {card.label}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: isUp ? 'var(--color-positive)' : 'var(--color-negative)',
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-baseline mb-2">
                    <div
                      className={`font-mono-val text-[21px] font-bold tracking-tight ${
                        item.tickStatus ? `tick-${item.tickStatus}` : ''
                      }`}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.price > 1000
                        ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })
                        : item.price.toFixed(item.price < 10 ? 4 : 2)}
                    </div>
                    <div
                      className="font-mono-val text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold"
                      style={{
                        backgroundColor: isUp
                          ? 'var(--color-positive-bg)'
                          : 'var(--color-negative-bg)',
                        color: isUp ? 'var(--color-positive)' : 'var(--color-negative)',
                        border: `1px solid ${
                          isUp ? 'var(--color-positive-border)' : 'var(--color-negative-border)'
                        }`,
                      }}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {isUp ? `+${item.changePct.toFixed(2)}%` : `${item.changePct.toFixed(2)}%`}
                    </div>
                  </div>

                  {/* Subtle Sparkline SVG */}
                  <div
                    className="mt-auto h-11 w-full rounded-lg relative overflow-hidden transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <svg
                      className="absolute inset-0 h-full w-full opacity-80"
                      viewBox="0 0 100 40"
                      preserveAspectRatio="none"
                    >
                      <polyline
                        fill="none"
                        points={
                          isUp
                            ? '0,30 15,28 30,34 50,18 70,22 85,12 100,6'
                            : '0,10 18,14 35,8 55,26 75,20 90,32 100,35'
                        }
                        stroke={isUp ? 'var(--color-positive)' : 'var(--color-negative)'}
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Sentiment Feed (Right column) */}
        <div
          id="sentiment-panel"
          className="col-span-12 lg:col-span-4 bento-card rounded-xl p-3.5 flex flex-col h-[400px]"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <Rss className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2
                className="font-mono-val text-[12px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Sentiment Feed
              </h2>
            </div>
            <div className="flex gap-1 text-[10px] font-mono-val">
              {(['ALL', 'HAWKISH', 'BEARISH'] as const).map((filter) => {
                const isSelected = activeSentimentFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setActiveSentimentFilter(filter)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer uppercase transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid transparent',
                    }}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
            {filteredSentiment.map((item) => {
              const isHawk = item.sentiment === 'HAWKISH';
              const isBear = item.sentiment === 'BEARISH';
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-mono-val text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {item.time}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1.5 w-14 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--bg-card)' }}
                      >
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${item.score}%`,
                            backgroundColor: isHawk
                              ? 'var(--color-positive)'
                              : isBear
                              ? 'var(--color-negative)'
                              : 'var(--text-muted)',
                          }}
                        />
                      </div>
                      <span
                        className="font-mono-val text-[10px] font-semibold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {item.score}%
                      </span>
                    </div>
                  </div>

                  <p
                    className="text-[12px] font-medium leading-snug"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.headline}
                  </p>

                  <div className="flex gap-1.5 mt-2">
                    <span
                      className="font-mono-val text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase"
                      style={{
                        backgroundColor: isHawk
                          ? 'var(--color-positive-bg)'
                          : isBear
                          ? 'var(--color-negative-bg)'
                          : 'var(--color-neutral-badge-bg)',
                        color: isHawk
                          ? 'var(--color-positive)'
                          : isBear
                          ? 'var(--color-negative)'
                          : 'var(--color-neutral-badge-text)',
                        border: `1px solid ${
                          isHawk
                            ? 'var(--color-positive-border)'
                            : isBear
                            ? 'var(--color-negative-border)'
                            : 'var(--border-subtle)'
                        }`,
                      }}
                    >
                      {item.sentiment}
                    </span>
                    {item.tags.slice(1).map((t) => (
                      <span
                        key={t}
                        className="font-mono-val text-[9px] px-1.5 py-0.5 rounded uppercase"
                        style={{
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cross-Asset Correlation Heatmap (Bottom-Left) */}
        <div
          id="correlation-panel"
          className="col-span-12 lg:col-span-8 bento-card rounded-xl p-3.5 min-h-[360px] flex flex-col -mt-3 lg:-mt-24"
        >
          <div
            className="flex justify-between items-center mb-3 pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <h2
                className="font-mono-val text-[12px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                Cross-Asset Correlation ({selectedPeriod})
              </h2>
            </div>
            <div className="flex gap-1">
              {(['1W', '30D', '90D'] as const).map((period) => {
                const isSelected = selectedPeriod === period;
                return (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className="font-mono-val text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-card-subtle)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-secondary)',
                      border: isSelected
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {period}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[480px]">
              <div
                className="grid grid-cols-6 gap-[1px] rounded-lg overflow-hidden border"
                style={{
                  backgroundColor: 'var(--border-subtle)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {/* Header Row */}
                <div
                  className="p-2.5 font-mono-val text-[11px] font-bold"
                  style={{
                    backgroundColor: 'var(--bg-card-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  ASSET
                </div>
                {correlationData.assets.map((asset) => (
                  <div
                    key={asset}
                    className="p-2.5 text-center font-mono-val text-[11px] font-bold uppercase"
                    style={{
                      backgroundColor: 'var(--bg-card-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {asset}
                  </div>
                ))}

                {/* Data Rows */}
                {correlationData.assets.map((rowAsset, rowIdx) => (
                  <React.Fragment key={rowAsset}>
                    <div
                      className="p-2.5 text-right font-mono-val text-[11px] font-bold flex items-center justify-end"
                      style={{
                        backgroundColor: 'var(--bg-card-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {rowAsset}
                    </div>
                    {correlationData.matrix[rowIdx].map((val, colIdx) => {
                      const colAsset = correlationData.assets[colIdx];
                      return (
                        <div
                          key={`${rowAsset}-${colAsset}`}
                          onMouseEnter={() => setHoveredCell({ row: rowAsset, col: colAsset, val })}
                          onMouseLeave={() => setHoveredCell(null)}
                          style={getCellStyle(val)}
                          className="p-2.5 text-center font-mono-val text-[11px] flex items-center justify-center transition-all cursor-crosshair hover:ring-1 hover:ring-offset-1"
                        >
                          {val === 1.0 ? '1.00' : val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Correlation Inspector Footer */}
              <div
                className="mt-3 flex justify-between items-center text-[11px] font-mono-val px-1"
                style={{ color: 'var(--text-muted)' }}
              >
                <div>
                  {hoveredCell ? (
                    <span>
                      Pair:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {hoveredCell.row} / {hoveredCell.col}
                      </strong>{' '}
                      | r ={' '}
                      <strong
                        style={{
                          color:
                            hoveredCell.val > 0.3
                              ? 'var(--color-positive)'
                              : hoveredCell.val < -0.3
                              ? 'var(--color-negative)'
                              : 'var(--text-primary)',
                        }}
                      >
                        {hoveredCell.val.toFixed(2)}
                      </strong>
                    </span>
                  ) : (
                    <span>Hover over any correlation pair for statistical breakdown</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: 'var(--color-negative)' }}
                    />{' '}
                    Inverse
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-sm"
                      style={{ backgroundColor: 'var(--color-positive)' }}
                    />{' '}
                    Correlated
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
