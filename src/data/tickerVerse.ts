import { TickerItem } from '../types';

export interface UniverseTicker extends TickerItem {
  sector: string;
  subSector: string;
  volumeRank: number;
  avgVolumeNum: number;
  marketCap: string;
  peRatio?: number;
  beta: number;
}

export type SectorCategory =
  | 'ALL'
  | 'TECHNOLOGY'
  | 'FINANCIALS'
  | 'HEALTHCARE'
  | 'CONSUMER_DISC'
  | 'CONSUMER_STAPLES'
  | 'ENERGY'
  | 'INDUSTRIALS'
  | 'MATERIALS'
  | 'REAL_ESTATE'
  | 'COMMUNICATION'
  | 'ETFS_INDICES'
  | 'CRYPTO'
  | 'FOREX';

export interface TickerDefinition {
  symbol: string;
  name: string;
  sector: SectorCategory;
  subSector: string;
  assetClass: 'US_EQUITY' | 'CRYPTO' | 'FX' | 'BOND' | 'SGX';
}

export const SECTOR_METADATA: Record<SectorCategory, { name: string; icon: string; count: number }> = {
  ALL: { name: 'Full Universe', icon: 'Globe', count: 84 },
  TECHNOLOGY: { name: 'Technology & AI', icon: 'Cpu', count: 12 },
  FINANCIALS: { name: 'Financials & Fintech', icon: 'Building2', count: 8 },
  HEALTHCARE: { name: 'Healthcare & Biotech', icon: 'Activity', count: 6 },
  CONSUMER_DISC: { name: 'Consumer Discretionary', icon: 'ShoppingBag', count: 6 },
  CONSUMER_STAPLES: { name: 'Consumer Staples', icon: 'Package', count: 6 },
  ENERGY: { name: 'Energy & Utilities', icon: 'Zap', count: 6 },
  INDUSTRIALS: { name: 'Industrials & Aerospace', icon: 'Wrench', count: 6 },
  MATERIALS: { name: 'Materials & Mining', icon: 'Boxes', count: 6 },
  REAL_ESTATE: { name: 'Real Estate & REITs', icon: 'Home', count: 6 },
  COMMUNICATION: { name: 'Communication & Media', icon: 'Radio', count: 6 },
  ETFS_INDICES: { name: 'ETFs & Benchmarks', icon: 'Layers', count: 6 },
  CRYPTO: { name: '24/7 Digital Assets', icon: 'Coins', count: 6 },
  FOREX: { name: 'Global Forex & SGD', icon: 'ArrowLeftRight', count: 6 },
};

/**
 * Clean Stored Coded Ticker Registry
 * ONLY stores ticker names and classification metadata (symbol, name, sector, subSector, assetClass).
 * Strictly contains NO hardcoded dynamic prices, volumes, changes, or sparklines.
 */
