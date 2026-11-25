import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Feather,
  Gamepad2,
  GitBranch,
  Maximize2,
  Minimize2,
  Moon,
  Pin,
  Plus,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Users,
  Wand2,
} from 'lucide-react';
import {
  CHAPTER_STATUS_META,
  MEMORY_CATEGORY_META,
  type Chapter,
  type ChapterStatus,
  type ConsistencyReport,
  type DungeonScoreState,
  type MemoryCategory,
  type MemoryEntry,
  type Protagonist,
  type RewriteMode,
  type StoryProject,
  type SupportingCharacter,
} from '../types/story';
import {
  countLiteraryWords,
  getChaptersForBranchRoute,
  getChronologicalMemoriesForContext,
} from '../utils/storage';
import { ProtagonistQuickRefTable } from './ProtagonistQuickRefTable';

interface WritingStudioProps {
  project: StoryProject;
  activeBranchId: string;
  activeChapterId: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectBranch: (branchId: string) => void;
  onSelectChapter: (chapterId: string) => void;
  onAddChapter: (branchId?: string) => void;
  onUpdateChapter: (chapterId: string, patch: Partial<Chapter>) => void;
  onUpdateProtagonist: (id: string, patch: Partial<Protagonist>) => void;
  onUpdateSupportingCharacter: (
    id: string,
    patch: Partial<SupportingCharacter>
  ) => void;
  onAddMemories: (
    memories: MemoryEntry[],
    chapterId: string,
    syncedAt: string
  ) => void;
  onToggleMemoryPin: (memoryId: string) => void;
  onGoToCast: () => void;
  onGoToProgress: () => void;
}

const MOOD_PRESETS = [
  '嚴守既定設定與邏輯推演，不憑空加設定，按線索推進當前謎題',
  '寫出18禁成年官能與肌膚喘息張力，結合角色關係拉扯，拒絕白開水',
  '在副本計分與倒數壓力下互動，注意體能與環境限制',
  '推進時間線並留下具時序連貫性的物件或伏筆線索',
];

