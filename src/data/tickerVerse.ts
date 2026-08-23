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

// Baseline reference seed prices to guarantee no zero-price flashes before live API stream resolves
const BASE_UNIVERSE_PRICES: Record<string, { price: number; change: number; changePct: number; high: number; low: number; volume: string; marketCap: string; beta: number; sparkline: number[] }> = {
  NVDA: { price: 128.5, change: 2.4, changePct: 1.9, high: 130.2, low: 126.8, volume: '48.5M', marketCap: '$3.15T', beta: 1.68, sparkline: [124.5, 126.2, 125.8, 127.4, 128.5] },
  AAPL: { price: 226.3, change: 1.2, changePct: 0.53, high: 227.8, low: 225.1, volume: '42.3M', marketCap: '$3.45T', beta: 1.05, sparkline: [223.1, 224.5, 225.0, 225.8, 226.3] },
  MSFT: { price: 448.2, change: -1.8, changePct: -0.4, high: 452.1, low: 446.5, volume: '21.9M', marketCap: '$3.32T', beta: 1.18, sparkline: [451.2, 450.0, 449.2, 448.8, 448.2] },
  AMD: { price: 154.6, change: 3.2, changePct: 2.11, high: 156.4, low: 151.8, volume: '38.4M', marketCap: '$250.2B', beta: 1.75, sparkline: [149.2, 151.5, 153.0, 152.8, 154.6] },
  AVGO: { price: 168.4, change: 4.1, changePct: 2.5, high: 170.2, low: 164.5, volume: '16.2M', marketCap: '$786.1B', beta: 1.42, sparkline: [162.0, 164.5, 166.2, 167.0, 168.4] },
  PLTR: { price: 32.4, change: 0.85, changePct: 2.69, high: 33.1, low: 31.6, volume: '44.5M', marketCap: '$72.5B', beta: 1.82, sparkline: [30.8, 31.2, 31.9, 32.0, 32.4] },
  TSM: { price: 172.8, change: 2.1, changePct: 1.23, high: 174.5, low: 170.8, volume: '18.4M', marketCap: '$896.2B', beta: 1.25, sparkline: [169.5, 170.8, 171.4, 172.0, 172.8] },
  ASML: { price: 842.1, change: 12.4, changePct: 1.49, high: 848.0, low: 832.5, volume: '2.1M', marketCap: '$335.8B', beta: 1.34, sparkline: [824.0, 830.5, 835.2, 838.0, 842.1] },
  ORCL: { price: 138.5, change: 1.6, changePct: 1.17, high: 139.8, low: 136.9, volume: '9.8M', marketCap: '$382.4B', beta: 1.02, sparkline: [135.8, 136.9, 137.4, 138.0, 138.5] },
  CRM: { price: 254.2, change: -2.3, changePct: -0.9, high: 258.0, low: 253.1, volume: '7.4M', marketCap: '$244.1B', beta: 1.15, sparkline: [257.5, 256.2, 255.4, 254.8, 254.2] },
  ADBE: { price: 524.6, change: 6.2, changePct: 1.2, high: 528.0, low: 519.5, volume: '3.2M', marketCap: '$232.8B', beta: 1.22, sparkline: [516.0, 519.8, 522.4, 523.0, 524.6] },
  ARM: { price: 136.2, change: 4.8, changePct: 3.65, high: 138.5, low: 131.9, volume: '15.6M', marketCap: '$141.5B', beta: 1.95, sparkline: [129.5, 132.0, 134.5, 135.0, 136.2] },
  JPM: { price: 216.4, change: 1.8, changePct: 0.84, high: 218.0, low: 214.8, volume: '10.2M', marketCap: '$618.5B', beta: 1.08, sparkline: [213.5, 214.8, 215.4, 215.9, 216.4] },
  BAC: { price: 39.8, change: 0.35, changePct: 0.89, high: 40.2, low: 39.4, volume: '34.1M', marketCap: '$312.4B', beta: 1.28, sparkline: [39.1, 39.4, 39.6, 39.7, 39.8] },
  GS: { price: 486.2, change: 4.2, changePct: 0.87, high: 489.5, low: 482.0, volume: '2.4M', marketCap: '$158.2B', beta: 1.32, sparkline: [479.5, 482.0, 484.5, 485.0, 486.2] },
  COIN: { price: 218.6, change: 8.4, changePct: 4.0, high: 224.0, low: 211.5, volume: '12.8M', marketCap: '$53.8B', beta: 2.35, sparkline: [208.5, 212.0, 215.8, 216.4, 218.6] },
  LLY: { price: 948.2, change: 14.5, changePct: 1.55, high: 954.0, low: 935.0, volume: '3.8M', marketCap: '$901.2B', beta: 0.68, sparkline: [928.0, 935.4, 942.0, 945.0, 948.2] },
  AMZN: { price: 178.5, change: 2.3, changePct: 1.31, high: 180.2, low: 176.4, volume: '39.5M', marketCap: '$1.86T', beta: 1.15, sparkline: [175.2, 176.8, 177.5, 177.9, 178.5] },
  TSLA: { price: 218.4, change: -4.2, changePct: -1.89, high: 224.5, low: 216.2, volume: '58.2M', marketCap: '$698.4B', beta: 2.12, sparkline: [224.5, 222.0, 220.8, 219.5, 218.4] },
  GOOGL: { price: 166.4, change: 1.5, changePct: 0.91, high: 167.8, low: 164.9, volume: '24.2M', marketCap: '$2.08T', beta: 1.08, sparkline: [164.0, 165.2, 165.8, 166.0, 166.4] },
  META: { price: 549.9, change: 6.8, changePct: 1.25, high: 554.0, low: 544.2, volume: '13.2M', marketCap: '$1.39T', beta: 1.28, sparkline: [540.2, 544.0, 547.5, 548.5, 549.9] },
  SPX: { price: 5648.4, change: 32.5, changePct: 0.58, high: 5660.2, low: 5625.4, volume: '2.74B', marketCap: '$48.5T', beta: 1.0, sparkline: [5605.0, 5620.4, 5635.0, 5640.2, 5648.4] },
  NDX: { price: 19824.2, change: 145.8, changePct: 0.74, high: 19880.0, low: 19710.0, volume: '1.14B', marketCap: '$24.2T', beta: 1.18, sparkline: [19620.0, 19710.0, 19780.0, 19805.0, 19824.2] },
  SPY: { price: 564.8, change: 3.2, changePct: 0.57, high: 566.0, low: 562.5, volume: '48.2M', marketCap: '$560.4B', beta: 1.0, sparkline: [560.5, 562.0, 563.5, 564.0, 564.8] },
  QQQ: { price: 482.6, change: 3.8, changePct: 0.79, high: 484.5, low: 479.8, volume: '36.4M', marketCap: '$288.2B', beta: 1.18, sparkline: [477.5, 479.8, 481.2, 482.0, 482.6] },
  BTCUSD: { price: 62450.0, change: 1420.0, changePct: 2.33, high: 63100.0, low: 60900.0, volume: '$38.4B', marketCap: '$1.23T', beta: 2.15, sparkline: [60500, 61200, 61800, 62100, 62450] },
  BTCSGD: { price: 83800.0, change: 1910.0, changePct: 2.33, high: 84680.0, low: 81720.0, volume: 'S$12.4B', marketCap: '$1.65T', beta: 2.15, sparkline: [81200, 82100, 82900, 83300, 83800] },
  ETHUSD: { price: 2480.0, change: 58.0, changePct: 2.39, high: 2520.0, low: 2410.0, volume: '$21.5B', marketCap: '$298.5B', beta: 2.38, sparkline: [2405, 2430, 2455, 2470, 2480] },
  ETHSGD: { price: 3328.0, change: 78.0, changePct: 2.39, high: 3381.0, low: 3234.0, volume: 'S$6.8B', marketCap: '$401.2B', beta: 2.38, sparkline: [3227, 3261, 3294, 3314, 3328] },
  SOLUSD: { price: 142.5, change: 4.8, changePct: 3.49, high: 145.2, low: 136.8, volume: '$3.2B', marketCap: '$66.8B', beta: 2.85, sparkline: [136.0, 138.5, 140.2, 141.5, 142.5] },
  SOLSGD: { price: 191.2, change: 6.4, changePct: 3.49, high: 194.8, low: 183.5, volume: 'S$950M', marketCap: '$89.7B', beta: 2.85, sparkline: [182.5, 185.8, 188.1, 189.9, 191.2] },
  USDSGD: { price: 1.2842, change: -0.0018, changePct: -0.14, high: 1.2865, low: 1.2830, volume: 'Interbank', marketCap: 'N/A', beta: 0.15, sparkline: [1.2865, 1.2858, 1.2850, 1.2845, 1.2842] },
  EURUSD: { price: 1.1085, change: 0.0022, changePct: 0.2, high: 1.1110, low: 1.1055, volume: 'Interbank', marketCap: 'N/A', beta: 0.22, sparkline: [1.1055, 1.1068, 1.1075, 1.1080, 1.1085] },
  SGDJPY: { price: 112.45, change: 0.35, changePct: 0.31, high: 112.8, low: 112.0, volume: 'Interbank', marketCap: 'N/A', beta: 0.35, sparkline: [111.9, 112.1, 112.3, 112.4, 112.45] },
  USDJPY: { price: 144.25, change: 0.45, changePct: 0.31, high: 144.8, low: 143.7, volume: 'Interbank', marketCap: 'N/A', beta: 0.38, sparkline: [143.6, 143.9, 144.1, 144.2, 144.25] },
  EURSGD: { price: 1.4235, change: 0.0015, changePct: 0.11, high: 1.426, low: 1.421, volume: 'Interbank', marketCap: 'N/A', beta: 0.25, sparkline: [1.421, 1.422, 1.423, 1.4232, 1.4235] },
  GBPSGD: { price: 1.685, change: 0.003, changePct: 0.18, high: 1.688, low: 1.681, volume: 'Interbank', marketCap: 'N/A', beta: 0.3, sparkline: [1.681, 1.6825, 1.684, 1.6845, 1.685] },
};

