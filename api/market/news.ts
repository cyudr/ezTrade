import Parser from 'rss-parser';

/**
 * Real-Time Financial RSS News & Sentiment API Handler
 * Fetches live verified financial news feeds (Google News Finance, Yahoo Finance, CoinDesk),
 * parses real articles, applies financial sentiment heuristics, and serves structured sentiment items.
 * Accessible at /api/market/news
 */

const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; QuantTerminalBot/2.0; +https://quant-terminal.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

interface SentimentArticle {
  id: string;
  time: string;
  headline: string;
  sentiment: 'HAWKISH' | 'BEARISH' | 'NEUTRAL';
  score: number;
  tags: string[];
  source: string;
  sourceUrl: string;
  author: string;
  pubDate: string;
}

// In-memory cache to ensure sub-50ms response times and prevent RSS rate-limiting
let cachedArticles: SentimentArticle[] = [];
let lastFetchTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Algorithmic Sentiment Analysis on News Headlines
 */
function analyzeSentiment(title: string, content = ''): { sentiment: 'HAWKISH' | 'BEARISH' | 'NEUTRAL'; score: number } {
  const text = `${title} ${content}`.toLowerCase();

  const bullishWords = [
    'rally', 'surge', 'surges', 'soar', 'soars', 'jump', 'jumps', 'gains', 'gain', 'high', 'record',
    'beat', 'beats', 'growth', 'strong', 'inflows', 'bullish', 'rise', 'rises', 'climb', 'climbs',
    'expansion', 'optimism', 'boost', 'breakout', 'outperform', 'upgrade', 'profit', 'resilient'
  ];

  const bearishWords = [
    'fall', 'falls', 'drop', 'drops', 'plunge', 'plunges', 'slump', 'slumps', 'selloff', 'crash',
    'decline', 'declines', 'recession', 'warning', 'miss', 'misses', 'downgrade', 'deficit',
    'bearish', 'cut', 'cuts', 'inflation', 'pressure', 'concern', 'fears', 'volatility', 'weak'
  ];

  let bullCount = 0;
  let bearCount = 0;

  for (const w of bullishWords) {
    if (text.includes(w)) bullCount++;
  }
  for (const w of bearishWords) {
    if (text.includes(w)) bearCount++;
  }

  if (bullCount > bearCount) {
    const score = Math.min(96, Math.max(68, 65 + bullCount * 8));
    return { sentiment: 'HAWKISH', score };
  } else if (bearCount > bullCount) {
    const score = Math.min(94, Math.max(58, 55 + bearCount * 8));
    return { sentiment: 'BEARISH', score };
  }

  return { sentiment: 'NEUTRAL', score: 50 };
}

