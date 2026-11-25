import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';
import {getGeminiApiKey} from './utils/api';
import {
  clientGenerateStream,
  clientRewrite,
  clientExtractMemory,
  clientCheckConsistency,
  clientDeepenCharacter,
} from './utils/geminiClient';

registerSW({immediate: true});

const originalFetch = window.fetch.bind(window);

/**
 * Private phone mode: with an in-app Gemini key, /api/story/* is handled
 * on-device (no backend server required). Other requests pass through.
 */
window.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  const key = getGeminiApiKey();
  if (!key || !url.includes('/api/story/')) {
    return originalFetch(input, init);
  }

  let body: Record<string, unknown> = {};
  try {
    if (init?.body && typeof init.body === 'string') {
      body = JSON.parse(init.body);
    }
  } catch {
    body = {};
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  try {
    if (url.includes('/api/story/generate-stream')) {
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const send = (obj: unknown) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)
            );
          };
          try {
            await clientGenerateStream(
              body,
              (text) => send({ type: 'chunk', text }),
              init?.signal ?? undefined
            );
            send({ type: 'done' });
          } catch (err) {
            if ((err as Error).name !== 'AbortError') {
              send({
                type: 'error',
                message:
                  err instanceof Error ? err.message : '生成失敗',
              });
            }
          } finally {
            controller.close();
          }
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    if (url.includes('/api/story/rewrite')) {
      const rewritten = await clientRewrite(body);
      return json({ rewritten });
    }

    if (url.includes('/api/story/extract-memory')) {
      const data = await clientExtractMemory(body);
      return json(data);
    }

    if (url.includes('/api/story/check-consistency')) {
      const data = await clientCheckConsistency(body);
      return json(data);
    }

    if (url.includes('/api/story/deepen-character')) {
      const data = await clientDeepenCharacter(body);
      return json(data);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '請求失敗';
    return json({ error: message }, 500);
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(<App />);
