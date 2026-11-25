import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckSquare,
  Feather,
  GitBranch,
  Plus,
  Search,
  Square,
  Trash2,
} from 'lucide-react';
import {
  BRANCH_STATUS_META,
  CHAPTER_STATUS_META,
  type BranchStatus,
  type Chapter,
  type ChapterStatus,
  type SceneBeat,
  type StoryBranch,
  type StoryProject,
} from '../types/story';
import {
  countLiteraryWords,
  getChapterCompletionRatio,
  getChaptersForBranchRoute,
} from '../utils/storage';

interface ProgressTrackerViewProps {
  project: StoryProject;
  activeBranchId: string;
  onUpdateProjectMeta: (patch: Partial<StoryProject>) => void;
  onSelectBranch: (branchId: string) => void;
  onAddBranch: (branch: StoryBranch) => void;
  onUpdateBranch: (branchId: string, patch: Partial<StoryBranch>) => void;
  onDeleteBranch: (branchId: string) => void;
  onAddChapter: (branchId?: string) => void;
  onUpdateChapter: (chapterId: string, patch: Partial<Chapter>) => void;
  onDeleteChapter: (chapterId: string) => void;
  onMoveChapter: (chapterId: string, direction: 'up' | 'down') => void;
  onOpenChapterInStudio: (chapterId: string, branchId?: string) => void;
}

