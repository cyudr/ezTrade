import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Import serverless API handlers directly
import healthHandler from './api/health';
import marketLatestHandler from './api/market/latest';
import marketTimeseriesHandler from './api/market/timeseries';
import cryptoPricesHandler from './api/crypto/prices';
import marketStocksHandler from './api/market/stocks';
import marketNewsHandler from './api/market/news';
import signalsHandler from './api/signals/index';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes (Mounted first)
  app.all('/api/health', (req, res) => healthHandler(req, res));
  app.all('/api/market/latest', (req, res) => marketLatestHandler(req, res));
  app.all('/api/market/timeseries', (req, res) => marketTimeseriesHandler(req, res));
  app.all('/api/market/stocks', (req, res) => marketStocksHandler(req, res));
  app.all('/api/market/news', (req, res) => marketNewsHandler(req, res));
  app.all('/api/crypto/prices', (req, res) => cryptoPricesHandler(req, res));
  app.all('/api/signals', (req, res) => signalsHandler(req, res));

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quant Terminal server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
