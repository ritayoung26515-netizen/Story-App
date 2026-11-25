import React, { useState } from 'react';
import { Check, Copy, Download, KeyRound, Smartphone, WifiOff } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPanel: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showMobileGuide, setShowMobileGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  return (
    <div className="space-y-4 border-t border-[var(--border-hairline)] pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            手機安裝說明
          </span>
        </div>
        {isInstalled ? (
          <span className="text-xs text-emerald-500 font-medium">
            目前正以獨立 App 模式運行
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        手稿與角色只存在本機。AI 續寫請到本頁最上方貼上 Gemini API Key 並按「儲存
        API Key」——<strong className="text-[var(--text-primary)]">唔使填任何網址</strong>。
      </p>

      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 flex gap-2">
        <KeyRound className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
          <span className="text-emerald-400 font-medium">正確做法：</span>
          向上捲到「Gemini API Key」欄，貼上 AQ. 或 AIza 開頭的 Key，按儲存。不要把 Key
          填進任何「網址」欄位。
        </p>
      </div>

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
              ? '收合安裝步驟'
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
              方式 A：從 GitHub 下載 Android APK
            </p>
            <p className="mt-0.5 leading-relaxed">
              打開 GitHub → Actions → Build Android APK → 下載 Artifacts 裡的 APK
              安裝到手機。
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <p className="font-semibold text-[var(--text-primary)]">
              方式 B：瀏覽器加到主畫面
            </p>
            <p className="mt-0.5 leading-relaxed">
              Android：選單 → 安裝應用程式。iPhone：Safari 分享 → 加入主畫面。
            </p>
          </div>
        </div>
      )}
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
              1. 請在 <strong>Safari</strong> 瀏覽器開啟本頁。
              <br />
              2. 點擊 <strong>分享</strong>。
              <br />
              3. 選擇 <strong>加入主畫面</strong>。
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
      <span>目前為離線狀態・可繼續編寫（AI 需連線）</span>
    </div>
  );
};
