import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {apiHeaders, getGeminiApiKey} from './utils/api';

registerSW({immediate: true});

// Private use: if user pasted a Gemini key in Settings, attach it to every /api call.
const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  if (url.includes('/api/') && getGeminiApiKey()) {
    const merged = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    const extra = apiHeaders();
    Object.entries(extra).forEach(([k, v]) => {
      if (!merged.has(k)) merged.set(k, v);
    });
    return originalFetch(input, {...init, headers: merged});
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(<App />);
