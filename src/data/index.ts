/**
 * Central Data Consolidation Barrel
 * All data connections, data sources, API bindings, dynamic raw data (currencies, time, market hours),
 * technical indicators, and master ticker definitions are consolidated under src/data/
 */

// 1. Ticker Universe & Master Registry (Strictly names & static metadata only)
export * from './tickerVerse';

// 2. Dynamic Raw Currency Engine & ECB Live Rates
export * from './currencies';

// 3. Dynamic Raw Time Engine & Global Timezones
export * from './timezones';

// 4. Global Market Trading Sessions & Exchange Schedules
export * from './marketHours';

// 5. Ticker Feed Protocol Diagnostics & Latency Telemetry
export * from './tickerApiStatus';

// 6. Centralized API Connections & Live Data Sources
export * from './dataSources';

// 7. Quantitative Technical Indicators & Calculations
export * from './indicators';