/**
 * Dynamically construct the Universe Ticker dataset
 * Populated with responsive, realistic baseline market values that update immediately with live API feeds.
 */
export const TICKER_VERSE: UniverseTicker[] = TICKER_DEFINITIONS.map((def, idx) => {
  const seed = BASE_UNIVERSE_PRICES[def.symbol];
  const isFx = def.assetClass === 'FX';
  const defaultPrice = isFx ? 1.345 : 125.0;
  const price = seed ? seed.price : defaultPrice;
  const changePct = seed ? seed.changePct : 0.65;
  const change = seed ? seed.change : (price * changePct) / 100;
  const high = seed ? seed.high : price * 1.015;
  const low = seed ? seed.low : price * 0.985;
  const volume = seed ? seed.volume : '12.4M';
  const marketCap = seed ? seed.marketCap : '$150.0B';
  const beta = seed ? seed.beta : 1.05;
  const sparkline = seed ? seed.sparkline : [price * 0.99, price * 0.995, price * 1.002, price];
  const lastClose = price - change;

  return {
    symbol: def.symbol,
    name: def.name,
    sector: def.sector,
    subSector: def.subSector,
    assetClass: def.assetClass,
    price,
    change: parseFloat(change.toFixed(isFx ? 4 : 2)),
    changePct: parseFloat(changePct.toFixed(2)),
    high: parseFloat(high.toFixed(isFx ? 4 : 2)),
    low: parseFloat(low.toFixed(isFx ? 4 : 2)),
    volume,
    avgVolumeNum: 10000000,
    volumeRank: idx + 1,
    marketCap,
    beta,
    lastClose: parseFloat(lastClose.toFixed(isFx ? 4 : 2)),
    sparkline,
    isMarketOpen: true,
  };
});

