import type express from 'express';
import { ThinkingLevel } from '@google/genai';
import { getAiClient, resolveRequestApiKey } from '../utils/aiClient.js';
import { MODEL_NAME, LITERARY_SAFETY_SETTINGS } from './literaryEngine.js';

export function registerStoryApi(app: express.Express) {
  app.post('/api/story/generate-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    try {
      const {
        projectTitle,
        world,
        contentSettings,
        characters,
        currentContent,
        direction,
        chapterTitle,
        chapterNumber,
        targetLengthHint,
      } = req.body || {};

      const ai = getAiClient(resolveRequestApiKey(req));
      const cast = Array.isArray(characters)
        ? characters
            .map(
              (c: { name?: string; coreTraits?: string }) =>
                `${c.name || '角色'}：${c.coreTraits || ''}`
            )
            .join('\n')
        : '';

      const prompt = `你是文學小說續寫助手。書名：《${projectTitle || '未命名'}》
章節：第 ${chapterNumber || 1} 章 ${chapterTitle || ''}
世界：${world?.eraOrSetting || ''} / ${world?.coreConflict || ''}
尺度：${contentSettings?.sensualLevel || ''} / ${contentSettings?.darknessLevel || ''}

主角：
${cast}

已有正文：
${(currentContent || '').slice(-3000)}

寫作指示：${direction || '自然延續情節，保持人設一致'}
篇幅：${targetLengthHint || '約 700 至 1000 字'}

請直接輸出續寫正文，不要前言或標題。`;

      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          temperature: 0.9,
          safetySettings: LITERARY_SAFETY_SETTINGS as never,
        },
      });

      for await (const chunk of stream) {
        const t = chunk.text || '';
        if (t) {
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: t })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失敗';
      console.error('generate-stream:', error);
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      } catch {
        /* ignore */
      }
      res.end();
    }
  });

  app.post('/api/story/rewrite', async (req, res) => {
    try {
      const { selectedText, mode, surroundingContext } = req.body || {};
      const ai = getAiClient(resolveRequestApiKey(req));
      const modeHint =
        mode === 'expand'
          ? '擴寫細節與感官'
          : mode === 'condense'
            ? '精煉壓縮'
            : mode === 'intensify'
              ? '加強張力與情緒'
              : '改寫得更優美流暢';
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `請${modeHint}以下段落，只輸出改寫後正文：\n上下文：${(surroundingContext || '').slice(0, 800)}\n選取：${selectedText || ''}`,
      });
      res.json({ rewritten: result.text || selectedText || '' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '改寫失敗';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/story/extract-memory', async (req, res) => {
    try {
      const { chapterContent, chapterTitle, chapterNumber } = req.body || {};
      const ai = getAiClient(resolveRequestApiKey(req));
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `從以下章節擷取 3～6 條關鍵記憶（JSON 陣列，每項含 category,title,detail,shouldPin）。category 限 plot|character|intimacy|foreshadowing|sensory。\n章：${chapterTitle}\n${(chapterContent || '').slice(0, 4000)}\n只輸出 JSON 陣列。`,
      });
      let newMemories: unknown[] = [];
      try {
        const raw = (result.text || '').replace(/```json|```/g, '').trim();
        newMemories = JSON.parse(raw);
      } catch {
        newMemories = [
          {
            category: 'plot',
            title: `第${chapterNumber || ''}章要點`,
            detail: (result.text || '').slice(0, 200),
            shouldPin: false,
          },
        ];
      }
      res.json({ newMemories, chapterSummary: '', scoreChanges: [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : '擷取記憶失敗';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/story/check-consistency', async (req, res) => {
    try {
      const { chapterContent, characters } = req.body || {};
      const ai = getAiClient(resolveRequestApiKey(req));
      const names = Array.isArray(characters)
        ? characters.map((c: { name?: string }) => c.name).join('、')
        : '';
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `檢查以下正文與角色（${names}）是否人設矛盾，用繁中簡要列出問題；若無問題說「未發現明顯矛盾」。\n${(chapterContent || '').slice(0, 3000)}`,
      });
      res.json({
        overallStatus: 'reviewed',
        summary: result.text || '',
        issues: [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '檢查失敗';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/story/deepen-character', async (req, res) => {
    try {
      const { character, focus } = req.body || {};
      const ai = getAiClient(resolveRequestApiKey(req));
      const result = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `為角色「${character?.name || ''}」深化設定（重點：${focus || '性格與欲望'}），輸出 JSON：{coreTraits,surfacePersona,darkShadow,secretDesire,povVoiceStyle,invariants:string[]}。\n現有：${JSON.stringify(character || {}).slice(0, 1500)}`,
      });
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(
          (result.text || '').replace(/```json|```/g, '').trim()
        );
      } catch {
        data = { coreTraits: result.text || '' };
      }
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : '深化失敗';
      res.status(500).json({ error: message });
    }
  });
}
