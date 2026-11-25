/**
 * Direct Gemini REST calls from the app (no backend required).
 * Used when user pastes API key in Settings and has no private server URL.
 */
import { getGeminiApiKey } from './api';

const MODEL = 'gemini-2.0-flash';

function requireKey(): string {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(
      '尚未設定 Gemini API Key。請點右上角「設定與作品」，貼上 Key 後儲存。'
    );
  }
  return key;
}

async function generateText(prompt: string): Promise<string> {
  const key = requireKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9 },
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.error?.status ||
      `Gemini 請求失敗 (${res.status})`;
    throw new Error(msg);
  }
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p: { text?: string }) => p.text || '').join('');
}

/** Stream-like generation: yields text chunks via callback (simulated from full response for mobile reliability). */
export async function clientGenerateStream(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const projectTitle = String(body.projectTitle || '未命名');
  const chapterNumber = body.chapterNumber ?? 1;
  const chapterTitle = String(body.chapterTitle || '');
  const world = (body.world || {}) as Record<string, string>;
  const contentSettings = (body.contentSettings || {}) as Record<string, string>;
  const characters = Array.isArray(body.characters) ? body.characters : [];
  const currentContent = String(body.currentContent || '');
  const direction = String(body.direction || '自然延續情節，保持人設一致');
  const targetLengthHint = String(
    body.targetLengthHint || '約 700 至 1000 字'
  );

  const cast = characters
    .map(
      (c: { name?: string; coreTraits?: string }) =>
        `${c.name || '角色'}：${c.coreTraits || ''}`
    )
    .join('\n');

  const prompt = `你是文學小說續寫助手。書名：《${projectTitle}》
章節：第 ${chapterNumber} 章 ${chapterTitle}
世界：${world.eraOrSetting || ''} / ${world.coreConflict || ''}
尺度：${contentSettings.sensualLevel || ''} / ${contentSettings.darknessLevel || ''}

主角：
${cast}

已有正文：
${currentContent.slice(-3000)}

寫作指示：${direction}
篇幅：${targetLengthHint}

請直接輸出續寫正文，不要前言或標題。`;

  const full = await generateText(prompt);
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  // Yield in small chunks so UI can update progressively
  const step = 24;
  for (let i = 0; i < full.length; i += step) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    onChunk(full.slice(i, i + step));
    await new Promise((r) => setTimeout(r, 12));
  }
}

export async function clientRewrite(body: Record<string, unknown>): Promise<string> {
  const selectedText = String(body.selectedText || '');
  const mode = String(body.mode || 'polish');
  const surroundingContext = String(body.surroundingContext || '');
  const modeHint =
    mode === 'expand'
      ? '擴寫細節與感官'
      : mode === 'condense'
        ? '精煉壓縮'
        : mode === 'intensify'
          ? '加強張力與情緒'
          : '改寫得更優美流暢';
  return generateText(
    `請${modeHint}以下段落，只輸出改寫後正文：\n上下文：${surroundingContext.slice(0, 800)}\n選取：${selectedText}`
  );
}

export async function clientExtractMemory(
  body: Record<string, unknown>
): Promise<{ newMemories: unknown[]; chapterSummary: string; scoreChanges: unknown[] }> {
  const chapterContent = String(body.chapterContent || '');
  const chapterTitle = String(body.chapterTitle || '');
  const chapterNumber = body.chapterNumber ?? '';
  const text = await generateText(
    `從以下章節擷取 3～6 條關鍵記憶（JSON 陣列，每項含 category,title,detail,shouldPin）。category 限 plot|character|intimacy|foreshadowing|sensory。\n章：${chapterTitle}\n${chapterContent.slice(0, 4000)}\n只輸出 JSON 陣列。`
  );
  try {
    const raw = text.replace(/```json|```/g, '').trim();
    const newMemories = JSON.parse(raw);
    return { newMemories, chapterSummary: '', scoreChanges: [] };
  } catch {
    return {
      newMemories: [
        {
          category: 'plot',
          title: `第${chapterNumber}章要點`,
          detail: text.slice(0, 200),
          shouldPin: false,
        },
      ],
      chapterSummary: '',
      scoreChanges: [],
    };
  }
}

export async function clientCheckConsistency(
  body: Record<string, unknown>
): Promise<{ overallStatus: string; summary: string; issues: unknown[] }> {
  const chapterContent = String(body.chapterContent || '');
  const characters = Array.isArray(body.characters) ? body.characters : [];
  const names = characters
    .map((c: { name?: string }) => c.name)
    .filter(Boolean)
    .join('、');
  const summary = await generateText(
    `檢查以下正文與角色（${names}）是否人設矛盾，用繁中簡要列出問題；若無問題說「未發現明顯矛盾」。\n${chapterContent.slice(0, 3000)}`
  );
  return { overallStatus: 'reviewed', summary, issues: [] };
}

export async function clientDeepenCharacter(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const character = body.character || {};
  const focus = String(body.focus || '性格與欲望');
  const name =
    typeof character === 'object' && character && 'name' in character
      ? String((character as { name?: string }).name || '')
      : '';
  const text = await generateText(
    `為角色「${name}」深化設定（重點：${focus}），輸出 JSON：{coreTraits,surfacePersona,darkShadow,secretDesire,povVoiceStyle,invariants:string[]}。\n現有：${JSON.stringify(character).slice(0, 1500)}`
  );
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    return { coreTraits: text };
  }
}
