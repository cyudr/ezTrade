export interface CandlePoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  buyVolume?: number;
  sellVolume?: number;
  vwap?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema9?: number;
  ema21?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  stochK?: number;
  stochD?: number;
  haOpen?: number;
  haHigh?: number;
  haLow?: number;
  haClose?: number;
}

export type TimeInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W';
export type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';
export type VisualizationMode = 'candle' | 'line' | 'area' | 'point' | 'bar' | 'heikinAshi';

export interface ActiveIndicators {
  sma20: boolean;
  sma50: boolean;
  sma200: boolean;
  ema9: boolean;
  ema21: boolean;
  bollingerBands: boolean;
  vwap: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
  stochastic: boolean;
}

export const DEFAULT_ACTIVE_INDICATORS: ActiveIndicators = {
  sma20: true,
  sma50: false,
  sma200: false,
  ema9: false,
  ema21: false,
  bollingerBands: true,
  vwap: true,
  volume: true,
  rsi: true,
  macd: false,
  stochastic: false,
};

// Calculate SMA
export function calculateSMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

// Calculate EMA
export function calculateEMA(data: number[], period: number): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  const k = 2 / (period + 1);
  let prevEMA: number | undefined = undefined;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(undefined);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      prevEMA = sum / period;
      result.push(Number(prevEMA.toFixed(2)));
    } else if (prevEMA !== undefined) {
      prevEMA = data[i] * k + prevEMA * (1 - k);
      result.push(Number(prevEMA.toFixed(2)));
    }
  }
  return result;
}

// Calculate Bollinger Bands (20 periods, 2 std dev)
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2
): { upper: (number | undefined)[]; middle: (number | undefined)[]; lower: (number | undefined)[] } {
  const upper: (number | undefined)[] = [];
  const middle: (number | undefined)[] = [];
  const lower: (number | undefined)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(undefined);
      middle.push(undefined);
      lower.push(undefined);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      middle.push(Number(mean.toFixed(2)));
      upper.push(Number((mean + stdDevMultiplier * stdDev).toFixed(2)));
      lower.push(Number((mean - stdDevMultiplier * stdDev).toFixed(2)));
    }
  }
  return { upper, middle, lower };
}

// Calculate RSI (14 period)
export function calculateRSI(closes: number[], period = 14): (number | undefined)[] {
  const result: (number | undefined)[] = [];
  if (closes.length < period + 1) return closes.map(() => undefined);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(undefined);
    } else if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(Number(rsi.toFixed(1)));
    } else {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? Math.abs(diff) : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);
      result.push(Number(rsi.toFixed(1)));
    }
  }
  return result;
}

// Calculate MACD (12, 26, 9)
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): {
  macd: (number | undefined)[];
  signal: (number | undefined)[];
  histogram: (number | undefined)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | undefined)[] = [];
  const validMacdValues: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== undefined && slowEMA[i] !== undefined) {
      const val = Number((fastEMA[i]! - slowEMA[i]!).toFixed(2));
      macdLine.push(val);
      validMacdValues.push(val);
    } else {
      macdLine.push(undefined);
    }
  }

  const rawSignal = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | undefined)[] = [];
  const histogram: (number | undefined)[] = [];

  let signalIdx = 0;
  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === undefined) {
      signalLine.push(undefined);
      histogram.push(undefined);
    } else {
      const sigVal = rawSignal[signalIdx++];
      signalLine.push(sigVal);
      if (sigVal !== undefined) {
        histogram.push(Number((macdLine[i]! - sigVal).toFixed(2)));
      } else {
        histogram.push(undefined);
      }
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

// Calculate Stochastic Oscillator (%K 14, %D 3)
export function calculateStochastic(
  candles: { high: number; low: number; close: number }[],
  kPeriod = 14,
  dPeriod = 3
): { k: (number | undefined)[]; d: (number | undefined)[] } {
  const kLine: (number | undefined)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      kLine.push(undefined);
    } else {
      const slice = candles.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map((c) => c.high));
      const lowest = Math.min(...slice.map((c) => c.low));
      const close = candles[i].close;

      const k = highest === lowest ? 50 : ((close - lowest) / (highest - lowest)) * 100;
      kLine.push(Number(k.toFixed(1)));
    }
  }

  const validK = kLine.filter((v): v is number => v !== undefined);
  const rawD = calculateSMA(validK, dPeriod);
  const dLine: (number | undefined)[] = [];

  let dIdx = 0;
  for (let i = 0; i < candles.length; i++) {
    if (kLine[i] === undefined) {
      dLine.push(undefined);
    } else {
      dLine.push(rawD[dIdx++]);
    }
  }

  return { k: kLine, d: dLine };
}

