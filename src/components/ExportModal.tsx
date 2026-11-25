import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FolderPlus,
  KeyRound,
  Trash2,
  Upload,
  X,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { StoryProject } from '../types/story';
import {
  buildMarkdownExport,
  countLiteraryWords,
  downloadTextFile,
  migrateProject,
} from '../utils/storage';
import { PWAInstallPanel } from './PWAInstallBanner';
import {
  getGeminiApiKey,
  getPrivateServerUrl,
  hasGeminiApiKey,
  saveGeminiApiKey,
  savePrivateServerUrl,
} from '../utils/api';

interface ExportModalProps {
  isOpen: boolean;
  projects: StoryProject[];
  activeProject: StoryProject;
  onClose: () => void;
  onSelectProject: (id: string) => void;
  onCreateProject: (
    title: string,
    template: 'literary' | 'game_dungeon' | 'lengye_emma'
  ) => void;
  onDeleteProject: (id: string) => void;
  onImportProject: (project: StoryProject) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  projects,
  activeProject,
  onClose,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onImportProject,
}) => {
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectTemplate, setNewProjectTemplate] = useState<
    'literary' | 'game_dungeon' | 'lengye_emma'
  >('lengye_emma');
  const [exportBranchId, setExportBranchId] = useState<string>('all');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [geminiKey, setGeminiKey] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGeminiKey(getGeminiApiKey());
    // Only show URL if user previously saved a real one; ignore accidental junk
    const saved = getPrivateServerUrl();
    setServerUrl(saved.startsWith('http') ? saved : '');
    setKeySaved(hasGeminiApiKey());
    setSettingsMsg(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    const trimmedKey = geminiKey.trim();
    if (!trimmedKey) {
      setSettingsMsg('請先貼上 Gemini API Key（AQ. 或 AIza 開頭）。');
      return;
    }

    const keyResult = saveGeminiApiKey(trimmedKey);
    if (!keyResult.ok) {
      setSettingsMsg(keyResult.error || '儲存 API Key 失敗');
      return;
    }

    // 伺服器網址完全選填：空白或無效時一律清掉，唔阻住儲存 Key
    const trimmedUrl = serverUrl.trim();
    if (!trimmedUrl) {
      savePrivateServerUrl('');
      setServerUrl('');
    } else {
      const urlResult = savePrivateServerUrl(trimmedUrl);
      if (!urlResult.ok) {
        // 仍然保存 Key，只提示網址有問題並清空
        savePrivateServerUrl('');
        setServerUrl('');
        setKeySaved(true);
        setSettingsMsg(
          'API Key 已儲存成功。伺服器網址格式不正確已忽略（手機私人使用可留空）。'
        );
        return;
      }
    }

    setKeySaved(true);
    setSettingsMsg(
      '已儲存 API Key。手機私人使用唔使填伺服器網址，可直接去寫作頁試「續寫」。'
    );
  };

  const handleExportMarkdown = () => {
    const md = buildMarkdownExport(
      activeProject,
      exportBranchId === 'all' ? undefined : exportBranchId
    );
    const branchSuffix =
      exportBranchId === 'all'
        ? '全結局合集'
        : activeProject.branches.find((b) => b.id === exportBranchId)?.code ||
          '分支';
    downloadTextFile(
      `${activeProject.title || '小說手稿'}_${branchSuffix}.md`,
      md,
      'text/markdown;charset=utf-8'
    );
  };

  const handleExportJson = () => {
    downloadTextFile(
      `${activeProject.title || '小說專案'}_備份.json`,
      JSON.stringify(activeProject, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as StoryProject;
      if (!parsed.title || !Array.isArray(parsed.chapters)) {
        throw new Error('檔案格式不符，請匯入由墨影手稿匯出的 JSON 專案檔。');
      }
      const migrated = migrateProject({
        ...parsed,
        id: `proj_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      });
      onImportProject(migrated);
      onClose();
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : '匯入 JSON 專案失敗'
      );
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-lg sm:max-w-2xl rounded-t-2xl sm:rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
          <h2
            id="export-modal-title"
            className="font-display text-xl sm:text-2xl font-semibold text-[var(--text-primary)]"
          >
            設定與作品
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="space-y-3 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Gemini API Key
            </h3>
            {keySaved && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-400">
                <Check className="h-3 w-3" /> 已設定
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
            只需要貼 Gemini Key，唔使填網址。Key 只存在呢部手機。到{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline text-[var(--accent-primary)]"
            >
              Google AI Studio
            </a>{' '}
            複製（AQ. 或 AIza 開頭都得）。
          </p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="貼上 AQ. 或 AIza 開頭的 Gemini Key"
              autoComplete="off"
              className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 pr-10 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-secondary)] cursor-pointer"
              aria-label={showKey ? '隱藏' : '顯示'}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[11px] text-[var(--text-secondary)] underline cursor-pointer"
          >
            {showAdvanced ? '收起進階選項' : '進階：伺服器網址（可留空）'}
          </button>

          {showAdvanced && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-[var(--text-secondary)]">
                私人伺服器網址 — 一般用戶請留空，唔使填
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="留空即可"
                className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveSettings}
            className="w-full rounded-lg bg-[var(--accent-primary)] px-4 py-2.5 text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
          >
            儲存 API Key
          </button>
          {settingsMsg && (
            <p className="text-[11px] text-emerald-400/90 whitespace-pre-wrap">
              {settingsMsg}
            </p>
          )}
        </section>

        <section className="space-y-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            匯出《{activeProject.title}》
          </p>
          <select
            aria-label="選擇匯出結局分支"
            value={exportBranchId}
            onChange={(e) => setExportBranchId(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)]"
          >
            <option value="all">全部章節與所有平行結局</option>
            {activeProject.branches.map((b) => (
              <option key={b.id} value={b.id}>
                [{b.code}] {b.title}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-2.5 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              下載 .md
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              備份 .json
            </button>
          </div>
        </section>

        <section className="space-y-3 border-t border-[var(--border-hairline)] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              本機專案
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              匯入
            </button>
          </div>

          {importError && (
            <p className="text-xs text-rose-400">{importError}</p>
          )}

          <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {projects.map((proj) => {
              const isCurrent = proj.id === activeProject.id;
              const totalWords = proj.chapters.reduce(
                (sum, ch) => sum + countLiteraryWords(ch.content),
                0
              );

              return (
                <div
                  key={proj.id}
                  className="flex items-center justify-between gap-2 px-3 py-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold text-[var(--text-primary)] truncate">
                        {proj.title}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-[var(--accent-primary)] shrink-0">
                          編輯中
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {proj.characters.length} 主角 · {proj.branches.length} 線 ·{' '}
                      {totalWords} 字
                    </p>
                  </button>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      title="刪除專案"
                      className="p-2 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProjectTitle.trim()) return;
            onCreateProject(newProjectTitle.trim(), newProjectTemplate);
            setNewProjectTitle('');
            onClose();
          }}
          className="space-y-2 border-t border-[var(--border-hairline)] pt-4"
        >
          <p className="text-xs font-medium text-[var(--text-secondary)]">
            新建專案
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['lengye_emma', '冷夜紫'],
                ['literary', '文學'],
                ['game_dungeon', '副本'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setNewProjectTemplate(id)}
                className={`px-2.5 py-1 text-[11px] rounded-full cursor-pointer ${
                  newProjectTemplate === id
                    ? 'bg-[var(--accent-primary)] text-stone-100'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-hairline)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="書名……"
              className="flex-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              建立
            </button>
          </div>
        </form>

        <PWAInstallPanel />
      </div>
    </div>
  );
};
