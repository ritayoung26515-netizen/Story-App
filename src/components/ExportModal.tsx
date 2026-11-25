import React, { useRef, useState } from 'react';
import { Download, FolderPlus, Trash2, Upload, X } from 'lucide-react';
import type { StoryProject } from '../types/story';
import {
  buildMarkdownExport,
  countLiteraryWords,
  downloadTextFile,
  migrateProject,
} from '../utils/storage';

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

  if (!isOpen) return null;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="w-full max-w-2xl rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-4">
          <h2
            id="export-modal-title"
            className="font-display text-2xl font-semibold text-[var(--text-primary)]"
          >
            書稿匯出與多部作品切換
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Export Active Manuscript */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              匯出當前手稿：《{activeProject.title}》
            </p>
            <select
              aria-label="選擇匯出結局分支"
              value={exportBranchId}
              onChange={(e) => setExportBranchId(e.target.value)}
              className="rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
            >
              <option value="all">全部章節與所有平行結局</option>
              {activeProject.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  單獨匯出路線：[{b.code}] {b.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="flex items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              下載手稿 (.md)
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center justify-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              備份完整設定、關係網與記憶 (.json)
            </button>
          </div>
        </div>

        {/* Project Switcher */}
        <div className="space-y-3 border-t border-[var(--border-hairline)] pt-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              已儲存的小說專案（自動儲存於本機瀏覽器）
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
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              匯入 JSON 備份
            </button>
          </div>

          {importError && (
            <p className="text-xs text-rose-400">{importError}</p>
          )}

          <div className="divide-y divide-[var(--border-hairline)] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {projects.map((proj) => {
              const isCurrent = proj.id === activeProject.id;
              const totalWords = proj.chapters.reduce(
                (sum, ch) => sum + countLiteraryWords(ch.content),
                0
              );

              return (
                <div
                  key={proj.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
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
                      <span className="font-display text-lg font-semibold text-[var(--text-primary)] truncate">
                        {proj.title}
                      </span>
                      {isCurrent && (
                        <span className="text-xs text-[var(--accent-primary)]">
                          · 編輯中
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-mono-num">
                      {proj.characters.length} 主角 ·{' '}
                      {proj.supportingCharacters.length} 配角 ·{' '}
                      {proj.branches.length} 條線 · {totalWords} 字
                    </p>
                  </button>

                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      title="刪除專案"
                      className="p-1.5 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Create New Novel */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newProjectTitle.trim()) return;
            onCreateProject(newProjectTitle.trim(), newProjectTemplate);
            setNewProjectTitle('');
            onClose();
          }}
          className="space-y-3 border-t border-[var(--border-hairline)] pt-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              開立新小說專案（選擇底版）
            </span>
            <div className="flex flex-wrap items-center gap-1 p-1 rounded bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
              <button
                type="button"
                onClick={() => setNewProjectTemplate('lengye_emma')}
                className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                  newProjectTemplate === 'lengye_emma'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                冷夜紫 Emma 範本
              </button>
              <button
                type="button"
                onClick={() => setNewProjectTemplate('literary')}
                className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                  newProjectTemplate === 'literary'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                文學 / 寫實幻想
              </button>
              <button
                type="button"
                onClick={() => setNewProjectTemplate('game_dungeon')}
                className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                  newProjectTemplate === 'game_dungeon'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                遊戲副本計分範本
              </button>
            </div>
          </div>

          <div className="flex gap-2.5">
            <input
              type="text"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              placeholder="輸入新小說書名……"
              className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer shrink-0"
            >
              <FolderPlus className="h-4 w-4" />
              建立新作品
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
