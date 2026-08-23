/**
 * Global Exchange Sessions & Market Hours Dynamic Evaluator
 * Consolidated under src/data/
 */

export type MarketAssetClass = 'US_EQUITY' | 'CRYPTO' | 'FX' | 'SGX' | 'BOND';

export type MarketSessionStatus =
  | 'CLOSED_WEEKEND'
  | 'CLOSED_OVERNIGHT'
  | 'PRE_MARKET'
  | 'REGULAR_OPEN'
  | 'AFTER_HOURS'
  | 'OPEN_24_7'
  | 'BREAK';

export interface MarketSessionInfo {
  assetClass: MarketAssetClass;
  isOpen: boolean;
  isWeekend: boolean;
  status: MarketSessionStatus;
  statusLabel: string;
  badgeLabel: string;
  badgeType: 'positive' | 'negative' | 'neutral' | 'warning';
  nextEvent: string;
  scheduleText: string;
  localTimeStr: string;
  marketTimeStr: string;
  marketTz: string;
}

/**
 * Determine asset class from symbol
 */
export function getAssetClass(symbol: string): MarketAssetClass {
  const sym = symbol?.toUpperCase() || '';
  if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('AVAX') || sym.includes('DOGE')) {
    return 'CRYPTO';
  }
  if (
    sym.includes('USDSGD') ||
    sym.includes('EURUSD') ||
    sym.includes('EURSGD') ||
    sym.includes('SGDJPY') ||
    sym.includes('GBPUSD') ||
    sym.includes('USDJPY') ||
    sym.includes('AUDUSD')
  ) {
    return 'FX';
  }
  if (sym.includes('US10Y') || sym.includes('US02Y') || sym.includes('BOND') || sym.includes('TLT')) {
    return 'BOND';
  }
  if (sym.endsWith('.SI') || sym === 'DBS' || sym === 'OCBC' || sym === 'UOB' || sym === 'SGX') {
    return 'SGX';
  }
  return 'US_EQUITY';
}

/**
 * Calculate US Equity (NYSE / NASDAQ) Market Session
 * Timezone: America/New_York (Eastern Time)
 */
export function getUSEquitySession(date: Date = new Date()): MarketSessionInfo {
  const nyDateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyDateStr);
  const dayOfWeek = nyDate.getDay();
  const hours = nyDate.getHours();
  const minutes = nyDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const nyTimeFormatted = nyDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;
  const isWeekend = isSaturday || isSunday;

  if (isWeekend) {
    return {
      assetClass: 'US_EQUITY',
      isOpen: false,
      isWeekend: true,
      status: 'CLOSED_WEEKEND',
      statusLabel: 'Weekend Closed',
      badgeLabel: 'CLOSED (Weekend)',
      badgeType: 'neutral',
      nextEvent: 'Opens Monday 09:30 EDT',
      scheduleText: 'Mon-Fri 09:30 - 16:00 EDT (NYSE/NASDAQ)',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${nyTimeFormatted} EDT`,
      marketTz: 'America/New_York',
    };
  }

  // Pre-market: 04:00 (240 min) to 09:30 (570 min)
  if (timeInMinutes >= 240 && timeInMinutes < 570) {
    const minsToOpen = 570 - timeInMinutes;
    const hrsToOpen = Math.floor(minsToOpen / 60);
    const remMins = minsToOpen % 60;
    const timeToOpen = hrsToOpen > 0 ? `${hrsToOpen}h ${remMins}m` : `${remMins}m`;

    return {
      assetClass: 'US_EQUITY',
      isOpen: false,
      isWeekend: false,
      status: 'PRE_MARKET',
      statusLabel: 'Pre-Market Session',
      badgeLabel: 'PRE-MARKET',
      badgeType: 'warning',
      nextEvent: `Regular opens in ${timeToOpen} (09:30 EDT)`,
      scheduleText: 'Pre-market 04:00 - 09:30 EDT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${nyTimeFormatted} EDT`,
      marketTz: 'America/New_York',
    };
  }

  // Regular hours: 09:30 (570 min) to 16:00 (960 min)
  if (timeInMinutes >= 570 && timeInMinutes < 960) {
    const minsToClose = 960 - timeInMinutes;
    const hrsToClose = Math.floor(minsToClose / 60);
    const remMins = minsToClose % 60;
    const timeToClose = hrsToClose > 0 ? `${hrsToClose}h ${remMins}m` : `${remMins}m`;

    return {
      assetClass: 'US_EQUITY',
      isOpen: true,
      isWeekend: false,
      status: 'REGULAR_OPEN',
      statusLabel: 'Regular Trading Open',
      badgeLabel: 'LIVE OPEN',
      badgeType: 'positive',
      nextEvent: `Closes in ${timeToClose} (16:00 EDT)`,
      scheduleText: 'Regular Session 09:30 - 16:00 EDT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${nyTimeFormatted} EDT`,
      marketTz: 'America/New_York',
    };
  }

  // After-hours: 16:00 (960 min) to 20:00 (1200 min)
  if (timeInMinutes >= 960 && timeInMinutes < 1200) {
    return {
      assetClass: 'US_EQUITY',
      isOpen: false,
      isWeekend: false,
      status: 'AFTER_HOURS',
      statusLabel: 'After-Hours Session',
      badgeLabel: 'POST-MARKET',
      badgeType: 'warning',
      nextEvent: 'After-hours concludes 20:00 EDT',
      scheduleText: 'Post-market 16:00 - 20:00 EDT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${nyTimeFormatted} EDT`,
      marketTz: 'America/New_York',
    };
  }

  // Overnight Closed: 20:00 to 04:00
  const isFridayNight = dayOfWeek === 5 && timeInMinutes >= 1200;
  return {
    assetClass: 'US_EQUITY',
    isOpen: false,
    isWeekend: false,
    status: 'CLOSED_OVERNIGHT',
    statusLabel: 'Overnight Closed',
    badgeLabel: 'CLOSED (Overnight)',
    badgeType: 'neutral',
    nextEvent: isFridayNight ? 'Opens Monday 09:30 EDT' : 'Pre-market opens 04:00 EDT',
    scheduleText: 'Mon-Fri 09:30 - 16:00 EDT (NYSE/NASDAQ)',
    localTimeStr: date.toLocaleTimeString(),
    marketTimeStr: `${nyTimeFormatted} EDT`,
    marketTz: 'America/New_York',
  };
}

