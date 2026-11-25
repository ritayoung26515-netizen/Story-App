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

// Full server restored from commit dd9636c + in-app API key header support.
// If this file appears truncated in git history, re-copy from artifacts.

const LITERARY_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

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
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, X-Gemini-Api-Key'
      );
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
      keySource: fromHeader
        ? 'request'
        : process.env.GEMINI_API_KEY
          ? 'env'
          : 'none',
    });
  });

  // Load full literary routes from the last known-good implementation module.
  // This keeps server.ts small enough for mobile-only workflow updates.
  try {
    const mod = await import('./src/server/storyApi.js');
    if (typeof mod.registerStoryApi === 'function') {
      mod.registerStoryApi(app, {
        MODEL_NAME,
        LITERARY_SAFETY_SETTINGS,
        getAiClient,
        resolveRequestApiKey,
        Type,
        ThinkingLevel,
      });
    }
  } catch (err) {
    console.error('storyApi module missing, AI routes unavailable:', err);
    const notReady = (_req: express.Request, res: express.Response) => {
      res.status(503).json({
        error:
          '寫作引擎模組尚未就緒。請稍候完整還原，或重新部署後再試。',
      });
    };
    app.post('/api/story/generate-stream', notReady);
    app.post('/api/story/rewrite', notReady);
    app.post('/api/story/extract-memory', notReady);
    app.post('/api/story/check-consistency', notReady);
    app.post('/api/story/deepen-character', notReady);
  }

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ink & Chiaroscuro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
