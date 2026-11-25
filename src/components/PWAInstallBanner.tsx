import React, { useState } from 'react';
import { Check, Copy, Download, Smartphone, WifiOff } from 'lucide-react';
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
      // ignore clipboard restrictions inside sandboxed iframe
    }
  };

  return (
    <div className="space-y-3 border-t border-[var(--border-hairline)] pt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-medium text-[var(--text-primary)]">
            安裝成手機桌面 App（PWA 離線寫作支援）
          </span>
        </div>
        {isInstalled ? (
          <span className="text-xs text-emerald-500 font-medium">
            目前正以獨立 App 模式運行
          </span>
        ) : null}
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        無需經由 App Store 或 Google Play，直接將「墨影手稿」安裝到 iPhone 或 Android 手機桌面，即可全螢幕運行並於離線時繼續查閱與編修手稿（AI 續寫需保持連線）。
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
                ? '查看 iPhone / iPad 安裝步驟'
                : '查看手機安裝步驟（iOS / Android）'}
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
                複製 App 網址到手機開啟
              </>
            )}
          </button>
        </div>
      )}

      {showMobileGuide && !isInstalled && (
        <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3.5 space-y-2.5 text-xs text-[var(--text-secondary)]">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              iPhone / iPad（必須使用 Safari 瀏覽器開啟）：
            </p>
            <p className="mt-0.5 leading-relaxed">
              1. 在 Safari 開啟本網址後，點擊底部工具列的「分享」圖示（方框帶向上箭頭）。
              <br />
              2. 往下滑動並選擇「加入主畫面」，點擊右上角「新增」即可在桌面出現 App 圖示。
            </p>
          </div>
          <div className="pt-2 border-t border-[var(--border-hairline)]">
            <p className="font-semibold text-[var(--text-primary)]">
              Android 手機（使用 Chrome 瀏覽器開啟）：
            </p>
            <p className="mt-0.5 leading-relaxed">
              1. 在 Chrome 開啟本網址後，點擊上方「安裝 App」按鈕，或點擊右上角選單（⋮）。
              <br />
              2. 選擇「加到主畫面」／「安裝應用程式」並確認，即會安裝至桌面。
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