/**
 * Extract Categorical Asset Tags from Headline
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const upper = text.toUpperCase();

  if (upper.includes('FED') || upper.includes('POWELL') || upper.includes('RATE') || upper.includes('INFLATION')) tags.push('FED', 'MACRO');
  if (upper.includes('NVIDIA') || upper.includes('NVDA') || upper.includes('CHIP') || upper.includes('SEMICONDUCTOR')) tags.push('TECH', 'SEMIS');
  if (upper.includes('APPLE') || upper.includes('AAPL') || upper.includes('MICROSOFT') || upper.includes('MSFT') || upper.includes('AI')) tags.push('TECH', 'AI');
  if (upper.includes('BITCOIN') || upper.includes('BTC') || upper.includes('CRYPTO') || upper.includes('ETHEREUM') || upper.includes('ETH')) tags.push('CRYPTO');
  if (upper.includes('TREASURY') || upper.includes('YIELD') || upper.includes('BOND')) tags.push('BONDS', 'YIELDS');
  if (upper.includes('DOLLAR') || upper.includes('EUR') || upper.includes('CURRENCY') || upper.includes('FOREX') || upper.includes('SGD')) tags.push('FX', 'USD');
  if (upper.includes('S&P') || upper.includes('SPX') || upper.includes('NASDAQ') || upper.includes('EARNINGS') || upper.includes('STOCKS')) tags.push('EQUITIES');

  if (tags.length === 0) tags.push('MARKETS', 'MACRO');
  return Array.from(new Set(tags)).slice(0, 4);
}

/**
 * Format relative time string
 */
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now';
  const diffMs = Date.now() - new Date(dateString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';

  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60 > 0 ? (mins % 60) + 'm' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Fetch and parse live RSS feeds
 */
async function fetchLiveRssFeeds(): Promise<SentimentArticle[]> {
  const rssSources = [
    {
      url: 'https://news.google.com/rss/search?q=financial+markets+stocks+economy+fed+rates+earnings&hl=en-US&gl=US&ceid=US:en',
      defaultSource: 'Google Finance',
    },
    {
      url: 'https://finance.yahoo.com/news/rssindex',
      defaultSource: 'Yahoo Finance',
    },
    {
      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
      defaultSource: 'CoinDesk',
    },
  ];

  const results: SentimentArticle[] = [];

  for (const src of rssSources) {
    try {
      const feed = await parser.parseURL(src.url);
      if (feed && feed.items && feed.items.length > 0) {
        for (const item of feed.items.slice(0, 10)) {
          if (!item.title) continue;

          // Clean title and extract publisher if Google News format "Headline - Publisher"
          let title = item.title.trim();
          let publisher = src.defaultSource;

          if (title.includes(' - ')) {
            const parts = title.split(' - ');
            if (parts.length >= 2) {
              publisher = parts.pop()?.trim() || src.defaultSource;
              title = parts.join(' - ').trim();
            }
          }

          // Strip HTML tags from title
          title = title.replace(/<[^>]*>?/gm, '');

          let link = (item.link || item.guid || '').trim();
          if (!link.startsWith('http')) {
            link = link.startsWith('/')
              ? `https://finance.yahoo.com${link}`
              : link.startsWith('?')
              ? `https://finance.yahoo.com/news/${link}`
              : 'https://finance.yahoo.com';
          }

          const { sentiment, score } = analyzeSentiment(title, item.contentSnippet || '');
          const tags = extractTags(title);
          const author = item.creator || item.author || `${publisher} Desk`;
          const timeStr = formatRelativeTime(item.isoDate || item.pubDate);
          const randomSuffix = Math.random().toString(36).substring(2, 8);

          results.push({
            id: `rss-${publisher.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}-${randomSuffix}`,
            time: timeStr,
            headline: title,
            sentiment,
            score,
            tags,
            source: publisher,
            sourceUrl: link,
            author,
            pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      // Quietly continue if an external RSS endpoint has a transient network timeout
    }
  }

  // Deduplicate articles by similar headlines and ensure unique IDs
  const seenHeadlines = new Set<string>();
  const uniqueArticles: SentimentArticle[] = [];

  for (let i = 0; i < results.length; i++) {
    const art = results[i];
    const norm = art.headline.toLowerCase().substring(0, 35);
    if (!seenHeadlines.has(norm)) {
      seenHeadlines.add(norm);
      art.id = `rss-art-${i}-${art.source.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`;
      uniqueArticles.push(art);
    }
  }

  return uniqueArticles;
}

export default async function handler(req: any, res: any) {
  res.setHeader?.('Access-Control-Allow-Origin', '*');
  res.setHeader?.('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : new Response(null, { status: 200 });
  }

  const now = Date.now();

  // If cache is valid, return immediately for fast response
  if (cachedArticles.length > 0 && now - lastFetchTimestamp < CACHE_TTL_MS) {
    const payload = {
      status: 'ok',
      count: cachedArticles.length,
      source: 'live_rss_cache',
      timestamp: new Date().toISOString(),
      articles: cachedArticles,
    };
    if (res.status && typeof res.json === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const liveArticles = await fetchLiveRssFeeds();
    if (liveArticles.length > 0) {
      cachedArticles = liveArticles;
      lastFetchTimestamp = now;
    }
  } catch (err) {
    console.error('[RSS News API] Error fetching live RSS feeds:', err);
  }

  if (cachedArticles.length === 0) {
    const offlinePayload = {
      status: 'offline',
      count: 0,
      source: 'live_rss_feed',
      message: 'Live Financial RSS News Feed Offline - No articles returned from upstream providers',
      timestamp: new Date().toISOString(),
      articles: [],
    };
    if (res.status && typeof res.json === 'function') {
      return res.status(503).json(offlinePayload);
    }
    return new Response(JSON.stringify(offlinePayload), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = {
    status: 'ok',
    count: cachedArticles.length,
    source: 'live_rss_feed',
    timestamp: new Date().toISOString(),
    articles: cachedArticles,
  };

  if (res.status && typeof res.json === 'function') {
    return res.status(200).json(payload);
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