export const ProgressTrackerView: React.FC<ProgressTrackerViewProps> = ({
  project,
  activeBranchId,
  onUpdateProjectMeta,
  onSelectBranch,
  onAddBranch,
  onUpdateBranch,
  onDeleteBranch,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onMoveChapter,
  onOpenChapterInStudio,
}) => {
  const [viewMode, setViewMode] = useState<'branches' | 'matrix' | 'beats'>(
    'branches'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | ChapterStatus>(
    'all'
  );
  const [povFilter, setPovFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [branchSearch, setBranchSearch] = useState('');
  const [newBeatInputs, setNewBeatInputs] = useState<Record<string, string>>(
    {}
  );

  // Fork New Ending Branch Form State
  const [showNewBranchForm, setShowNewBranchForm] = useState(false);
  const [branchCode, setBranchCode] = useState('');
  const [branchTitle, setBranchTitle] = useState('');
  const [branchTone, setBranchTone] = useState('TE 真相揭露');
  const [branchParentId, setBranchParentId] = useState('main');
  const [branchForkOrder, setBranchForkOrder] = useState<number>(20);
  const [branchPremise, setBranchPremise] = useState('');

  const stats = useMemo(() => {
    const totalWords = project.chapters.reduce(
      (sum, ch) => sum + countLiteraryWords(ch.content),
      0
    );
    const endingBranches = project.branches.filter((b) => b.id !== 'main');
    const completedEndings = endingBranches.filter(
      (b) => b.status === 'completed'
    ).length;
    const avgProgress =
      project.chapters.length > 0
        ? Math.round(
            project.chapters.reduce(
              (sum, ch) => sum + getChapterCompletionRatio(ch),
              0
            ) / project.chapters.length
          )
        : 0;
    const openForeshadowing = project.memories.filter(
      (m) => m.category === 'foreshadowing' && !m.resolved
    ).length;

    const povCounts = project.characters.map((c) => ({
      character: c,
      count: project.chapters.filter((ch) => ch.povCharacterId === c.id).length,
      words: project.chapters
        .filter((ch) => ch.povCharacterId === c.id)
        .reduce((sum, ch) => sum + countLiteraryWords(ch.content), 0),
    }));

    return {
      totalWords,
      endingCount: endingBranches.length,
      completedEndings,
      avgProgress,
      openForeshadowing,
      povCounts,
    };
  }, [project]);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    return project.branches.filter((b) => {
      if (!q) return true;
      return (
        b.code.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.endingTone.toLowerCase().includes(q) ||
        b.divergencePremise.toLowerCase().includes(q)
      );
    });
  }, [project.branches, branchSearch]);

  const filteredChapters = useMemo(() => {
    return [...project.chapters]
      .filter((ch) => {
        if (statusFilter !== 'all' && ch.status !== statusFilter) return false;
        if (povFilter !== 'all' && ch.povCharacterId !== povFilter) return false;
        if (branchFilter !== 'all' && ch.branchId !== branchFilter) return false;
        return true;
      })
      .sort((a, b) => a.timelineOrder - b.timelineOrder || a.number - b.number);
  }, [project.chapters, statusFilter, povFilter, branchFilter]);

  const handleOpenCreateBranch = () => {
    const nextNum = project.branches.filter((b) => b.id !== 'main').length + 1;
    setBranchCode(`END-${String(nextNum).padStart(2, '0')}`);
    setBranchTitle('');
    setBranchPremise('');
    setShowNewBranchForm(true);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchTitle.trim()) return;
    const created: StoryBranch = {
      id: `branch_${Date.now()}`,
      code: branchCode.trim() || `END-${project.branches.length}`,
      title: branchTitle.trim(),
      parentBranchId: branchParentId,
      forkTimelineOrder: Number(branchForkOrder) || 0,
      endingTone: branchTone.trim() || '平行結局',
      divergencePremise:
        branchPremise.trim() || '此平行世界的關鍵分歧點設定。',
      status: 'planning',
    };
    onAddBranch(created);
    setShowNewBranchForm(false);
  };

  const handleAddBeat = (chapter: Chapter) => {
    const title = (newBeatInputs[chapter.id] || '').trim();
    if (!title) return;
    const beat: SceneBeat = {
      id: `beat_${Date.now()}`,
      title,
      povCharacterId: chapter.povCharacterId,
      summary: '',
      completed: false,
    };
    onUpdateChapter(chapter.id, { beats: [...chapter.beats, beat] });
    setNewBeatInputs((prev) => ({ ...prev, [chapter.id]: '' }));
  };

  const handleToggleBeat = (chapter: Chapter, beatId: string) => {
    onUpdateChapter(chapter.id, {
      beats: chapter.beats.map((b) =>
        b.id === beatId ? { ...b, completed: !b.completed } : b
      ),
    });
  };

  const handleUpdateBeatPov = (
    chapter: Chapter,
    beatId: string,
    povId: string
  ) => {
    onUpdateChapter(chapter.id, {
      beats: chapter.beats.map((b) =>
        b.id === beatId ? { ...b, povCharacterId: povId } : b
      ),
    });
  };

  const handleDeleteBeat = (chapter: Chapter, beatId: string) => {
    onUpdateChapter(chapter.id, {
      beats: chapter.beats.filter((b) => b.id !== beatId),
    });
  };

  const totalGoalRatio =
    project.targetTotalWords > 0
      ? Math.min(
          100,
          Math.round((stats.totalWords / project.targetTotalWords) * 100)
        )
      : 0;

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">
            平行世界分支統籌 · 支援 20+ 多結局架構與時序章節追蹤
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mt-1">
            多結局分支與章節進度總覽
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenCreateBranch}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer transition-colors"
          >
            <GitBranch className="h-4 w-4" />
            分叉新結局線
          </button>
          <button
            type="button"
            onClick={() => onAddChapter(activeBranchId)}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs sm:text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            新增章節
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            全書累積字數
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono-num text-2xl font-semibold text-[var(--text-primary)]">
              {stats.totalWords.toLocaleString()}
            </span>
            <span className="text-xs font-mono-num text-[var(--text-secondary)]">
              目標 {totalGoalRatio}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span>總目標字數：</span>
            <input
              type="number"
              min={1000}
              step={1000}
              value={project.targetTotalWords}
              onChange={(e) =>
                onUpdateProjectMeta({
                  targetTotalWords: Math.max(
                    1000,
                    Number(e.target.value) || 0
                  ),
                })
              }
              className="w-24 bg-transparent border-b border-[var(--border-hairline)] font-mono-num text-[var(--text-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            平行結局分支數
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono-num text-2xl font-semibold text-[var(--text-primary)]">
              {stats.endingCount}
            </span>
            <span className="text-xs font-mono-num text-[var(--text-secondary)]">
              {stats.completedEndings} 條結局已定稿
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            各線獨立承接分歧前記憶，互不汙染
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            章節平均完成度 · 伏筆
          </span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono-num text-2xl font-semibold text-[var(--text-primary)]">
              {stats.avgProgress}%
            </span>
            <span className="text-xs font-mono-num text-[var(--text-secondary)]">
              {stats.openForeshadowing} 條未回收伏筆
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--bg-canvas)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] transition-all"
              style={{ width: `${stats.avgProgress}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-2">
          <span className="text-xs text-[var(--text-secondary)]">
            主角視角分佈（章數）
          </span>
          <div className="space-y-1">
            {stats.povCounts.slice(0, 4).map(({ character, count, words }) => (
              <div
                key={character.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0"
                    style={{ backgroundColor: character.accentColor }}
                  />
                  <span className="text-[var(--text-primary)] truncate">
                    {character.name}
                  </span>
                </div>
                <span className="font-mono-num text-[var(--text-secondary)] shrink-0">
                  {count} 章 · {words} 字
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fork New Parallel Ending Form */}
      {showNewBranchForm && (
        <form
          onSubmit={handleCreateBranch}
          className="rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
              開立新平行世界／結局分支
            </h2>
            <button
              type="button"
              onClick={() => setShowNewBranchForm(false)}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              取消
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                結局編號（如 END-01 ~ END-20）
              </label>
              <input
                type="text"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm font-mono-num text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                結局分支名稱
              </label>
              <input
                type="text"
                required
                value={branchTitle}
                onChange={(e) => setBranchTitle(e.target.value)}
                placeholder="例如：真結局・破鏡重圓線"
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                結局調性
              </label>
              <input
                type="text"
                value={branchTone}
                onChange={(e) => setBranchTone(e.target.value)}
                placeholder="HE / BE / TE / 開放 / 共犯"
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                從哪條線分歧（繼承其記憶）
              </label>
              <select
                value={branchParentId}
                onChange={(e) => setBranchParentId(e.target.value)}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {project.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.code}] {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                分歧點時序座標（#）
              </label>
              <input
                type="number"
                value={branchForkOrder}
                onChange={(e) => setBranchForkOrder(Number(e.target.value))}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm font-mono-num text-[var(--text-primary)]"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                平行世界分歧核心假設（此結局為何走上不同道路？）
              </label>
              <input
                type="text"
                value={branchPremise}
                onChange={(e) => setBranchPremise(e.target.value)}
                placeholder="例如：若在時序 #20 的拍賣夜，許知南沒有離開而是推開暗室門……"
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[var(--accent-primary)] px-5 py-2 text-xs sm:text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              建立此平行結局線
            </button>
          </div>
        </form>
      )}

      {/* View Mode & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={() => setViewMode('branches')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'branches'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            平行結局矩陣 ({project.branches.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            章節時序進度
          </button>
          <button
            type="button"
            onClick={() => setViewMode('beats')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              viewMode === 'beats'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            細部場記節拍
          </button>
        </div>

        {viewMode === 'branches' ? (
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={branchSearch}
              onChange={(e) => setBranchSearch(e.target.value)}
              placeholder="搜尋結局編號或關鍵字……"
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] w-56"
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="依分支篩選章節"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="all">所有平行分支</option>
              {project.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  [{b.code}] {b.title}
                </option>
              ))}
            </select>

            <select
              aria-label="依進度狀態篩選"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | ChapterStatus)
              }
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="all">所有進度階段</option>
              {Object.entries(CHAPTER_STATUS_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <select
              aria-label="依視角主角篩選"
              value={povFilter}
              onChange={(e) => setPovFilter(e.target.value)}
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="all">全部敘事視角</option>
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}視角
                </option>
              ))}
              <option value="omniscient">全知視角</option>
            </select>
          </div>
        )}
      </div>

      {/* View 1: Parallel Endings Matrix (scales cleanly for 20+ endings) */}
      {viewMode === 'branches' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBranches.map((branch) => {
            const routeChapters = getChaptersForBranchRoute(
              project,
              branch.id
            );
            const ownChapters = project.chapters.filter(
              (c) => c.branchId === branch.id
            );
            const ownWords = ownChapters.reduce(
              (sum, c) => sum + countLiteraryWords(c.content),
              0
            );
            const isActive = activeBranchId === branch.id;

            return (
              <div
                key={branch.id}
                className={`rounded-lg border p-5 space-y-3 transition-colors ${
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="font-mono-num font-semibold text-[var(--text-primary)]">
                      {branch.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <input
                      type="text"
                      value={branch.endingTone}
                      onChange={(e) =>
                        onUpdateBranch(branch.id, {
                          endingTone: e.target.value,
                        })
                      }
                      className="bg-transparent text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none w-28"
                    />
                    {branch.id !== 'main' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">
                          分歧點 #{branch.forkTimelineOrder}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label="分支完成狀態"
                      value={branch.status}
                      onChange={(e) =>
                        onUpdateBranch(branch.id, {
                          status: e.target.value as BranchStatus,
                        })
                      }
                      className="rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                    >
                      {Object.entries(BRANCH_STATUS_META).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {branch.id !== 'main' && (
                      <button
                        type="button"
                        onClick={() => onDeleteBranch(branch.id)}
                        title="刪除此分支"
                        className="p-1 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={branch.title}
                  onChange={(e) =>
                    onUpdateBranch(branch.id, { title: e.target.value })
                  }
                  className="w-full bg-transparent font-display text-xl font-semibold text-[var(--text-primary)] focus:outline-none"
                />

                <textarea
                  rows={2}
                  value={branch.divergencePremise}
                  onChange={(e) =>
                    onUpdateBranch(branch.id, {
                      divergencePremise: e.target.value,
                    })
                  }
                  className="w-full bg-transparent text-xs leading-relaxed text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none resize-none"
                />

                <div className="pt-3 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono-num text-[var(--text-secondary)]">
                    本線專屬 {ownChapters.length} 章 ({ownWords} 字) · 含前傳共{' '}
                    {routeChapters.length} 章
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectBranch(branch.id);
                        const firstOwn =
                          ownChapters[0] ||
                          routeChapters[routeChapters.length - 1];
                        if (firstOwn) {
                          onOpenChapterInStudio(firstOwn.id, branch.id);
                        } else {
                          onAddChapter(branch.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
                    >
                      <Feather className="h-3.5 w-3.5" />
                      進入此線寫作
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View 2 & 3: Chapter Matrix & Beats */}
      {viewMode !== 'branches' && (
        <div className="space-y-4">
          {filteredChapters.map((ch) => {
            const words = countLiteraryWords(ch.content);
            const ratio = getChapterCompletionRatio(ch);
            const idx = project.chapters.findIndex((item) => item.id === ch.id);
            const isFirst = idx === 0;
            const isLast = idx === project.chapters.length - 1;
            const povChar =
              ch.povCharacterId === 'omniscient'
                ? null
                : project.characters.find((c) => c.id === ch.povCharacterId);
            const chBranch = project.branches.find((b) => b.id === ch.branchId);

            return (
              <div
                key={ch.id}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-[240px] space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-mono-num">
                        時序 #{ch.timelineOrder} · 第 {String(ch.number).padStart(2, '0')} 章
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--text-primary)]">
                        [{chBranch?.code || 'MAIN'}]
                      </span>
                      <span aria-hidden="true">·</span>
                      <input
                        type="text"
                        value={ch.timelineLabel}
                        onChange={(e) =>
                          onUpdateChapter(ch.id, {
                            timelineLabel: e.target.value,
                          })
                        }
                        placeholder="時間標籤"
                        className="bg-transparent border-b border-transparent focus:border-[var(--border-hairline)] focus:outline-none w-32"
                      />
                      <span aria-hidden="true">·</span>
                      <span
                        className="inline-block h-2 w-2"
                        style={{
                          backgroundColor: povChar?.accentColor || '#64748B',
                        }}
                      />
                      <select
                        aria-label="指定本章視角"
                        value={ch.povCharacterId}
                        onChange={(e) =>
                          onUpdateChapter(ch.id, {
                            povCharacterId: e.target.value,
                          })
                        }
                        className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer"
                      >
                        {project.characters.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                            className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                          >
                            {c.name}視角
                          </option>
                        ))}
                        <option
                          value="omniscient"
                          className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        >
                          全知視角
                        </option>
                      </select>
                    </div>

                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) =>
                        onUpdateChapter(ch.id, { title: e.target.value })
                      }
                      className="w-full bg-transparent font-display text-xl font-semibold text-[var(--text-primary)] focus:outline-none"
                    />

                    <input
                      type="text"
                      value={ch.summary}
                      onChange={(e) =>
                        onUpdateChapter(ch.id, { summary: e.target.value })
                      }
                      placeholder="輸入本章場記大綱……"
                      className="w-full bg-transparent text-xs text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <select
                      aria-label="所屬平行分支"
                      value={ch.branchId}
                      onChange={(e) =>
                        onUpdateChapter(ch.id, { branchId: e.target.value })
                      }
                      className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                    >
                      {project.branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.code}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="章節狀態"
                      value={ch.status}
                      onChange={(e) =>
                        onUpdateChapter(ch.id, {
                          status: e.target.value as ChapterStatus,
                        })
                      }
                      className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                    >
                      {Object.entries(CHAPTER_STATUS_META).map(
                        ([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label}
                          </option>
                        )
                      )}
                    </select>

                    <div className="flex items-center gap-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-mono-num">
                      <span className="text-[var(--text-primary)]">
                        {words}
                      </span>
                      <span className="text-[var(--text-secondary)]">/</span>
                      <input
                        type="number"
                        min={300}
                        step={500}
                        aria-label="目標字數"
                        value={ch.targetWords}
                        onChange={(e) =>
                          onUpdateChapter(ch.id, {
                            targetWords: Math.max(
                              300,
                              Number(e.target.value) || 300
                            ),
                          })
                        }
                        className="w-14 bg-transparent text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none"
                      />
                      <span className="text-[var(--text-secondary)]">字</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => onMoveChapter(ch.id, 'up')}
                        title="上移章節順序"
                        className="p-1.5 rounded border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => onMoveChapter(ch.id, 'down')}
                        title="下移章節順序"
                        className="p-1.5 rounded border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      {project.chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onDeleteChapter(ch.id)}
                          title="刪除章節"
                          className="p-1.5 rounded border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenChapterInStudio(ch.id, ch.branchId || 'main')
                      }
                      className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
                    >
                      <Feather className="h-3.5 w-3.5" />
                      進入書寫
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor:
                          povChar?.accentColor || 'var(--accent-primary)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono-num text-[var(--text-secondary)] w-10 text-right">
                    {ratio}%
                  </span>
                </div>

                {(viewMode === 'beats' || ch.beats.length > 0) && (
                  <div className="pt-3 border-t border-[var(--border-hairline)] space-y-2">
                    <div className="text-xs text-[var(--text-secondary)]">
                      場記節拍（可為單一場景指定不同視角）
                    </div>
                    {ch.beats.map((beat) => (
                      <div
                        key={beat.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded bg-[var(--bg-canvas)] px-3 py-2 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleBeat(ch, beat.id)}
                          className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-[200px]"
                        >
                          {beat.completed ? (
                            <CheckSquare className="h-4 w-4 text-[var(--accent-primary)] shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                          )}
                          <span
                            className={
                              beat.completed
                                ? 'line-through text-[var(--text-secondary)]'
                                : 'text-[var(--text-primary)]'
                            }
                          >
                            {beat.title}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <select
                            aria-label="場次節拍視角"
                            value={beat.povCharacterId}
                            onChange={(e) =>
                              handleUpdateBeatPov(ch, beat.id, e.target.value)
                            }
                            className="bg-transparent text-[var(--text-secondary)] focus:outline-none cursor-pointer"
                          >
                            {project.characters.map((c) => (
                              <option
                                key={c.id}
                                value={c.id}
                                className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                              >
                                {c.name}視角
                              </option>
                            ))}
                            <option
                              value="omniscient"
                              className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                            >
                              全知視角
                            </option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleDeleteBeat(ch, beat.id)}
                            className="text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {viewMode === 'beats' && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newBeatInputs[ch.id] || ''}
                          onChange={(e) =>
                            setNewBeatInputs((prev) => ({
                              ...prev,
                              [ch.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddBeat(ch);
                            }
                          }}
                          placeholder="新增一場戲的節拍……"
                          className="flex-1 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddBeat(ch)}
                          className="rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
                        >
                          加入節拍
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
