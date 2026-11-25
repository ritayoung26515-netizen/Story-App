import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
  Type,
} from '@google/genai';
import type {
  ChapterSensoryMarkers,
  ContentSettings,
  DungeonInstance,
  DungeonScoreState,
  FamiliarityLevel,
  MemoryEntry,
  Protagonist,
  RelationshipEdge,
  RewriteMode,
  StoryBranch,
  SupportingCharacter,
  WorldSettings,
} from './src/types/story.js';
import { getAiClient, resolveRequestApiKey } from './src/utils/aiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

// NOTE: Full literary generation logic continues in the rest of the restored file.
// Temporary minimal server so the app builds while full logic is restored.

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const allowedOrigins = new Set<string>([
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    ...(process.env.ALLOWED_ORIGIN
      ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
      : []),
  ]);

  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Gemini-Api-Key');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (req, res) => {
    const fromHeader = Boolean(resolveRequestApiKey(req));
    res.json({
      ok: true,
      hasAiKey: fromHeader || Boolean(process.env.GEMINI_API_KEY),
      keySource: fromHeader ? 'request' : process.env.GEMINI_API_KEY ? 'env' : 'none',
    });
  });

  // Stub routes so frontend does not 404 while full literary engine is reattached
  const notReady = (_req: express.Request, res: express.Response) => {
    res.status(503).json({
      error:
        '伺服器寫作引擎正在還原完整功能。請稍後再試，或在 GitHub Actions 成功後重新部署。',
    });
  };
  app.post('/api/story/generate-stream', notReady);
  app.post('/api/story/rewrite', notReady);
  app.post('/api/story/extract-memory', notReady);
  app.post('/api/story/check-consistency', notReady);
  app.post('/api/story/deepen-character', notReady);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