// Generate responsive, realistic historical OHLC and indicators for any symbol, interval, and range
export function generateChartDataForInterval(
  symbol: string,
  interval: TimeInterval = '1D',
  range: TimeRange = '1M',
  basePrice = 214.72,
  volatility = 0.02
): CandlePoint[] {
  // Determine number of bars based on range and interval
  let count = 40;
  let timeStepMs = 24 * 60 * 60 * 1000; // 1D default

  if (interval === '1m') {
    timeStepMs = 60 * 1000;
    count = range === '1D' ? 60 : 120;
  } else if (interval === '5m') {
    timeStepMs = 5 * 60 * 1000;
    count = range === '1D' ? 78 : 100;
  } else if (interval === '15m') {
    timeStepMs = 15 * 60 * 1000;
    count = range === '1D' ? 26 : range === '5D' ? 65 : 90;
  } else if (interval === '1h') {
    timeStepMs = 60 * 60 * 1000;
    count = range === '1D' ? 8 : range === '5D' ? 35 : 75;
  } else if (interval === '4h') {
    timeStepMs = 4 * 60 * 60 * 1000;
    count = range === '1M' ? 45 : 90;
  } else if (interval === '1D') {
    timeStepMs = 24 * 60 * 60 * 1000;
    count = range === '1M' ? 30 : range === '3M' ? 65 : range === '1Y' ? 250 : 60;
  } else if (interval === '1W') {
    timeStepMs = 7 * 24 * 60 * 60 * 1000;
    count = range === '1Y' ? 52 : range === 'ALL' ? 120 : 26;
  }

  // Base deterministic seed from symbol
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed += symbol.charCodeAt(i);
  }
  const seededRandom = (idx: number) => {
    const x = Math.sin(seed + idx * 9.123) * 10000;
    return x - Math.floor(x);
  };

  const now = Date.now();
  const rawCandles: {
    time: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    buyVolume: number;
    sellVolume: number;
  }[] = [];

  let currentClose = basePrice * (1 - (seededRandom(0) - 0.5) * 0.1);
  let cumulativePv = 0;
  let cumulativeVol = 0;

  for (let i = 0; i < count; i++) {
    const barTimestamp = now - (count - 1 - i) * timeStepMs;
    const dateObj = new Date(barTimestamp);
    
    let timeLabel = '';
    if (interval === '1m' || interval === '5m' || interval === '15m' || interval === '1h') {
      timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } else {
      timeLabel = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    const rnd = seededRandom(i + 1);
    const trend = (rnd - 0.48) * volatility * currentClose;
    const open = Number(currentClose.toFixed(2));
    const close = Number(Math.max(1, open + trend).toFixed(2));
    const wickHigh = (seededRandom(i + 100) * 0.008 + 0.002) * open;
    const wickLow = (seededRandom(i + 200) * 0.008 + 0.002) * open;
    const high = Number(Math.max(open, close, open + wickHigh).toFixed(2));
    const low = Number(Math.min(open, close, open - wickLow).toFixed(2));

    const baseVol = Math.floor(250000 + seededRandom(i + 300) * 1200000);
    const isGreen = close >= open;
    const buyVol = Math.floor(baseVol * (isGreen ? 0.6 + seededRandom(i) * 0.2 : 0.35 + seededRandom(i) * 0.15));
    const sellVol = baseVol - buyVol;

    currentClose = close;

    rawCandles.push({
      time: timeLabel,
      timestamp: barTimestamp,
      open,
      high,
      low,
      close,
      volume: baseVol,
      buyVolume: buyVol,
      sellVolume: sellVol,
    });
  }

  // Calculate Indicators
  const closes = rawCandles.map((c) => c.close);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const bb = calculateBollingerBands(closes, 20, 2);
  const rsi = calculateRSI(closes, 14);
  const macdData = calculateMACD(closes, 12, 26, 9);
  const stochData = calculateStochastic(rawCandles, 14, 3);

  // Compute VWAP and Heikin-Ashi
  const finalPoints: CandlePoint[] = [];
  let prevHaOpen = rawCandles[0].open;
  let prevHaClose = rawCandles[0].close;

  for (let i = 0; i < rawCandles.length; i++) {
    const c = rawCandles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativePv += typicalPrice * c.volume;
    cumulativeVol += c.volume;
    const vwap = Number((cumulativePv / cumulativeVol).toFixed(2));

    // Heikin-Ashi calculation
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    prevHaOpen = haOpen;
    prevHaClose = haClose;

    finalPoints.push({
      ...c,
      vwap,
      sma20: sma20[i],
      sma50: sma50[i],
      sma200: sma200[i],
      ema9: ema9[i],
      ema21: ema21[i],
      bbUpper: bb.upper[i],
      bbMiddle: bb.middle[i],
      bbLower: bb.lower[i],
      rsi: rsi[i],
      macd: macdData.macd[i],
      macdSignal: macdData.signal[i],
      macdHist: macdData.histogram[i],
      stochK: stochData.k[i],
      stochD: stochData.d[i],
      haOpen: Number(haOpen.toFixed(2)),
      haHigh: Number(haHigh.toFixed(2)),
      haLow: Number(haLow.toFixed(2)),
      haClose: Number(haClose.toFixed(2)),
    });
  }

  return finalPoints;
}