export const TICKER_DEFINITIONS: TickerDefinition[] = [
  // --- 1. TECHNOLOGY & AI ---
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'TECHNOLOGY', subSector: 'Semiconductors & AI Accelerators', assetClass: 'US_EQUITY' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'TECHNOLOGY', subSector: 'Consumer Electronics & Ecosystem', assetClass: 'US_EQUITY' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'TECHNOLOGY', subSector: 'Cloud Software & Enterprise AI', assetClass: 'US_EQUITY' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'TECHNOLOGY', subSector: 'Semiconductors & Datacenter GPUs', assetClass: 'US_EQUITY' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'TECHNOLOGY', subSector: 'Custom AI ASIC & Networking Silicon', assetClass: 'US_EQUITY' },
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'TECHNOLOGY', subSector: 'Enterprise AI & Defense Analytics', assetClass: 'US_EQUITY' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor Mfg.', sector: 'TECHNOLOGY', subSector: 'Leading Edge Semiconductor Foundry', assetClass: 'US_EQUITY' },
  { symbol: 'ASML', name: 'ASML Holding N.V.', sector: 'TECHNOLOGY', subSector: 'EUV Photolithography Systems', assetClass: 'US_EQUITY' },
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'TECHNOLOGY', subSector: 'Cloud Infrastructure & Database Systems', assetClass: 'US_EQUITY' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'TECHNOLOGY', subSector: 'Enterprise Cloud & CRM Intelligence', assetClass: 'US_EQUITY' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'TECHNOLOGY', subSector: 'Creative Cloud & Generative Design', assetClass: 'US_EQUITY' },
  { symbol: 'ARM', name: 'Arm Holdings plc', sector: 'TECHNOLOGY', subSector: 'RISC / Silicon IP Architecture', assetClass: 'US_EQUITY' },

  // --- 2. FINANCIALS & FINTECH ---
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'FINANCIALS', subSector: 'Global Investment & Commercial Banking', assetClass: 'US_EQUITY' },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'FINANCIALS', subSector: 'Consumer Banking & Wealth Management', assetClass: 'US_EQUITY' },
  { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'FINANCIALS', subSector: 'Institutional Trading & Investment Banking', assetClass: 'US_EQUITY' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'FINANCIALS', subSector: 'Wealth Management & Capital Markets', assetClass: 'US_EQUITY' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'FINANCIALS', subSector: 'Global Digital Payments Network', assetClass: 'US_EQUITY' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'FINANCIALS', subSector: 'Card Payment Rail Infrastructure', assetClass: 'US_EQUITY' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', sector: 'FINANCIALS', subSector: 'Digital Asset Exchange & Custody', assetClass: 'US_EQUITY' },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'FINANCIALS', subSector: 'Institutional Asset Management & Aladdin', assetClass: 'US_EQUITY' },

  // --- 3. HEALTHCARE & BIOTECH ---
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'HEALTHCARE', subSector: 'Incretin Therapeutics & Oncology', assetClass: 'US_EQUITY' },
  { symbol: 'NVO', name: 'Novo Nordisk A/S', sector: 'HEALTHCARE', subSector: 'Diabetes & GLP-1 Metabolic Medicine', assetClass: 'US_EQUITY' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'HEALTHCARE', subSector: 'Managed Healthcare & Optum Services', assetClass: 'US_EQUITY' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'HEALTHCARE', subSector: 'Innovative Pharmaceuticals & MedTech', assetClass: 'US_EQUITY' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'HEALTHCARE', subSector: 'Immunology & Specialty Therapeutics', assetClass: 'US_EQUITY' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'HEALTHCARE', subSector: 'Biopharmaceuticals & Vaccines', assetClass: 'US_EQUITY' },

  // --- 4. CONSUMER DISCRETIONARY ---
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'CONSUMER_DISC', subSector: 'E-Commerce & AWS Cloud Infrastructure', assetClass: 'US_EQUITY' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'CONSUMER_DISC', subSector: 'Electric Vehicles, Robotics & Energy', assetClass: 'US_EQUITY' },
  { symbol: 'HD', name: 'The Home Depot Inc.', sector: 'CONSUMER_DISC', subSector: 'Home Improvement Retail', assetClass: 'US_EQUITY' },
  { symbol: 'MCD', name: 'McDonald’s Corporation', sector: 'CONSUMER_DISC', subSector: 'Global Quick Service Restaurant Franchises', assetClass: 'US_EQUITY' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'CONSUMER_DISC', subSector: 'Athletic Footwear & Apparel', assetClass: 'US_EQUITY' },
  { symbol: 'BKNG', name: 'Booking Holdings Inc.', sector: 'CONSUMER_DISC', subSector: 'Online Travel & Booking Services', assetClass: 'US_EQUITY' },

  // --- 5. CONSUMER STAPLES ---
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'CONSUMER_STAPLES', subSector: 'Omnichannel Retail & Grocery', assetClass: 'US_EQUITY' },
  { symbol: 'COST', name: 'Costco Wholesale Corp.', sector: 'CONSUMER_STAPLES', subSector: 'Membership Warehouse Retail', assetClass: 'US_EQUITY' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', sector: 'CONSUMER_STAPLES', subSector: 'Consumer Packaged Goods', assetClass: 'US_EQUITY' },
  { symbol: 'KO', name: 'The Coca-Cola Company', sector: 'CONSUMER_STAPLES', subSector: 'Non-Alcoholic Beverages', assetClass: 'US_EQUITY' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'CONSUMER_STAPLES', subSector: 'Beverages & Convenience Foods', assetClass: 'US_EQUITY' },
  { symbol: 'PM', name: 'Philip Morris Intl.', sector: 'CONSUMER_STAPLES', subSector: 'Smoke-Free Consumer Products', assetClass: 'US_EQUITY' },

  // --- 6. ENERGY & UTILITIES ---
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'ENERGY', subSector: 'Integrated Upstream & Downstream Oil', assetClass: 'US_EQUITY' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'ENERGY', subSector: 'Global Integrated Energy & LNG', assetClass: 'US_EQUITY' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'ENERGY', subSector: 'Exploration & Production', assetClass: 'US_EQUITY' },
  { symbol: 'SLB', name: 'Schlumberger Limited', sector: 'ENERGY', subSector: 'Oilfield Equipment & Datacenter Services', assetClass: 'US_EQUITY' },
  { symbol: 'NEE', name: 'NextEra Energy Inc.', sector: 'ENERGY', subSector: 'Clean Energy & Regulated Utility', assetClass: 'US_EQUITY' },
  { symbol: 'CEG', name: 'Constellation Energy', sector: 'ENERGY', subSector: 'Clean Nuclear Energy for AI Datacenters', assetClass: 'US_EQUITY' },

  // --- 7. INDUSTRIALS & AEROSPACE ---
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'INDUSTRIALS', subSector: 'Heavy Construction & Mining Machinery', assetClass: 'US_EQUITY' },
  { symbol: 'GE', name: 'GE Aerospace', sector: 'INDUSTRIALS', subSector: 'Commercial & Defense Jet Engines', assetClass: 'US_EQUITY' },
  { symbol: 'RTX', name: 'RTX Corporation', sector: 'INDUSTRIALS', subSector: 'Aerospace & Advanced Defense Systems', assetClass: 'US_EQUITY' },
  { symbol: 'LMT', name: 'Lockheed Martin Corp.', sector: 'INDUSTRIALS', subSector: 'Defense Aeronautics & Missile Systems', assetClass: 'US_EQUITY' },
  { symbol: 'UNP', name: 'Union Pacific Corp.', sector: 'INDUSTRIALS', subSector: 'Transcontinental Freight Rail', assetClass: 'US_EQUITY' },
  { symbol: 'HON', name: 'Honeywell International', sector: 'INDUSTRIALS', subSector: 'Industrial Automation & Aerospace Systems', assetClass: 'US_EQUITY' },

  // --- 8. MATERIALS & MINING ---
  { symbol: 'LIN', name: 'Linde plc', sector: 'MATERIALS', subSector: 'Industrial Gases & Semiconductor Process Gases', assetClass: 'US_EQUITY' },
  { symbol: 'BHP', name: 'BHP Group Limited', sector: 'MATERIALS', subSector: 'Global Copper, Iron Ore & Metallurgical Coal', assetClass: 'US_EQUITY' },
  { symbol: 'RIO', name: 'Rio Tinto plc', sector: 'MATERIALS', subSector: 'Iron Ore & Aluminium Smelting', assetClass: 'US_EQUITY' },
  { symbol: 'FCX', name: 'Freeport-McMoRan Inc.', sector: 'MATERIALS', subSector: 'Global Copper Mining & Electrification', assetClass: 'US_EQUITY' },
  { symbol: 'NEM', name: 'Newmont Corporation', sector: 'MATERIALS', subSector: 'Gold Exploration & Precious Metals', assetClass: 'US_EQUITY' },
  { symbol: 'SHW', name: 'Sherwin-Williams Co.', sector: 'MATERIALS', subSector: 'Architectural Coatings & Paints', assetClass: 'US_EQUITY' },

  // --- 9. REAL ESTATE & REITS ---
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'REAL_ESTATE', subSector: 'Industrial Logistics & Supply Chain Facilities', assetClass: 'US_EQUITY' },
  { symbol: 'AMT', name: 'American Tower Corp.', sector: 'REAL_ESTATE', subSector: 'Wireless Telecommunications Towers', assetClass: 'US_EQUITY' },
  { symbol: 'EQIX', name: 'Equinix Inc.', sector: 'REAL_ESTATE', subSector: 'Hyperscale AI Interconnection Datacenters', assetClass: 'US_EQUITY' },
  { symbol: 'DLR', name: 'Digital Realty Trust', sector: 'REAL_ESTATE', subSector: 'Carrier-Neutral Datacenter Facilities', assetClass: 'US_EQUITY' },
  { symbol: 'O', name: 'Realty Income Corp.', sector: 'REAL_ESTATE', subSector: 'Single-Tenant Triple-Net Commercial REIT', assetClass: 'US_EQUITY' },
  { symbol: 'SPG', name: 'Simon Property Group', sector: 'REAL_ESTATE', subSector: 'Premium Retail Real Estate & Outlets', assetClass: 'US_EQUITY' },

  // --- 10. COMMUNICATION & MEDIA ---
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', sector: 'COMMUNICATION', subSector: 'Search, YouTube & Gemini AI Cloud', assetClass: 'US_EQUITY' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'COMMUNICATION', subSector: 'Social Applications & Llama Open AI Models', assetClass: 'US_EQUITY' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'COMMUNICATION', subSector: 'Direct-to-Consumer Streaming Entertainment', assetClass: 'US_EQUITY' },
  { symbol: 'DIS', name: 'The Walt Disney Company', sector: 'COMMUNICATION', subSector: 'Entertainment, Theme Parks & Media', assetClass: 'US_EQUITY' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'COMMUNICATION', subSector: '5G Nationwide Wireless Networks', assetClass: 'US_EQUITY' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'COMMUNICATION', subSector: 'Broadband Connectivity & NBCUniversal', assetClass: 'US_EQUITY' },

  // --- 11. ETFS & BENCHMARKS ---
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', sector: 'ETFS_INDICES', subSector: 'S&P 500 US Large Cap Benchmark', assetClass: 'US_EQUITY' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETFS_INDICES', subSector: 'NASDAQ-100 Tech-Heavy Growth Benchmark', assetClass: 'US_EQUITY' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', sector: 'ETFS_INDICES', subSector: 'US Small-Cap Equity Index', assetClass: 'US_EQUITY' },
  { symbol: 'VIX', name: 'CBOE Volatility Index', sector: 'ETFS_INDICES', subSector: 'Implied 30-Day Market Volatility Surface', assetClass: 'US_EQUITY' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', sector: 'ETFS_INDICES', subSector: 'Long-Duration US Sovereign Fixed Income', assetClass: 'BOND' },
  { symbol: 'US10Y', name: 'US 10-Yr Benchmark Treasury Yield', sector: 'ETFS_INDICES', subSector: 'Global Benchmark Sovereign Yield Rate', assetClass: 'BOND' },

  // --- 12. 24/7 DIGITAL ASSETS ---
  { symbol: 'BTCSGD', name: 'Bitcoin / SGD Spot', sector: 'CRYPTO', subSector: 'Decentralized Digital Gold & Store of Value', assetClass: 'CRYPTO' },
  { symbol: 'ETHSGD', name: 'Ethereum / SGD Spot', sector: 'CRYPTO', subSector: 'Smart Contract Computational Platform', assetClass: 'CRYPTO' },
  { symbol: 'SOLSGD', name: 'Solana / SGD Spot', sector: 'CRYPTO', subSector: 'High-Throughput Layer 1 Blockchain', assetClass: 'CRYPTO' },
  { symbol: 'AVAXSGD', name: 'Avalanche / SGD Spot', sector: 'CRYPTO', subSector: 'Subnet Scalable EVM Architecture', assetClass: 'CRYPTO' },
  { symbol: 'BTCUSD', name: 'Bitcoin / USD Spot', sector: 'CRYPTO', subSector: 'Institutional Dollar Liquidity Benchmark', assetClass: 'CRYPTO' },
  { symbol: 'ETHUSD', name: 'Ethereum / USD Spot', sector: 'CRYPTO', subSector: 'Dollar Liquidity Smart Contract Benchmark', assetClass: 'CRYPTO' },

  // --- 13. GLOBAL FOREX & SGD ---
  { symbol: 'USDSGD', name: 'USD / SGD Spot', sector: 'FOREX', subSector: 'US Dollar to Singapore Dollar Exchange', assetClass: 'FX' },
  { symbol: 'EURUSD', name: 'EUR / USD Spot', sector: 'FOREX', subSector: 'Eurozone to US Dollar Benchmark Cross', assetClass: 'FX' },
  { symbol: 'SGDJPY', name: 'SGD / JPY Spot', sector: 'FOREX', subSector: 'Singapore Dollar to Japanese Yen Cross', assetClass: 'FX' },
  { symbol: 'USDJPY', name: 'USD / JPY Spot', sector: 'FOREX', subSector: 'US Dollar to Japanese Yen Liquidity Cross', assetClass: 'FX' },
  { symbol: 'EURSGD', name: 'EUR / SGD Spot', sector: 'FOREX', subSector: 'European Union to Singapore Cross', assetClass: 'FX' },
  { symbol: 'GBPSGD', name: 'GBP / SGD Spot', sector: 'FOREX', subSector: 'British Pound to Singapore Cross', assetClass: 'FX' },
];