/**
 * Updates the global TICKER_VERSE dataset in-place with incoming live API stream quotes
 */
export function updateUniversePrices(quotes: Record<string, Partial<TickerItem>>): void {
  if (!quotes || Object.keys(quotes).length === 0) return;

  TICKER_VERSE.forEach((item, idx) => {
    const live = quotes[item.symbol];
    if (live) {
      TICKER_VERSE[idx] = {
        ...item,
        price: typeof live.price === 'number' ? live.price : item.price,
        change: typeof live.change === 'number' ? live.change : item.change,
        changePct: typeof live.changePct === 'number' ? live.changePct : item.changePct,
        high: typeof live.high === 'number' ? live.high : item.high,
        low: typeof live.low === 'number' ? live.low : item.low,
        volume: live.volume || item.volume,
        sparkline: live.sparkline && live.sparkline.length > 0 ? live.sparkline : item.sparkline,
        lastClose: typeof live.lastClose === 'number' ? live.lastClose : item.lastClose,
        tickStatus: live.tickStatus || item.tickStatus,
        isMarketOpen: live.isMarketOpen !== undefined ? live.isMarketOpen : item.isMarketOpen,
      };
    }
  });
}

/**
 * Helper to lookup single ticker from master universe with optional live override list
 */
export function getUniverseTicker(
  symbol: string,
  liveTickers?: (UniverseTicker | TickerItem)[]
): UniverseTicker | undefined {
  if (!symbol) return undefined;
  const sym = symbol.toUpperCase().trim();
  if (liveTickers && liveTickers.length > 0) {
    const foundLive = liveTickers.find((t) => t.symbol === sym);
    if (foundLive) {
      const baseMeta = TICKER_VERSE.find((t) => t.symbol === sym);
      const isOff = (foundLive as any).isOffline || ((foundLive.price ?? baseMeta?.price ?? 0) <= 0);
      return {
        ...(baseMeta || ({} as any)),
        ...foundLive,
        price: typeof foundLive.price === 'number' ? foundLive.price : baseMeta?.price ?? 0,
        change: typeof foundLive.change === 'number' ? foundLive.change : baseMeta?.change ?? 0,
        changePct: typeof foundLive.changePct === 'number' ? foundLive.changePct : baseMeta?.changePct ?? 0,
        sector: (foundLive as any).sector || baseMeta?.sector || 'TECHNOLOGY',
        subSector: (foundLive as any).subSector || baseMeta?.subSector || 'Market Asset',
        volumeRank: (foundLive as any).volumeRank || baseMeta?.volumeRank || 1,
        avgVolumeNum: (foundLive as any).avgVolumeNum || baseMeta?.avgVolumeNum || 1000000,
        marketCap: (foundLive as any).marketCap || baseMeta?.marketCap || 'N/A',
        beta: typeof (foundLive as any).beta === 'number' ? (foundLive as any).beta : baseMeta?.beta ?? 1.0,
        isOffline: isOff,
      };
    }
  }
  return TICKER_VERSE.find((t) => t.symbol === sym);
}