export const WritingStudio: React.FC<WritingStudioProps> = ({
  project,
  activeBranchId,
  activeChapterId,
  theme,
  onToggleTheme,
  onSelectBranch,
  onSelectChapter,
  onAddChapter,
  onUpdateChapter,
  onUpdateProtagonist,
  onUpdateSupportingCharacter,
  onAddMemories,
  onToggleMemoryPin,
  onGoToCast,
  onGoToProgress,
}) => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightTab, setRightTab] = useState<'memory' | 'quick_ref'>('memory');
  const [quickRefCharId, setQuickRefCharId] = useState<string>(
    () => project.characters[0]?.id || ''
  );
  const [focusMode, setFocusMode] = useState(false);

  const [direction, setDirection] = useState('');
  const [lengthHint, setLengthHint] = useState(
    '約 700 至 1000 字，兼顧質感細節、邏輯推演與情緒張力'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamDraft, setStreamDraft] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);

  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);
  const [consistencyReport, setConsistencyReport] =
    useState<ConsistencyReport | null>(null);

  const [scoreReasonInput, setScoreReasonInput] = useState('');
  const [scoreDeltaInput, setScoreDeltaInput] = useState<number>(40);

  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewritePreview, setRewritePreview] = useState<{
    original: string;
    rewritten: string;
    start: number;
    end: number;
    mode: RewriteMode;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const routeChapters = useMemo(
    () => getChaptersForBranchRoute(project, activeBranchId),
    [project, activeBranchId]
  );

  const activeChapter = useMemo(
    () =>
      routeChapters.find((c) => c.id === activeChapterId) ||
      project.chapters.find((c) => c.id === activeChapterId) ||
      routeChapters[0] ||
      project.chapters[0],
    [routeChapters, project.chapters, activeChapterId]
  );

  const activeBranch = useMemo(
    () =>
      project.branches.find((b) => b.id === activeBranchId) ||
      project.branches[0],
    [project.branches, activeBranchId]
  );

  const previousChapter = useMemo(() => {
    if (!activeChapter) return null;
    const idx = routeChapters.findIndex((c) => c.id === activeChapter.id);
    return idx > 0 ? routeChapters[idx - 1] : null;
  }, [routeChapters, activeChapter]);

  const activePovCharacter = useMemo(() => {
    if (!activeChapter || activeChapter.povCharacterId === 'omniscient') {
      return null;
    }
    return (
      project.characters.find((c) => c.id === activeChapter.povCharacterId) ||
      null
    );
  }, [project.characters, activeChapter]);

  const chronologicalMemories = useMemo(() => {
    if (!activeChapter) return [];
    return getChronologicalMemoriesForContext(
      project,
      activeChapter.branchId || activeBranchId,
      activeChapter.timelineOrder
    );
  }, [project, activeChapter, activeBranchId]);

  const wordCount = useMemo(
    () => countLiteraryWords(activeChapter?.content || ''),
    [activeChapter?.content]
  );

  useEffect(() => {
    setSelectionRange(null);
    setRewritePreview(null);
    setAiError(null);
    setExtractNotice(null);
    setConsistencyReport(null);
  }, [activeChapter?.id]);

  if (!activeChapter) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-display text-2xl text-[var(--text-primary)]">
          目前分支尚未建立任何章節
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          建立第一章節後，即可指定時序座標、敘事視角並開始撰寫。
        </p>
        <button
          type="button"
          onClick={() => onAddChapter(activeBranchId)}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          於當前分支新增章節
        </button>
      </div>
    );
  }

  const chapterScore: DungeonScoreState = activeChapter.dungeonScore || {
    currentScore: 0,
    targetClearScore: 500,
    sanOrHp: 'SAN 100 / 狀態正常',
    scoreLog: [],
  };

  const updateScoreState = (patch: Partial<DungeonScoreState>) => {
    onUpdateChapter(activeChapter.id, {
      dungeonScore: {
        ...chapterScore,
        ...patch,
      },
    });
  };

  const handleAddScoreLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoreReasonInput.trim()) return;
    const delta = Number(scoreDeltaInput) || 0;
    const nextLog = [
      ...chapterScore.scoreLog,
      {
        id: `log_${Date.now()}`,
        reason: scoreReasonInput.trim(),
        delta,
        timelineLabel: activeChapter.timelineLabel || `第${activeChapter.number}章`,
      },
    ];
    updateScoreState({
      currentScore: chapterScore.currentScore + delta,
      scoreLog: nextLog,
    });
    setScoreReasonInput('');
  };

  const handleDeleteScoreLog = (logId: string, delta: number) => {
    updateScoreState({
      currentScore: chapterScore.currentScore - delta,
      scoreLog: chapterScore.scoreLog.filter((l) => l.id !== logId),
    });
  };

  const handleTextSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (end - start >= 12) {
      setSelectionRange({
        start,
        end,
        text: activeChapter.content.slice(start, end),
      });
    } else {
      setSelectionRange(null);
    }
  };

  const handleExtractMemory = async (contentOverride?: string) => {
    const textToAnalyze = contentOverride ?? activeChapter.content;
    if (!textToAnalyze || textToAnalyze.trim().length < 30) {
      setExtractNotice('本章正文字數尚少，請先寫入至少幾段情節後再擷取記憶。');
      return;
    }

    setIsExtracting(true);
    setExtractNotice(null);
    try {
      const res = await fetch('/api/story/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: activeChapter.title,
          chapterNumber: activeChapter.number,
          chapterContent: textToAnalyze,
          timelineOrder: activeChapter.timelineOrder,
          timelineLabel: activeChapter.timelineLabel,
          branchId: activeChapter.branchId,
          branches: project.branches,
          characters: project.characters,
          existingMemories: project.memories,
          isGameMode: project.world.mode === 'game_dungeon',
          currentScoreLog: chapterScore.scoreLog,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '擷取記憶失敗');
      }

      const now = new Date().toISOString();
      const rawMemories = Array.isArray(data.newMemories)
        ? data.newMemories
        : [];
      const validCategories: MemoryCategory[] = [
        'plot',
        'character',
        'intimacy',
        'foreshadowing',
        'sensory',
      ];

      const formatted: MemoryEntry[] = rawMemories.map(
        (
          item: {
            category?: string;
            title?: string;
            detail?: string;
            timeMoment?: string;
            relatedCharacterIds?: string[];
            shouldPin?: boolean;
          },
          index: number
        ) => ({
          id: `mem_${Date.now()}_${index}`,
          category: validCategories.includes(item.category as MemoryCategory)
            ? (item.category as MemoryCategory)
            : 'plot',
          title: (item.title || '未命名記憶').slice(0, 32),
          detail: item.detail || '',
          timelineOrder: activeChapter.timelineOrder + index * 0.01,
          timelineLabel:
            item.timeMoment ||
            activeChapter.timelineLabel ||
            `第 ${activeChapter.number} 章`,
          branchId: activeChapter.branchId || 'main',
          relatedCharacterIds: Array.isArray(item.relatedCharacterIds)
            ? item.relatedCharacterIds
            : [],
          sourceChapterId: activeChapter.id,
          sourceChapterTitle: `第 ${activeChapter.number} 章：${activeChapter.title}`,
          pinned: Boolean(item.shouldPin),
          resolved: false,
          createdAt: now,
        })
      );

      // Automatically sync new dungeon score changes if any
      const scoreChanges = Array.isArray(data.scoreChanges)
        ? data.scoreChanges
        : [];
      if (project.world.mode === 'game_dungeon' && scoreChanges.length > 0) {
        let deltaSum = 0;
        const addedLogs = scoreChanges.map(
          (
            sc: { reason?: string; delta?: number; timeMoment?: string },
            i: number
          ) => {
            const d = Number(sc.delta) || 0;
            deltaSum += d;
            return {
              id: `log_${Date.now()}_${i}`,
              reason: sc.reason || '副本計分事件',
              delta: d,
              timelineLabel:
                sc.timeMoment || activeChapter.timelineLabel || '本章',
            };
          }
        );
        updateScoreState({
          currentScore: chapterScore.currentScore + deltaSum,
          scoreLog: [...chapterScore.scoreLog, ...addedLogs],
        });
      }

      if (data.chapterSummary && !activeChapter.summary.trim()) {
        onUpdateChapter(activeChapter.id, { summary: data.chapterSummary });
      }
      onAddMemories(formatted, activeChapter.id, now);
      setExtractNotice(
        `已依時序萃取 ${formatted.length} 條記憶${
          scoreChanges.length > 0
            ? `，並自動登錄 ${scoreChanges.length} 筆副本積分異動`
            : ''
        }。`
      );
    } catch (err) {
      setExtractNotice(
        err instanceof Error ? err.message : '擷取記憶時發生錯誤'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCheckConsistency = async () => {
    if (!activeChapter.content || activeChapter.content.trim().length < 20) {
      setAiError('章節內文字數過少，請先撰寫一段內容再執行人設與設定鎖定審查。');
      return;
    }
    setIsCheckingConsistency(true);
    setAiError(null);
    setConsistencyReport(null);
    try {
      const res = await fetch('/api/story/check-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterTitle: activeChapter.title,
          chapterNumber: activeChapter.number,
          chapterContent: activeChapter.content,
          timelineOrder: activeChapter.timelineOrder,
          timelineLabel: activeChapter.timelineLabel,
          branchId: activeChapter.branchId,
          branches: project.branches,
          characters: project.characters,
          supportingCharacters: project.supportingCharacters,
          relationshipEdges: project.relationshipEdges,
          memories: project.memories,
          world: project.world,
          dungeonId: activeChapter.dungeonId,
          dungeonScore: chapterScore,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '檢查相致性失敗');
      setConsistencyReport(data as ConsistencyReport);
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : '檢查相致性時發生錯誤'
      );
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const handleGenerateStream = async () => {
    if (isGenerating) {
      abortRef.current?.abort();
      setIsGenerating(false);
      return;
    }

    setAiError(null);
    setStreamDraft('');
    setIsGenerating(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';
    try {
      const res = await fetch('/api/story/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          projectTitle: project.title,
          world: project.world,
          contentSettings: project.contentSettings,
          characters: project.characters,
          supportingCharacters: project.supportingCharacters,
          relationshipEdges: project.relationshipEdges,
          memories: project.memories,
          branches: project.branches,
          activeBranchId: activeChapter.branchId || activeBranchId,
          chapterTitle: activeChapter.title,
          chapterNumber: activeChapter.number,
          timelineOrder: activeChapter.timelineOrder,
          timelineLabel: activeChapter.timelineLabel,
          dungeonId: activeChapter.dungeonId,
          dungeonScore: chapterScore,
          chapterSummary: activeChapter.summary,
          povCharacterId: activeChapter.povCharacterId,
          currentContent: activeChapter.content,
          previousChapterSummary: previousChapter?.summary || '',
          direction,
          targetLengthHint: lengthHint,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('伺服器連線失敗，無法啟動寫作引擎。');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith('data:')) continue;
          const payload = JSON.parse(line.slice(5).trim());
          if (payload.type === 'chunk' && payload.text) {
            accumulated += payload.text;
            setStreamDraft(accumulated);
          } else if (payload.type === 'error') {
            setAiError(payload.message || '生成過程發生中斷');
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setAiError(
          err instanceof Error ? err.message : '無法完成小說續寫請求'
        );
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleAcceptStreamDraft = async () => {
    if (!streamDraft.trim()) return;
    const base = activeChapter.content.trimEnd();
    const merged = base ? `${base}\n\n${streamDraft.trim()}` : streamDraft.trim();
    onUpdateChapter(activeChapter.id, { content: merged });
    setStreamDraft('');
    setDirection('');

    if (project.autoExtractOnGenerate) {
      await handleExtractMemory(merged);
    }
  };

  const handleRewriteSelection = async (mode: RewriteMode) => {
    if (!selectionRange) return;
    setIsRewriting(true);
    setAiError(null);
    try {
      const contextStart = Math.max(0, selectionRange.start - 400);
      const contextEnd = Math.min(
        activeChapter.content.length,
        selectionRange.end + 400
      );
      const surroundingContext = activeChapter.content.slice(
        contextStart,
        contextEnd
      );

      const res = await fetch('/api/story/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle: project.title,
          world: project.world,
          contentSettings: project.contentSettings,
          characters: project.characters,
          supportingCharacters: project.supportingCharacters,
          relationshipEdges: project.relationshipEdges,
          memories: project.memories,
          branches: project.branches,
          activeBranchId: activeChapter.branchId,
          timelineOrder: activeChapter.timelineOrder,
          timelineLabel: activeChapter.timelineLabel,
          dungeonId: activeChapter.dungeonId,
          dungeonScore: chapterScore,
          povCharacterId: activeChapter.povCharacterId,
          selectedText: selectionRange.text,
          surroundingContext,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '潤飾段落失敗');
      }
      setRewritePreview({
        original: selectionRange.text,
        rewritten: data.rewritten,
        start: selectionRange.start,
        end: selectionRange.end,
        mode,
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '潤飾段落時發生錯誤');
    } finally {
      setIsRewriting(false);
    }
  };

  const applyRewritePreview = () => {
    if (!rewritePreview) return;
    const nextContent =
      activeChapter.content.slice(0, rewritePreview.start) +
      rewritePreview.rewritten +
      activeChapter.content.slice(rewritePreview.end);
    onUpdateChapter(activeChapter.id, { content: nextContent });
    setRewritePreview(null);
    setSelectionRange(null);
  };

  const showLeft = !focusMode && leftOpen;
  const showRight = !focusMode && rightOpen;
  const isGameMode = project.world.mode === 'game_dungeon';

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row min-h-[calc(100vh-57px)]">
      {/* Left Rail: Branch Switcher & Chronological Route Chapters */}
      {showLeft && (
        <aside className="w-full lg:w-76 shrink-0 border-b lg:border-b-0 lg:border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col">
          <div className="px-4 py-3.5 border-b border-[var(--border-hairline)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {project.genreNote}
                </p>
                <h1 className="font-display text-lg font-semibold text-[var(--text-primary)] truncate">
                  {project.title}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => onAddChapter(activeBranchId)}
                title="於目前分支新增章節"
                className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  目前平行世界 / 結局路線
                </span>
                <button
                  type="button"
                  onClick={onGoToProgress}
                  className="underline underline-offset-2 hover:text-[var(--text-primary)] cursor-pointer"
                >
                  管理分支 ({project.branches.length})
                </button>
              </div>
              <select
                aria-label="切換平行結局分支"
                value={activeBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                {project.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    [{b.code}] {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-hairline)]">
            {routeChapters.map((ch) => {
              const isCurrent = ch.id === activeChapter.id;
              const chPov =
                ch.povCharacterId === 'omniscient'
                  ? null
                  : project.characters.find((c) => c.id === ch.povCharacterId);
              const chWords = countLiteraryWords(ch.content);
              const chBranch = project.branches.find(
                (b) => b.id === ch.branchId
              );

              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[var(--bg-elevated)]'
                      : 'hover:bg-[var(--bg-elevated)]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="font-mono-num">
                      #{ch.timelineOrder} · 第 {String(ch.number).padStart(2, '0')} 章
                    </span>
                    <span className="font-mono-num">{chWords} 字</span>
                  </div>
                  <p
                    className={`mt-1 text-sm font-medium truncate ${
                      isCurrent
                        ? 'text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {ch.title || '未命名章節'}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <span
                      className="inline-block h-2 w-2 shrink-0"
                      style={{
                        backgroundColor: chPov?.accentColor || '#64748B',
                      }}
                    />
                    <span className="truncate">
                      {chPov ? `${chPov.name}` : '全知'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {chBranch?.code || 'MAIN'}
                    </span>
                    {isGameMode && ch.dungeonScore && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num shrink-0">
                          {ch.dungeonScore.currentScore}分
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Center Manuscript Desk */}
      <main className="flex-1 flex flex-col min-w-0 bg-[var(--bg-canvas)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {!focusMode && (
              <button
                type="button"
                onClick={() => setLeftOpen((v) => !v)}
                className="p-1.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer"
                title={leftOpen ? '收合章節欄' : '展開章節欄'}
              >
                {leftOpen ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <Eye className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
              <label htmlFor="pov-select" className="sr-only">
                切換敘事視角
              </label>
              <select
                id="pov-select"
                value={activeChapter.povCharacterId}
                onChange={(e) =>
                  onUpdateChapter(activeChapter.id, {
                    povCharacterId: e.target.value,
                  })
                }
                className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md px-2.5 py-1.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                {project.characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    視角：{char.name}（{char.alias || char.role}）
                  </option>
                ))}
                <option value="omniscient">視角：全知俯瞰敘事</option>
              </select>
            </div>

            {isGameMode && (
              <select
                aria-label="章節所屬副本"
                value={activeChapter.dungeonId || ''}
                onChange={(e) =>
                  onUpdateChapter(activeChapter.id, {
                    dungeonId: e.target.value || undefined,
                  })
                }
                className="bg-[var(--bg-surface)] border border-[var(--border-hairline)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="">現實 / 中繼站區域</option>
                {project.world.gameSystem.dungeons.map((d) => (
                  <option key={d.id} value={d.id}>
                    副本：{d.code} {d.name}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="章節進度狀態"
              value={activeChapter.status}
              onChange={(e) =>
                onUpdateChapter(activeChapter.id, {
                  status: e.target.value as ChapterStatus,
                })
              }
              className="hidden sm:block bg-transparent border border-[var(--border-hairline)] rounded-md px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {Object.entries(CHAPTER_STATUS_META).map(([key, meta]) => (
                <option
                  key={key}
                  value={key}
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                >
                  進度：{meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isGameMode && (
              <span className="text-xs font-mono-num text-[var(--text-primary)] whitespace-nowrap">
                積分 {chapterScore.currentScore}/{chapterScore.targetClearScore}
              </span>
            )}
            <span className="text-xs font-mono-num text-[var(--text-secondary)] whitespace-nowrap">
              {wordCount} / {activeChapter.targetWords} 字
            </span>

            <button
              type="button"
              onClick={onToggleTheme}
              title={
                theme === 'dark' ? '切換至暖紙白晝模式' : '切換至墨夜暗房模式'
              }
              className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setFocusMode((v) => !v)}
              title={focusMode ? '退出專注書寫' : '進入純淨專注模式'}
              className="p-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
            >
              {focusMode ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            {!focusMode && (
              <button
                type="button"
                onClick={() => setRightOpen((v) => !v)}
                className="px-2.5 py-1.5 rounded-md border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer whitespace-nowrap"
              >
                {rightOpen ? '隱藏側欄' : '展開記分與記憶'}
              </button>
            )}
          </div>
        </div>

        {/* Manuscript Paper Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-14 py-8">
          <div className="mx-auto max-w-[740px]">
            <div className="mb-6 pb-5 border-b border-[var(--border-hairline)] space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span className="font-mono-num text-[var(--text-primary)]">
                  [{activeBranch?.code || 'MAIN'}]
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  時序 #
                  <input
                    type="number"
                    aria-label="章節時序序號"
                    value={activeChapter.timelineOrder}
                    onChange={(e) =>
                      onUpdateChapter(activeChapter.id, {
                        timelineOrder: Number(e.target.value) || 0,
                      })
                    }
                    className="w-12 bg-transparent border-b border-[var(--border-hairline)] font-mono-num text-[var(--text-primary)] focus:outline-none text-center"
                  />
                </span>
                <input
                  type="text"
                  aria-label="時間點標籤"
                  value={activeChapter.timelineLabel}
                  onChange={(e) =>
                    onUpdateChapter(activeChapter.id, {
                      timelineLabel: e.target.value,
                    })
                  }
                  placeholder="時間標籤"
                  className="bg-transparent border-b border-transparent focus:border-[var(--border-hairline)] focus:outline-none text-[var(--text-secondary)] w-40"
                />
                <span aria-hidden="true">·</span>
                <select
                  aria-label="本章所屬分支"
                  value={activeChapter.branchId}
                  onChange={(e) =>
                    onUpdateChapter(activeChapter.id, {
                      branchId: e.target.value,
                    })
                  }
                  className="bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  {project.branches.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      className="bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    >
                      歸屬：{b.code} {b.title}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={activeChapter.title}
                onChange={(e) =>
                  onUpdateChapter(activeChapter.id, { title: e.target.value })
                }
                placeholder="輸入章節標題……"
                className="w-full bg-transparent font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none"
              />

              <input
                type="text"
                value={activeChapter.summary}
                onChange={(e) =>
                  onUpdateChapter(activeChapter.id, { summary: e.target.value })
                }
                placeholder="本章場記摘要（供上下文連貫與AI記憶對照）……"
                className="w-full bg-transparent text-sm text-[var(--text-secondary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none"
              />
            </div>

            {selectionRange && !rewritePreview && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5">
                <span className="text-xs text-[var(--text-secondary)]">
                  已選取 {countLiteraryWords(selectionRange.text)} 字段落：
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleRewriteSelection('sensual')}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-stone-100 text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    18禁官能深化
                  </button>
                  <button
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleRewriteSelection('darkness')}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-stone-100 text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    強化壓迫與張力
                  </button>
                  <button
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleRewriteSelection('polish')}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-stone-100 text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    去白開水・邏輯潤飾
                  </button>
                  <button
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleRewriteSelection('pov_shift')}
                    className="px-2.5 py-1 text-xs rounded bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-stone-100 text-[var(--text-primary)] border border-[var(--border-hairline)] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    切換視角重寫
                  </button>
                </div>
              </div>
            )}

            {rewritePreview && (
              <div className="mb-6 rounded-lg border border-[var(--accent-primary)]/40 bg-[var(--bg-surface)] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="font-medium text-[var(--text-primary)]">
                    段落精修預覽
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRewritePreview(null)}
                      className="px-2.5 py-1 rounded border border-[var(--border-hairline)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                    >
                      捨棄
                    </button>
                    <button
                      type="button"
                      onClick={applyRewritePreview}
                      className="px-3 py-1 rounded bg-[var(--accent-primary)] text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
                    >
                      套用替換原段落
                    </button>
                  </div>
                </div>
                <p className="font-manuscript text-base leading-[1.9] text-[var(--text-primary)] whitespace-pre-wrap">
                  {rewritePreview.rewritten}
                </p>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={activeChapter.content}
              onChange={(e) =>
                onUpdateChapter(activeChapter.id, { content: e.target.value })
              }
              onMouseUp={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="在此開始書寫，或在下方輸入場記指令讓 AI 嚴守設定、邏輯、關係網與副本分數續寫……"
              rows={18}
              className="w-full min-h-[400px] resize-y bg-transparent font-manuscript text-[17px] leading-[1.9] tracking-[0.01em] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/45 focus:outline-none"
            />

            {(isGenerating || streamDraft) && (
              <div className="mt-6 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5">
                <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--border-hairline)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Feather className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    <span>
                      {isGenerating ? '正在書寫新段落……' : '新段落草稿已就緒'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {activePovCharacter
                        ? `${activePovCharacter.name}視角`
                        : '全知視角'}
                    </span>
                  </div>
                  {!isGenerating && streamDraft && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStreamDraft('')}
                        className="px-3 py-1.5 text-xs rounded border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        捨棄重寫
                      </button>
                      <button
                        type="button"
                        onClick={handleAcceptStreamDraft}
                        className="px-3.5 py-1.5 text-xs font-medium rounded bg-[var(--accent-primary)] text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
                      >
                        收入手稿正文
                      </button>
                    </div>
                  )}
                </div>
                <div className="font-manuscript text-[17px] leading-[1.9] text-[var(--text-primary)] whitespace-pre-wrap">
                  {streamDraft || '正在核對角色關係網、副本積分與設定鎖定……'}
                </div>
              </div>
            )}

            {aiError && (
              <div className="mt-4 rounded-md border border-rose-800/40 bg-rose-950/20 px-4 py-3 text-xs text-rose-300">
                {aiError}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Co-Writing Command Bar */}
        <div className="border-t border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 sm:px-6 py-4">
          <div className="mx-auto max-w-[740px] space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {MOOD_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDirection(preset)}
                  className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-hairline)] bg-[var(--bg-canvas)] rounded px-2.5 py-1 transition-colors cursor-pointer truncate max-w-[260px]"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateStream();
                  }
                }}
                placeholder="輸入下一幕場記指令（AI 嚴禁擅自加設定，並即時對齊當前副本分數）……"
                className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
              <select
                aria-label="生成篇幅"
                value={lengthHint}
                onChange={(e) => setLengthHint(e.target.value)}
                className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-secondary)] focus:outline-none cursor-pointer"
              >
                <option value="約 400 至 600 字，聚焦單一細節與邏輯交鋒">
                  精悍短段 (500字)
                </option>
                <option value="約 700 至 1000 字，兼顧質感細節、邏輯推演與情緒張力">
                  標準場次 (850字)
                </option>
                <option value="約 1200 至 1600 字，飽滿鋪陳18禁官能張力或完整推理解謎">
                  長篇深描 (1400字)
                </option>
              </select>
              <button
                type="button"
                onClick={handleGenerateStream}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    停止生成
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    AI 續寫正文
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Rail: Quick Ref Table + Live Dungeon Scoreboard, POV Invariants, Consistency Audit & Chronological Memories */}
      {showRight && (
        <aside className="w-full lg:w-88 shrink-0 border-t lg:border-t-0 lg:border-l border-[var(--border-hairline)] bg-[var(--bg-surface)] flex flex-col">
          {/* Right Rail Tab Switch */}
          <div className="grid grid-cols-2 border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]/50">
            <button
              type="button"
              onClick={() => setRightTab('memory')}
              className={`py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                rightTab === 'memory'
                  ? 'border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-surface)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              記憶與計分
            </button>
            <button
              type="button"
              onClick={() => setRightTab('quick_ref')}
              className={`inline-flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                rightTab === 'quick_ref'
                  ? 'border-b-2 border-[var(--accent-primary)] text-[var(--text-primary)] bg-[var(--bg-surface)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              關聯人物速查 ({project.supportingCharacters.length})
            </button>
          </div>

          {rightTab === 'quick_ref' ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="px-4 py-2.5 border-b border-[var(--border-hairline)] flex items-center justify-between gap-2 bg-[var(--bg-elevated)]/40">
                <span className="text-[11px] text-[var(--text-secondary)] shrink-0">
                  視角主角中心：
                </span>
                <select
                  aria-label="選擇速查表中心主角"
                  value={activePovCharacter?.id || quickRefCharId}
                  onChange={(e) => setQuickRefCharId(e.target.value)}
                  disabled={Boolean(activePovCharacter)}
                  className="flex-1 min-w-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)] disabled:opacity-90"
                >
                  {project.characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}（{c.alias || '主角'}）
                    </option>
                  ))}
                </select>
              </div>
              {(() => {
                const targetChar =
                  activePovCharacter ||
                  project.characters.find((c) => c.id === quickRefCharId) ||
                  project.characters[0];
                if (!targetChar) return null;
                return (
                  <ProtagonistQuickRefTable
                    protagonist={targetChar}
                    allProtagonists={project.characters}
                    supportingCharacters={project.supportingCharacters}
                    edges={project.relationshipEdges}
                    branches={project.branches}
                    activeBranchId={activeChapter.branchId || activeBranchId}
                    variant="compact"
                    onUpdateProtagonist={onUpdateProtagonist}
                    onUpdateSupportingCharacter={onUpdateSupportingCharacter}
                  />
                );
              })()}
            </div>
          ) : (
            <>
              {/* Live Dungeon Scoreboard (when in Game Dungeon mode) */}
              {isGameMode && (
            <div className="p-4 border-b border-[var(--border-hairline)] space-y-3 bg-[var(--bg-elevated)]/50">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
                  <Gamepad2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  副本即時記分板
                </span>
                <span className="font-mono-num text-xs font-semibold text-[var(--text-primary)]">
                  {chapterScore.currentScore} / {chapterScore.targetClearScore} 分
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        Math.round(
                          (chapterScore.currentScore /
                            Math.max(1, chapterScore.targetClearScore)) *
                            100
                        )
                      )
                    )}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5">
                    通關門檻分數
                  </label>
                  <input
                    type="number"
                    value={chapterScore.targetClearScore}
                    onChange={(e) =>
                      updateScoreState({
                        targetClearScore: Math.max(
                          1,
                          Number(e.target.value) || 100
                        ),
                      })
                    }
                    className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 font-mono-num text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5">
                    SAN / 體力狀態
                  </label>
                  <input
                    type="text"
                    value={chapterScore.sanOrHp}
                    onChange={(e) =>
                      updateScoreState({ sanOrHp: e.target.value })
                    }
                    className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {chapterScore.scoreLog.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
                  {chapterScore.scoreLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between gap-2 text-[11px] bg-[var(--bg-canvas)] rounded px-2 py-1"
                    >
                      <span className="text-[var(--text-secondary)] truncate">
                        {log.reason}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`font-mono-num font-medium ${
                            log.delta >= 0
                              ? 'text-emerald-500'
                              : 'text-rose-400'
                          }`}
                        >
                          {log.delta >= 0 ? `+${log.delta}` : log.delta}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteScoreLog(log.id, log.delta)
                          }
                          className="text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddScoreLog} className="flex gap-1.5">
                <input
                  type="text"
                  value={scoreReasonInput}
                  onChange={(e) => setScoreReasonInput(e.target.value)}
                  placeholder="加減分原因（如：解開密碼）"
                  className="flex-1 min-w-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2 py-1 text-xs text-[var(--text-primary)]"
                />
                <input
                  type="number"
                  value={scoreDeltaInput}
                  onChange={(e) => setScoreDeltaInput(Number(e.target.value))}
                  className="w-14 rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-1.5 py-1 text-xs font-mono-num text-[var(--text-primary)] text-center"
                />
                <button
                  type="submit"
                  className="rounded bg-[var(--accent-primary)] px-2.5 py-1 text-xs text-stone-100 cursor-pointer shrink-0"
                >
                  記分
                </button>
              </form>
            </div>
          )}

          {/* Active POV Brief & Invariants */}
          <div className="p-4 border-b border-[var(--border-hairline)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                當前視角與人設鐵則
              </span>
              <button
                type="button"
                onClick={onGoToCast}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-4 cursor-pointer"
              >
                編輯人設與關係網
              </button>
            </div>

            {activePovCharacter ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ backgroundColor: activePovCharacter.accentColor }}
                  />
                  <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    {activePovCharacter.name}
                  </h2>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {activePovCharacter.hasDarkSide ? '具陰影面' : '無黑暗面'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {activePovCharacter.coreTraits}
                </p>
                {activePovCharacter.invariants.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] pt-1">
                    {activePovCharacter.invariants.map((inv, idx) => (
                      <li key={idx} className="leading-snug">
                        • {inv}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                全知視角：嚴守所有登場主角與配角團的性格底線與關係網互動。
              </p>
            )}
          </div>

          {/* Actions: Auto-Extract Memory & Consistency Audit */}
          <div className="p-4 border-b border-[var(--border-hairline)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Brain className="h-4 w-4 text-[var(--text-secondary)]" />
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  時序記憶與設定鎖定審查
                </span>
              </div>
              <span className="text-xs font-mono-num text-[var(--text-secondary)]">
                可見 {chronologicalMemories.length} 條
              </span>
            </div>

            <button
              type="button"
              disabled={isExtracting}
              onClick={() => handleExtractMemory()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isExtracting
                ? '正在按時序分析記憶與積分……'
                : '從本章自動擷取時序記憶與積分'}
            </button>

            <button
              type="button"
              disabled={isCheckingConsistency}
              onClick={handleCheckConsistency}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isCheckingConsistency
                ? '正在審查 OOC、私加設定與計分……'
                : '審查人設、私加設定與計分邏輯'}
            </button>

            {extractNotice && (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {extractNotice}
              </p>
            )}

            {consistencyReport && (
              <div className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
                  {consistencyReport.isConsistent ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span>人設、邏輯、計分與設定完全相致</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        發現 {consistencyReport.issues.length} 項潛在漏洞
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {consistencyReport.summary}
                </p>
                {consistencyReport.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="border-t border-[var(--border-hairline)] pt-2 space-y-1 text-xs"
                  >
                    <div className="font-medium text-[var(--text-primary)]">
                      {issue.characterName} ·{' '}
                      {issue.type === 'ooc'
                        ? '人設/關係網偏離 (OOC)'
                        : issue.type === 'familiarity_violation'
                          ? '強行寫熟／違背陌生度邊界'
                          : issue.type === 'invented_canon'
                            ? '擅自偷加未寫設定'
                            : issue.type === 'score_mismatch'
                              ? '副本計分矛盾或遺漏'
                              : issue.type === 'timeline_paradox'
                                ? '時序與邏輯錯亂'
                                : issue.type === 'branch_leak'
                                  ? '平行分支串線'
                                  : '世界/副本規則衝突'}
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      {issue.description}
                    </p>
                    <p className="text-[var(--text-primary)]/90">
                      建議：{issue.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chronologically Ordered Memory Ledger */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>截至時序 #{activeChapter.timelineOrder} 的記憶鏈</span>
              <BookOpen className="h-3.5 w-3.5" />
            </div>

            {chronologicalMemories.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]/80 leading-relaxed py-4">
                此時序之前尚無記憶條目。未來章節與其他平行結局分支的記憶會自動隔離。
              </p>
            ) : (
              <div className="space-y-3">
                {chronologicalMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        <span className="font-mono-num">
                          #{Math.round(mem.timelineOrder)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <span>{mem.timelineLabel}</span>
                        <span aria-hidden="true"> · </span>
                        <span>
                          {MEMORY_CATEGORY_META[mem.category].label}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleMemoryPin(mem.id)}
                        title={mem.pinned ? '取消釘選' : '釘選為核心長期記憶'}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          mem.pinned
                            ? 'text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                      {mem.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                      {mem.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
};
