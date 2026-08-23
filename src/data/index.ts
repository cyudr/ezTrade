/**
 * Central Data Consolidation Barrel
 * All data sources, connections, dynamic raw data (currencies, time, market hours),
 * and ticker definitions are consolidated here under src/data/
 */

// 1. Ticker Universe & Master Registry (Strictly names & metadata only)
export * from './tickerVerse';

// 2. Dynamic Raw Currency Engine & ECB Live Rates
export * from './currencies';

// 3. Dynamic Raw Time Engine & Timezones
export * from './timezones';

// 4. Global Market Trading Sessions & Exchange Schedules
export * from './marketHours';

// 5. Ticker Feed Protocol Diagnostics & Latency Telemetry
export * from './tickerApiStatus';

// 6. Centralized API Connections & Data Sources
export * from './dataSources';