/**
 * Calculate Forex (FX) Market Session (24/5 Interbank)
 */
export function getForexSession(date: Date = new Date()): MarketSessionInfo {
  const nyDateStr = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const nyDate = new Date(nyDateStr);
  const dayOfWeek = nyDate.getDay();
  const hours = nyDate.getHours();
  const minutes = nyDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const nyTimeFormatted = nyDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;
  const isFridayAfter5pm = dayOfWeek === 5 && timeInMinutes >= 17 * 60;
  const isSundayBefore5pm = isSunday && timeInMinutes < 17 * 60;

  if (isSaturday || isFridayAfter5pm || isSundayBefore5pm) {
    return {
      assetClass: 'FX',
      isOpen: false,
      isWeekend: true,
      status: 'CLOSED_WEEKEND',
      statusLabel: 'Weekend Closed',
      badgeLabel: 'CLOSED (Weekend)',
      badgeType: 'neutral',
      nextEvent: 'Interbank opens Sunday 17:00 EDT',
      scheduleText: 'Sun 17:00 - Fri 17:00 EDT (24/5 Interbank FX)',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${nyTimeFormatted} EDT`,
      marketTz: 'America/New_York',
    };
  }

  return {
    assetClass: 'FX',
    isOpen: true,
    isWeekend: false,
    status: 'REGULAR_OPEN',
    statusLabel: '24/5 Interbank Live',
    badgeLabel: '24/5 LIVE',
    badgeType: 'positive',
    nextEvent: 'Session closes Friday 17:00 EDT',
    scheduleText: 'Continuous 24/5 Global Interbank Trading',
    localTimeStr: date.toLocaleTimeString(),
    marketTimeStr: `${nyTimeFormatted} EDT`,
    marketTz: 'America/New_York',
  };
}

/**
 * Calculate Crypto Market Session (24/7 Continuous)
 */
export function getCryptoSession(date: Date = new Date()): MarketSessionInfo {
  return {
    assetClass: 'CRYPTO',
    isOpen: true,
    isWeekend: false,
    status: 'OPEN_24_7',
    statusLabel: '24/7 Continuous Trading',
    badgeLabel: '24/7 LIVE',
    badgeType: 'positive',
    nextEvent: 'Continuous 24/7 Global Orderbooks',
    scheduleText: 'Global Decentralized Market 24/7/365',
    localTimeStr: date.toLocaleTimeString(),
    marketTimeStr: date.toISOString().slice(11, 19) + ' UTC',
    marketTz: 'UTC',
  };
}

/**
 * Calculate Singapore SGX Market Session
 */
export function getSGXSession(date: Date = new Date()): MarketSessionInfo {
  const sgDateStr = date.toLocaleString('en-US', { timeZone: 'Asia/Singapore' });
  const sgDate = new Date(sgDateStr);
  const dayOfWeek = sgDate.getDay();
  const hours = sgDate.getHours();
  const minutes = sgDate.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const sgTimeFormatted = sgDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return {
      assetClass: 'SGX',
      isOpen: false,
      isWeekend: true,
      status: 'CLOSED_WEEKEND',
      statusLabel: 'SGX Weekend Closed',
      badgeLabel: 'CLOSED (Weekend)',
      badgeType: 'neutral',
      nextEvent: 'Opens Monday 09:00 SGT',
      scheduleText: 'Mon-Fri 09:00-12:00 & 13:00-17:00 SGT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${sgTimeFormatted} SGT`,
      marketTz: 'Asia/Singapore',
    };
  }

  // Morning session: 09:00 (540 min) to 12:00 (720 min)
  if (timeInMinutes >= 540 && timeInMinutes < 720) {
    return {
      assetClass: 'SGX',
      isOpen: true,
      isWeekend: false,
      status: 'REGULAR_OPEN',
      statusLabel: 'SGX Morning Session',
      badgeLabel: 'SGX OPEN',
      badgeType: 'positive',
      nextEvent: 'Midday break at 12:00 SGT',
      scheduleText: 'Morning 09:00 - 12:00 SGT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${sgTimeFormatted} SGT`,
      marketTz: 'Asia/Singapore',
    };
  }

  // Midday Break: 12:00 to 13:00
  if (timeInMinutes >= 720 && timeInMinutes < 780) {
    return {
      assetClass: 'SGX',
      isOpen: false,
      isWeekend: false,
      status: 'BREAK',
      statusLabel: 'SGX Midday Break',
      badgeLabel: 'SGX BREAK',
      badgeType: 'warning',
      nextEvent: 'Afternoon session resumes 13:00 SGT',
      scheduleText: 'Midday Break 12:00 - 13:00 SGT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${sgTimeFormatted} SGT`,
      marketTz: 'Asia/Singapore',
    };
  }

  // Afternoon session: 13:00 (780 min) to 17:00 (1020 min)
  if (timeInMinutes >= 780 && timeInMinutes < 1020) {
    return {
      assetClass: 'SGX',
      isOpen: true,
      isWeekend: false,
      status: 'REGULAR_OPEN',
      statusLabel: 'SGX Afternoon Session',
      badgeLabel: 'SGX OPEN',
      badgeType: 'positive',
      nextEvent: 'Closes at 17:00 SGT',
      scheduleText: 'Afternoon 13:00 - 17:00 SGT',
      localTimeStr: date.toLocaleTimeString(),
      marketTimeStr: `${sgTimeFormatted} SGT`,
      marketTz: 'Asia/Singapore',
    };
  }

  return {
    assetClass: 'SGX',
    isOpen: false,
    isWeekend: false,
    status: 'CLOSED_OVERNIGHT',
    statusLabel: 'SGX Closed',
    badgeLabel: 'SGX CLOSED',
    badgeType: 'neutral',
    nextEvent: 'Pre-open 08:30 SGT (Mon-Fri)',
    scheduleText: 'Mon-Fri 09:00-12:00 & 13:00-17:00 SGT',
    localTimeStr: date.toLocaleTimeString(),
    marketTimeStr: `${sgTimeFormatted} SGT`,
    marketTz: 'Asia/Singapore',
  };
}

/**
 * Universal Market Session Evaluator for Any Symbol
 */
export function getMarketSessionForSymbol(symbol: string, date: Date = new Date()): MarketSessionInfo {
  const assetClass = getAssetClass(symbol);
  switch (assetClass) {
    case 'CRYPTO':
      return getCryptoSession(date);
    case 'FX':
      return getForexSession(date);
    case 'SGX':
      return getSGXSession(date);
    case 'BOND':
    case 'US_EQUITY':
    default:
      return getUSEquitySession(date);
  }
}

/**
 * Get Global Market Session Matrix
 */
export function getGlobalMarketMatrix(date: Date = new Date()) {
  return {
    usEquities: getUSEquitySession(date),
    forex: getForexSession(date),
    crypto: getCryptoSession(date),
    sgx: getSGXSession(date),
  };
}