/**
 * Helper to query and filter the universe with multi-facet and live ticker feed support
 */
export function searchTickerVerse(
  query: string,
  sector: SectorCategory = 'ALL',
  sortBy: 'volume' | 'price' | 'change' | 'name' = 'volume',
  filterType?: 'ALL' | 'GAINERS' | 'LOSERS' | 'HIGH_BETA' | 'MEGA_CAP',
  liveTickers?: (UniverseTicker | TickerItem)[]
): UniverseTicker[] {
  let source = TICKER_VERSE;

  if (liveTickers && liveTickers.length > 0) {
    const liveMap = new Map(liveTickers.map((t) => [t.symbol, t]));
    source = TICKER_VERSE.map((base) => {
      const live = liveMap.get(base.symbol);
      if (!live) return base;
      return {
        ...base,
        price: typeof live.price === 'number' ? live.price : base.price,
        change: typeof live.change === 'number' ? live.change : base.change,
        changePct: typeof live.changePct === 'number' ? live.changePct : base.changePct,
        high: typeof live.high === 'number' ? live.high : base.high,
        low: typeof live.low === 'number' ? live.low : base.low,
        volume: live.volume || base.volume,
        sparkline: live.sparkline && live.sparkline.length > 0 ? live.sparkline : base.sparkline,
        tickStatus: live.tickStatus,
        lastClose: typeof live.lastClose === 'number' ? live.lastClose : base.lastClose,
      };
    });
  }

  let results = [...source];

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

