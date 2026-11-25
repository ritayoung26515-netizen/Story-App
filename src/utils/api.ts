const STORAGE_KEY_SERVER_URL = 'ink_chiaroscuro_private_server_url_v1';
const STORAGE_KEY_GEMINI = 'ink_chiaroscuro_gemini_api_key_v1';

const ENV_API_BASE = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
)
  .trim()
  .replace(/\/+$/, '');

export function validatePrivateServerUrl(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return { valid: true, normalized: '' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        normalized: '',
        error: '伺服器網址必須以 https:// 或 http:// 開頭。',
      };
    }
    return {
      valid: true,
      normalized: parsed.origin + parsed.pathname.replace(/\/+$/, ''),
    };
  } catch {
    return {
      valid: false,
      normalized: '',
      error: '請輸入有效的網址格式（例如 https://your-private-app.onrender.com）。',
    };
  }
}

export function getPrivateServerUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved) {
      const check = validatePrivateServerUrl(saved);
      if (check.valid && check.normalized) return check.normalized;
    }
  } catch {
    // ignore
  }
  return ENV_API_BASE;
}

export function savePrivateServerUrl(raw: string): {
  ok: boolean;
  normalized: string;
  error?: string;
} {
  const check = validatePrivateServerUrl(raw);
  if (!check.valid) {
    return { ok: false, normalized: '', error: check.error };
  }
  try {
    if (check.normalized) {
      localStorage.setItem(STORAGE_KEY_SERVER_URL, check.normalized);
    } else {
      localStorage.removeItem(STORAGE_KEY_SERVER_URL);
    }
  } catch {
    // ignore
  }
  return { ok: true, normalized: check.normalized };
}

export function getGeminiApiKey(): string {
  try {
    return (localStorage.getItem(STORAGE_KEY_GEMINI) || '').trim();
  } catch {
    return '';
  }
}

export function saveGeminiApiKey(raw: string): { ok: boolean; error?: string } {
  const key = raw.trim();
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY_GEMINI, key);
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: '無法寫入本機儲存，請檢查瀏覽器權限。' };
  }
}

export function clearGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI);
  } catch {
    // ignore
  }
}

/** Headers for all /api calls. Includes Gemini key when user set one in-app. */
export function apiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
  const key = getGeminiApiKey();
  if (key) {
    headers['X-Gemini-Api-Key'] = key;
  }
  return headers;
}

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getPrivateServerUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
}

export function hasGeminiApiKey(): boolean {
  return getGeminiApiKey().length > 0;
}
