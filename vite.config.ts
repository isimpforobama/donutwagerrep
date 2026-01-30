import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Plinko data storage paths
const DATA_DIR = path.join(__dirname, 'data');
const PATHS_FILE = path.join(DATA_DIR, 'plinko_paths.json');
const PROBS_FILE = path.join(DATA_DIR, 'plinko_probabilities.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize empty files if they don't exist
if (!fs.existsSync(PATHS_FILE)) {
  fs.writeFileSync(PATHS_FILE, JSON.stringify({ "8": {}, "12": {}, "16": {} }, null, 2));
}
if (!fs.existsSync(PROBS_FILE)) {
  fs.writeFileSync(PROBS_FILE, JSON.stringify({
    "8": [1, 4, 12, 24, 26, 24, 12, 4, 1],
    "12": [1, 3, 8, 16, 22, 26, 28, 26, 22, 16, 8, 3, 1],
    "16": [1, 2, 5, 10, 16, 22, 28, 32, 34, 32, 28, 22, 16, 10, 5, 2, 1],
  }, null, 2));
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Custom plugin for Plinko data API
        {
          name: 'plinko-api',
          configureServer(server) {
            // GET /api/plinko/paths - Read all paths
            server.middlewares.use('/api/plinko/paths', (req, res, next) => {
              if (req.method === 'GET') {
                try {
                  const data = fs.readFileSync(PATHS_FILE, 'utf8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(data);
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to read paths' }));
                }
              } else if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const paths = JSON.parse(body);
                    fs.writeFileSync(PATHS_FILE, JSON.stringify(paths, null, 2));
                    console.log('[Plinko API] Saved paths to file, size:', body.length, 'bytes');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true }));
                  } catch (e) {
                    console.error('[Plinko API] Error saving paths:', e);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Failed to save paths' }));
                  }
                });
              } else {
                next();
              }
            });

            // GET/POST /api/plinko/probabilities
            server.middlewares.use('/api/plinko/probabilities', (req, res, next) => {
              if (req.method === 'GET') {
                try {
                  const data = fs.readFileSync(PROBS_FILE, 'utf8');
                  res.setHeader('Content-Type', 'application/json');
                  res.end(data);
                } catch (e) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: 'Failed to read probabilities' }));
                }
              } else if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => { body += chunk; });
                req.on('end', () => {
                  try {
                    const probs = JSON.parse(body);
                    fs.writeFileSync(PROBS_FILE, JSON.stringify(probs, null, 2));
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true }));
                  } catch (e) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: 'Failed to save probabilities' }));
                  }
                });
              } else {
                next();
              }
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
