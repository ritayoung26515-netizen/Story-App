import React, { useState } from 'react';
import { Check, Copy, Download, Server, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import {
  apiUrl,
  getPrivateServerUrl,
  savePrivateServerUrl,
} from '../utils/api';

export const PWAInstallPanel: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(() =>
    getPrivateServerUrl()
  );
  const [serverStatus, setServerStatus] = useState<{
    type: 'idle' | 'ok' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [isTestingServer, setIsTestingServer] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore clipboard restrictions inside sandboxed iframe
    }
  };

  const handleSaveAndTestServer = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = savePrivateServerUrl(serverUrlInput);
    if (!saved.ok) {
      setServerStatus({
        type: 'error',
        message: saved.error || '網址格式錯誤',
      });
      return;
    }

    setIsTestingServer(true);
    setServerStatus({ type: 'idle', message: '' });
    try {
      const res = await fetch(apiUrl('/api/health'));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { ok?: boolean; hasAiKey?: boolean };
      if (!data.ok) {
        throw new Error('伺服器回應異常');
      }
      setServerStatus({
        type: 'ok',
        message: data.hasAiKey
          ? '已連線至私人伺服器，且後端 Gemini 金鑰已就緒。'
          : '已連線至伺服器，但該伺服器環境變數尚未設定 GEMINI_API_KEY。',
      });
    } catch {
      setServerStatus({
        type: 'error',
        message:
          '無法連線至該伺服器，請確認伺服器已啟動、網址正確且允許跨網域存取。',
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  return (
    <div className="space-y-4 border-t border-[var(--border-hairline)] pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            手機安裝與 GitHub Android APK 私人連線設定
          </span>
        </div>
        {isInstalled ? (
          <span className="text-xs text-emerald-500 font-medium">
            目前正以獨立 App 模式運行
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        專案已內建 PWA 離線寫作與 GitHub Actions 自動編譯 Android APK 工作流。您的所有手稿與角色設定皆僅儲存在手機本機（不公開上傳）。
      </p>

      {!isInstalled && (
        <div className="flex flex-wrap items-center gap-2.5">
          {isInstallable && (
            <button
              type="button"
              onClick={install}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              一鍵安裝至裝置桌面
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowMobileGuide((v) => !v)}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors"
          >
            <Smartphone className="h-3.5 w-3.5" />
            {showMobileGuide
              ? '收合手機安裝步驟'
              : isIOS
                ? '查看 iPhone / Android 安裝步驟'
                : '查看手機安裝 / GitHub APK 步驟'}
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            {copiedUrl ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                已複製網址
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                複製目前網址
              </>
            )}
          </button>
        </div>
      )}

      {showMobileGuide && !isInstalled && (
        <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 space-y-2.5 text-xs text-[var(--text-secondary)]">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              方式 A：從 GitHub 下載原生 Android 安裝檔（.apk）
            </p>
            <p className="mt-0.5 leading-relaxed">
              1. 將專案推送至您的私人 GitHub 儲存庫後，打開 GitHub 頁面的「Actions」分頁。
              <br />
              2. 點選「Build Android APK」完成執行後，在底部 Artifacts 下載「moying-novel-studio-android-apk」並於手機安裝。
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <p className="font-semibold text-[var(--text-primary)]">
              方式 B：透過手機瀏覽器安裝（Chrome / Brave / Safari）
            </p>
            <p className="mt-0.5 leading-relaxed">
              Android（Chrome／Brave）：開啟網址 → 點擊選單（⋮）→「安裝應用程式／加到主畫面」。
              <br />
              iPhone / iPad（Safari）：開啟網址 → 點擊「分享」→「加入主畫面」。
            </p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSaveAndTestServer}
        className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3 space-y-2"
      >
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
          <Server className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
          <span>私人 AI 後端伺服器位址（供獨立 APK 連線使用，網頁版可留空）</span>
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          為確保金鑰安全，Gemini API 金鑰一律保管於您的私人後端伺服器環境變數（GEMINI_API_KEY），不在手機端輸入或暴露。在獨立 APK 中請填入您私人部署的後端網址：
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={serverUrlInput}
            onChange={(e) => setServerUrlInput(e.target.value)}
            placeholder="例如：https://your-private-server.onrender.com（留空則用目前網域）"
            className="flex-1 min-w-[200px] rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
          />
          <button
            type="submit"
            disabled={isTestingServer}
            className="rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer disabled:opacity-50"
          >
            {isTestingServer ? '測試中…' : '儲存並測試連線'}
          </button>
        </div>
        {serverStatus.type !== 'idle' && (
          <p
            className={`text-[11px] ${
              serverStatus.type === 'ok' ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {serverStatus.message}
          </p>
        )}
      </form>
    </div>
  );
};

export const FloatingInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2.5 shadow-xl">
        <Smartphone className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
        <span className="text-xs text-[var(--text-primary)] whitespace-nowrap">
          安裝「墨影手稿」手機版
        </span>
        {isInstallable ? (
          <button
            type="button"
            onClick={install}
            className="rounded bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer whitespace-nowrap"
          >
            安裝
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowIOSModal(true)}
            className="rounded bg-[var(--accent-primary)] px-2.5 py-1 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer whitespace-nowrap"
          >
            iPhone 步驟
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="關閉安裝提示"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-1 cursor-pointer"
        >
          ✕
        </button>
      </div>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 shadow-2xl space-y-3">
            <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              於 iPhone / iPad 安裝「墨影手稿」
            </h3>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              1. 請在 <strong>Safari</strong> 瀏覽器開啟本頁網址。
              <br />
              2. 點擊工具列上的 <strong>分享</strong> 圖示。
              <br />
              3. 選擇 <strong>加入主畫面</strong>，即可像原生 App 一樣全螢幕開啟與離線書寫。
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full rounded-md bg-[var(--accent-primary)] py-2 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-md border border-amber-500/40 bg-[var(--bg-elevated)] px-3 py-2 text-xs text-amber-400 shadow-lg">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>目前為離線狀態・可繼續查閱與編寫手稿（AI 功能需連線）</span>
    </div>
  );
};
