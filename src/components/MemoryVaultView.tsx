import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Pin,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  MEMORY_CATEGORY_META,
  type MemoryCategory,
  type MemoryEntry,
  type StoryProject,
} from '../types/story';
import { getBranchLineageIds } from '../utils/storage';
import { apiUrl } from '../utils/api';

interface MemoryVaultViewProps {
  project: StoryProject;
  onAddMemory: (entry: MemoryEntry) => void;
  onUpdateMemory: (id: string, patch: Partial<MemoryEntry>) => void;
  onDeleteMemory: (id: string) => void;
  onAddMemoriesFromChapter: (
    entries: MemoryEntry[],
    chapterId: string,
    syncedAt: string
  ) => void;
}

export const MemoryVaultView: React.FC<MemoryVaultViewProps> = ({
  project,
  onAddMemory,
  onUpdateMemory,
  onDeleteMemory,
  onAddMemoriesFromChapter,
}) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MemoryCategory>(
    'all'
  );
  const [charFilter, setCharFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [onlyUnresolved, setOnlyUnresolved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState<MemoryCategory>('plot');
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newTimelineOrder, setNewTimelineOrder] = useState<number>(10);
  const [newTimelineLabel, setNewTimelineLabel] = useState('Day 1');
  const [newBranchId, setNewBranchId] = useState('main');
  const [newCharIds, setNewCharIds] = useState<string[]>([]);
  const [newPinned, setNewPinned] = useState(true);

  const [syncChapterId, setSyncChapterId] = useState(
    project.chapters[0]?.id || ''
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const filteredMemories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const lineage =
      branchFilter !== 'all'
        ? getBranchLineageIds(project.branches, branchFilter)
        : null;
    const selectedBranchObj =
      branchFilter !== 'all'
        ? project.branches.find((b) => b.id === branchFilter)
        : null;

    return project.memories
      .filter((m) => {
        if (categoryFilter !== 'all' && m.category !== categoryFilter) {
          return false;
        }
        if (charFilter !== 'all' && !m.relatedCharacterIds.includes(charFilter)) {
          return false;
        }
        if (lineage) {
          if (!lineage.has(m.branchId)) return false;
          if (
            selectedBranchObj &&
            selectedBranchObj.id !== 'main' &&
            m.branchId === 'main' &&
            selectedBranchObj.forkTimelineOrder > 0 &&
            m.timelineOrder > selectedBranchObj.forkTimelineOrder
          ) {
            return false;
          }
        }
        if (onlyUnresolved && m.resolved) {
          return false;
        }
        if (q) {
          const hitTitle = m.title.toLowerCase().includes(q);
          const hitDetail = m.detail.toLowerCase().includes(q);
          const hitTime = (m.timelineLabel || '').toLowerCase().includes(q);
          const hitSource = m.sourceChapterTitle.toLowerCase().includes(q);
          if (!hitTitle && !hitDetail && !hitTime && !hitSource) return false;
        }
        return true;
      })
      .sort((a, b) => a.timelineOrder - b.timelineOrder);
  }, [
    project.memories,
    project.branches,
    categoryFilter,
    charFilter,
    branchFilter,
    onlyUnresolved,
    searchQuery,
  ]);

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDetail.trim()) return;
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      detail: newDetail.trim(),
      timelineOrder: Number(newTimelineOrder) || 0,
      timelineLabel: newTimelineLabel.trim() || '既定時刻',
      branchId: newBranchId,
      relatedCharacterIds: newCharIds,
      sourceChapterId: 'manual',
      sourceChapterTitle: '作者手動登錄',
      pinned: newPinned,
      resolved: false,
      createdAt: new Date().toISOString(),
    };
    onAddMemory(entry);
    setNewTitle('');
    setNewDetail('');
    setNewCharIds([]);
    setShowAddForm(false);
  };

  const handleBatchExtract = async () => {
    const ch = project.chapters.find((c) => c.id === syncChapterId);
    if (!ch || ch.content.trim().length < 30) {
      setSyncMessage('選取的章節正文字數過少，無法萃取記憶。');
      return;
    }
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch(apiUrl('/api/story/extract-memory'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: ch.title,
          chapterNumber: ch.number,
          chapterContent: ch.content,
          timelineOrder: ch.timelineOrder,
          timelineLabel: ch.timelineLabel,
          branchId: ch.branchId,
          branches: project.branches,
          characters: project.characters,
          existingMemories: project.memories,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '擷取記憶失敗');

      const now = new Date().toISOString();
      const validCategories: MemoryCategory[] = [
        'plot',
        'character',
        'intimacy',
        'foreshadowing',
        'sensory',
      ];
      const formatted: MemoryEntry[] = (data.newMemories || []).map(
        (
          item: {
            category?: string;
            title?: string;
            detail?: string;
            timeMoment?: string;
            relatedCharacterIds?: string[];
            shouldPin?: boolean;
          },
          idx: number
        ) => ({
          id: `mem_${Date.now()}_${idx}`,
          category: validCategories.includes(item.category as MemoryCategory)
            ? (item.category as MemoryCategory)
            : 'plot',
          title: item.title || '未命名記憶',
          detail: item.detail || '',
          timelineOrder: ch.timelineOrder + idx * 0.01,
          timelineLabel: item.timeMoment || ch.timelineLabel || `第 ${ch.number} 章`,
          branchId: ch.branchId || 'main',
          relatedCharacterIds: Array.isArray(item.relatedCharacterIds)
            ? item.relatedCharacterIds
            : [],
          sourceChapterId: ch.id,
          sourceChapterTitle: `第 ${ch.number} 章：${ch.title}`,
          pinned: Boolean(item.shouldPin),
          resolved: false,
          createdAt: now,
        })
      );

      onAddMemoriesFromChapter(formatted, ch.id, now);
      setSyncMessage(
        formatted.length > 0
          ? `已依時序從《第 ${ch.number} 章》萃取 ${formatted.length} 條新記憶。`
          : `《第 ${ch.number} 章》沒有需要補充的新記憶條目。`
      );
    } catch (err) {
      setSyncMessage(
        err instanceof Error ? err.message : '擷取記憶時發生錯誤'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-8 space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-hairline)] pb-6">
        <div>
          <div className="text-xs text-[var(--text-secondary)] font-mono-num">
            時序性記憶鏈 · 共 {project.memories.length} 條記錄 · 依時間先後與分支自動隔離
          </div>
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mt-1">
            角色時序記憶庫與伏筆帳本
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-1">
            <select
              aria-label="選擇要擷取記憶的章節"
              value={syncChapterId}
              onChange={(e) => setSyncChapterId(e.target.value)}
              className="bg-transparent px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {project.chapters.map((ch) => (
                <option
                  key={ch.id}
                  value={ch.id}
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                >
                  #{ch.timelineOrder} 第 {ch.number} 章：{ch.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isSyncing || project.chapters.length === 0}
              onClick={handleBatchExtract}
              className="inline-flex items-center gap-1.5 rounded bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--accent-primary)] hover:text-stone-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isSyncing ? '分析中……' : 'AI 萃取時序記憶'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs sm:text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            手動登錄時序記憶
          </button>
        </div>
      </div>

      {syncMessage && (
        <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md px-4 py-2.5">
          {syncMessage}
        </p>
      )}

      {/* Manual Add Form */}
      {showAddForm && (
        <form
          onSubmit={handleManualCreate}
          className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                時序位置序號（數字越小越早發生）
              </label>
              <input
                type="number"
                value={newTimelineOrder}
                onChange={(e) => setNewTimelineOrder(Number(e.target.value))}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm font-mono-num text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                時間刻點標籤
              </label>
              <input
                type="text"
                value={newTimelineLabel}
                onChange={(e) => setNewTimelineLabel(e.target.value)}
                placeholder="例如：Day 2 · 02:15"
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                所屬分支路線
              </label>
              <select
                value={newBranchId}
                onChange={(e) => setNewBranchId(e.target.value)}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {project.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.code}] {b.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                記憶分類
              </label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as MemoryCategory)
                }
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
              >
                {Object.entries(MEMORY_CATEGORY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              記憶標題
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：許知南撿到破損羅盤並收進口袋"
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              具體事實與角色認知變化
            </label>
            <textarea
              rows={2}
              required
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              placeholder="寫明在該時間點發生了什麼、角色當下知曉與未知的界線……"
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">
                關聯主角：
              </span>
              {project.characters.map((c) => {
                const selected = newCharIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setNewCharIds((prev) =>
                        selected
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id]
                      )
                    }
                    className={`px-2.5 py-1 text-xs rounded border cursor-pointer transition-colors ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-stone-100'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={(e) => setNewPinned(e.target.checked)}
                />
                釘選常駐於對應時間線
              </label>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-md bg-[var(--accent-primary)] px-4 py-1.5 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                儲存記憶
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter & View Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'timeline'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              時序軸視圖
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              卡片檢索視圖
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-hairline)]">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              全部分類
            </button>
            {Object.entries(MEMORY_CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key as MemoryCategory)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  categoryFilter === key
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="依結局分支線篩選"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">所有平行分支</option>
            {project.branches.map((b) => (
              <option key={b.id} value={b.id}>
                沿線：[{b.code}] {b.title}
              </option>
            ))}
          </select>

          <select
            aria-label="依主角時間線篩選"
            value={charFilter}
            onChange={(e) => setCharFilter(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">所有主角記憶</option>
            {project.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} 的時序線
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setOnlyUnresolved((v) => !v)}
            className={`px-3 py-1.5 text-xs rounded-md border cursor-pointer transition-colors ${
              onlyUnresolved
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-elevated)]'
                : 'border-[var(--border-hairline)] text-[var(--text-secondary)] bg-[var(--bg-surface)]'
            }`}
          >
            只看未回收伏筆
          </button>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋記憶或時間……"
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] w-44"
            />
          </div>
        </div>
      </div>

      {/* Memories List / Timeline */}
      {filteredMemories.length === 0 ? (
        <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] py-16 text-center">
          <p className="font-display text-xl text-[var(--text-primary)]">
            沒有符合條件的時序記憶
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            可切換上方主角、分支篩選，或從章節自動萃取記憶。
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-3">
          {filteredMemories.map((mem) => {
            const branchObj = project.branches.find(
              (b) => b.id === mem.branchId
            );
            const relatedNames = mem.relatedCharacterIds
              .map((id) => project.characters.find((c) => c.id === id)?.name)
              .filter(Boolean);

            return (
              <div
                key={mem.id}
                className={`rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-start justify-between ${
                  mem.resolved ? 'opacity-65' : ''
                }`}
              >
                {/* Chronological Left Column */}
                <div className="md:w-56 shrink-0 space-y-1.5 border-b md:border-b-0 md:border-r border-[var(--border-hairline)] pb-3 md:pb-0 md:pr-4">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>時序 #</span>
                    <input
                      type="number"
                      aria-label="調整記憶時序序號"
                      value={mem.timelineOrder}
                      onChange={(e) =>
                        onUpdateMemory(mem.id, {
                          timelineOrder: Number(e.target.value) || 0,
                        })
                      }
                      className="w-14 bg-transparent border-b border-[var(--border-hairline)] font-mono-num text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    aria-label="調整時間標籤"
                    value={mem.timelineLabel}
                    onChange={(e) =>
                      onUpdateMemory(mem.id, { timelineLabel: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[var(--border-hairline)]"
                  />
                  <div className="text-xs text-[var(--text-secondary)]">
                    <select
                      aria-label="所屬分支"
                      value={mem.branchId}
                      onChange={(e) =>
                        onUpdateMemory(mem.id, { branchId: e.target.value })
                      }
                      className="bg-transparent focus:outline-none cursor-pointer"
                    >
                      {project.branches.map((b) => (
                        <option
                          key={b.id}
                          value={b.id}
                          className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        >
                          [{b.code}] {b.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Memory Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                    <div>
                      <span>{MEMORY_CATEGORY_META[mem.category].label}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{branchObj?.code || 'MAIN'}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{mem.sourceChapterTitle}</span>
                      {relatedNames.length > 0 && (
                        <>
                          <span aria-hidden="true"> · </span>
                          <span className="text-[var(--text-primary)]">
                            {relatedNames.join('、')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMemory(mem.id, { pinned: !mem.pinned })
                        }
                        title={mem.pinned ? '取消釘選' : '釘選常駐'}
                        className={`p-1 rounded cursor-pointer ${
                          mem.pinned
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMemory(mem.id, { resolved: !mem.resolved })
                        }
                        title={mem.resolved ? '標記為未回收' : '標記為已回收'}
                        className={`p-1 rounded cursor-pointer ${
                          mem.resolved
                            ? 'text-emerald-500'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMemory(mem.id)}
                        title="刪除記憶"
                        className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={mem.title}
                    onChange={(e) =>
                      onUpdateMemory(mem.id, { title: e.target.value })
                    }
                    className="w-full bg-transparent text-base font-semibold text-[var(--text-primary)] focus:outline-none"
                  />
                  <textarea
                    rows={2}
                    value={mem.detail}
                    onChange={(e) =>
                      onUpdateMemory(mem.id, { detail: e.target.value })
                    }
                    className="w-full bg-transparent text-xs leading-relaxed text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none resize-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((mem) => {
            const relatedNames = mem.relatedCharacterIds
              .map((id) => project.characters.find((c) => c.id === id)?.name)
              .filter(Boolean);
            const branchObj = project.branches.find(
              (b) => b.id === mem.branchId
            );

            return (
              <article
                key={mem.id}
                className={`rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 flex flex-col justify-between gap-4 ${
                  mem.resolved ? 'opacity-65' : ''
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                    <div className="truncate">
                      <span className="font-mono-num">
                        #{Math.round(mem.timelineOrder)}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{mem.timelineLabel}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{branchObj?.code || 'MAIN'}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMemory(mem.id, { pinned: !mem.pinned })
                        }
                        className={`p-1 rounded cursor-pointer ${
                          mem.pinned
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateMemory(mem.id, { resolved: !mem.resolved })
                        }
                        className={`p-1 rounded cursor-pointer ${
                          mem.resolved
                            ? 'text-emerald-500'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMemory(mem.id)}
                        className="p-1 rounded text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={mem.title}
                    onChange={(e) =>
                      onUpdateMemory(mem.id, { title: e.target.value })
                    }
                    className="w-full bg-transparent text-base font-semibold text-[var(--text-primary)] focus:outline-none"
                  />

                  <textarea
                    rows={3}
                    value={mem.detail}
                    onChange={(e) =>
                      onUpdateMemory(mem.id, { detail: e.target.value })
                    }
                    className="w-full bg-transparent text-xs leading-relaxed text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="truncate">
                    {relatedNames.length > 0
                      ? `關聯：${relatedNames.join('、')}`
                      : MEMORY_CATEGORY_META[mem.category].label}
                  </span>
                  <span className="shrink-0">
                    {mem.resolved ? '已回收' : mem.pinned ? '常駐' : '時序'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