/**
 * Dynamically construct the Universe Ticker dataset
 * Base numerical fields are initialized cleanly to 0 / empty values.
 * All dynamic metrics (price, change, high, low, volume, sparkline) are populated solely via Live API feeds.
 */
export const TICKER_VERSE: UniverseTicker[] = TICKER_DEFINITIONS.map((def, idx) => ({
  symbol: def.symbol,
  name: def.name,
  sector: def.sector,
  subSector: def.subSector,
  assetClass: def.assetClass,
  price: 0,
  change: 0,
  changePct: 0,
  high: 0,
  low: 0,
  volume: '--',
  avgVolumeNum: 0,
  volumeRank: idx + 1,
  marketCap: 'N/A',
  beta: 1.0,
  lastClose: 0,
  sparkline: [],
  isMarketOpen: true,
}));

/**
 * Helper to lookup single ticker from master universe
 */
export function getUniverseTicker(symbol: string): UniverseTicker | undefined {
  if (!symbol) return undefined;
  const sym = symbol.toUpperCase().trim();
  return TICKER_VERSE.find((t) => t.symbol === sym);
}

/**
 * Helper to query and filter the universe with multi-facet support
 */
export function searchTickerVerse(
  query: string,
  sector: SectorCategory = 'ALL',
  sortBy: 'volume' | 'price' | 'change' | 'name' = 'volume',
  filterType?: 'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_BETA' | 'MEGA_CAP'
): UniverseTicker[] {
  let results = [...TICKER_VERSE];

  // 1. Sector filtering
  if (sector !== 'ALL') {
    results = results.filter((t) => t.sector === sector);
  }

  // 2. Query search across symbol, name, subSector, sector
  if (query && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    results = results.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.subSector && t.subSector.toLowerCase().includes(q)) ||
        (t.sector && t.sector.toLowerCase().includes(q))
    );
  }

  // 3. Facet filtering
  if (filterType === 'GAINERS') {
    results = results.filter((t) => t.changePct > 0);
  } else if (filterType === 'LOSERS') {
    results = results.filter((t) => t.changePct < 0);
  } else if (filterType === 'HIGH_BETA') {
    results = results.filter((t) => t.beta >= 1.4);
  } else if (filterType === 'MEGA_CAP') {
    results = results.filter((t) => t.marketCap.includes('$') && (t.marketCap.includes('T') || parseFloat(t.marketCap.replace(/[^0-9.]/g, '')) >= 200));
  }

  // 4. Sorting
  results.sort((a, b) => {
    if (sortBy === 'volume') return a.volumeRank - b.volumeRank;
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'change') return Math.abs(b.changePct) - Math.abs(a.changePct);
    return a.symbol.localeCompare(b.symbol);
  });

  return results;
}
