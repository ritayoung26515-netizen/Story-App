import { GoogleGenAI } from '@google/genai';

export function resolveRequestApiKey(req: {
  headers: Record<string, unknown>;
}): string | null {
  const h = req.headers['x-gemini-api-key'];
  if (typeof h === 'string' && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]) return String(h[0]).trim();
  return null;
}

export function getAiClient(requestApiKey?: string | null): GoogleGenAI {
  const apiKey =
    (requestApiKey && String(requestApiKey).trim()) ||
    process.env.GEMINI_API_KEY ||
    '';
  if (!apiKey) {
    throw new Error(
      '尚未設定 Gemini API Key。請在應用「設定」中貼上 Key，或設定伺服器環境變數 GEMINI_API_KEY。'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}
