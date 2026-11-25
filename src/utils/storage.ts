import {
  CHAPTER_STATUS_META,
  type Chapter,
  type MemoryEntry,
  type StoryBranch,
  type StoryProject,
} from '../types/story';

const STORAGE_KEY_PROJECTS = 'ink_shadow_projects_v1';
const STORAGE_KEY_ACTIVE_ID = 'ink_shadow_active_project_v1';
const STORAGE_KEY_THEME = 'ink_shadow_theme_v1';
const STORAGE_KEY_LENGYE_SEEDED = 'ink_shadow_lengye_seeded_v1';

export function countLiteraryWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  const cjkMatches = cleaned.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const withoutCjk = cleaned.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ');
  const latinWords = withoutCjk
    .split(/\s+/)
    .filter((token) => /[a-zA-Z0-9]/.test(token)).length;
  return cjkCount + latinWords;
}

const LENGYE_DEFAULT_STATUS_BY_ID: Record<string, string> = {
  sup_lengye_01: '坐鎮香港冷夜集團總部・外界聯繫暫時中斷',
  sup_lengye_02: '常駐歐洲倫敦・剛空運高訂禮服回港',
  sup_lengye_03: '行蹤隱秘・留給妹妹的銀鐲暗器已就緒',
  sup_lengye_04: '在港島馬術俱樂部・不知妹妹捲入副本',
  sup_lengye_05: '在港處理金融做空・隨時準備資本施壓',
  sup_lengye_06: '主持維港頂層私人會所・善後待機',
  sup_lengye_07: '曾於會所當面見過晏沉並調侃・現於賽車場',
  sup_lengye_08: '海外拍賣會巡迴中・隨時備好珍品',
  sup_lengye_09: '曾遭綁架重傷休養近一年已癒・在主宅靜養',
  sup_lengye_10: '長年駐守海外暗線・未曾露面',
  sup_lengye_11: '在維港會所廳內・陪妹妹喝湯逗趣',
  sup_lengye_12: '緊跟妹妹身邊・對晏沉充滿敵意防備',
};

export function migrateProject(raw: StoryProject): StoryProject {
  const defaultMainBranch: StoryBranch = {
    id: 'main',
    code: 'MAIN',
    title: '共同主線',
    parentBranchId: 'main',
    forkTimelineOrder: 0,
    endingTone: '主線幹道',
    divergencePremise: '所有平行結局共同經歷的起點與前因。',
    status: 'writing',
  };

  const branches =
    Array.isArray(raw.branches) && raw.branches.length > 0
      ? raw.branches
      : [defaultMainBranch];

  const supportingCharacters = (raw.supportingCharacters || []).map((s) => ({
    ...s,
    currentStatus:
      s.currentStatus ||
      LENGYE_DEFAULT_STATUS_BY_ID[s.id] ||
      '狀態正常・依既定背景行事',
    branchStatusMap:
      s.branchStatusMap && typeof s.branchStatusMap === 'object'
        ? s.branchStatusMap
        : {},
  }));

  const characters = (raw.characters || []).map((c) => {
    let characterFamiliarity = c.characterFamiliarity;
    if (!characterFamiliarity || typeof characterFamiliarity !== 'object') {
      characterFamiliarity = {};
      if (c.id === 'char_emma' || c.name.includes('冷夜紫')) {
        supportingCharacters.forEach((s) => {
          if (s.linkedProtagonistId === c.id || s.id.startsWith('sup_lengye_')) {
            characterFamiliarity![s.id] = 'intimate';
          }
        });
        if ((raw.characters || []).some((other) => other.id === 'char_yanchen')) {
          characterFamiliarity!['char_yanchen'] = 'acquaintance';
        }
      } else if (c.id === 'char_yanchen' || c.name === '晏沉') {
        supportingCharacters.forEach((s) => {
          if (
            s.id === 'sup_lengye_07' ||
            s.id === 'sup_lengye_11' ||
            s.id === 'sup_lengye_12'
          ) {
            characterFamiliarity![s.id] = 'acquaintance';
          } else if (
            s.id === 'sup_lengye_01' ||
            s.id === 'sup_lengye_05' ||
            s.id === 'sup_lengye_06'
          ) {
            characterFamiliarity![s.id] = 'heard_of';
          } else if (s.id.startsWith('sup_lengye_')) {
            characterFamiliarity![s.id] = 'stranger';
          }
        });
        if ((raw.characters || []).some((other) => other.id === 'char_emma')) {
          characterFamiliarity!['char_emma'] = 'acquaintance';
        }
      }
    }

    return {
      ...c,
      coreTraits:
        c.coreTraits || c.surfacePersona || '冷靜自持、內心有明確原則與執著',
      invariants: Array.isArray(c.invariants) ? c.invariants : [],
      hasDarkSide:
        typeof c.hasDarkSide === 'boolean'
          ? c.hasDarkSide
          : Boolean(c.darkShadow && c.darkShadow.trim().length > 0),
      characterFamiliarity,
      gameProfile: c.gameProfile || {
        className: '',
        levelOrRank: '',
        skills: '',
        keyItems: '',
      },
    };
  });

  const chapters = (raw.chapters || []).map((ch, idx) => ({
    ...ch,
    timelineOrder:
      typeof ch.timelineOrder === 'number' ? ch.timelineOrder : (idx + 1) * 10,
    timelineLabel: ch.timelineLabel || `T${idx + 1}`,
    branchId: ch.branchId || 'main',
    dungeonScore: ch.dungeonScore || {
      currentScore: 0,
      targetClearScore: 500,
      sanOrHp: 'SAN 100 / 體力正常',
      scoreLog: [],
    },
  }));

  const memories = (raw.memories || []).map((m, idx) => ({
    ...m,
    timelineOrder:
      typeof m.timelineOrder === 'number' ? m.timelineOrder : (idx + 1) * 10,
    timelineLabel: m.timelineLabel || m.sourceChapterTitle || `時序 ${idx + 1}`,
    branchId: m.branchId || 'main',
  }));

  const world = {
    mode: raw.world?.mode || 'literary',
    eraAndSetting: raw.world?.eraAndSetting || '',
    climateAndSenses: raw.world?.climateAndSenses || '',
    powerStructure: raw.world?.powerStructure || '',
    taboos: raw.world?.taboos || '',
    locations: Array.isArray(raw.world?.locations) ? raw.world.locations : [],
    atmosphereImage:
      raw.world?.atmosphereImage ||
      '/src/assets/images/world_atmosphere_noir_1795605807183.jpg',
    gameSystem: raw.world?.gameSystem || {
      systemName: '深淵終端系統',
      coreMechanics: '',
      systemVoiceTone: '',
      currencyAndPenalty: '',
      dungeons: [],
    },
  };

  return {
    ...raw,
    characters,
    supportingCharacters,
    relationshipEdges: Array.isArray(raw.relationshipEdges)
      ? raw.relationshipEdges
      : [],
    nodePositions:
      raw.nodePositions && typeof raw.nodePositions === 'object'
        ? raw.nodePositions
        : {},
    contentSettings: {
      ...raw.contentSettings,
      strictCanonLock:
        typeof raw.contentSettings?.strictCanonLock === 'boolean'
          ? raw.contentSettings.strictCanonLock
          : true,
    },
    branches,
    chapters,
    memories,
    world,
  };
}

export function loadProjects(): StoryProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(migrateProject) : [];
  } catch {
    return [];
  }
}

export function hasSeededLengyeProject(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_LENGYE_SEEDED) === 'true';
  } catch {
    return false;
  }
}

export function markLengyeProjectSeeded(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LENGYE_SEEDED, 'true');
  } catch {
    // ignore
  }
}

const STORAGE_KEY_LENGYE_CAST_V2 = 'ink_shadow_lengye_cast_v2';

export function hasUpgradedLengyeCastV2(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_LENGYE_CAST_V2) === 'true';
  } catch {
    return false;
  }
}

export function markLengyeCastV2Upgraded(): void {
  try {
    localStorage.setItem(STORAGE_KEY_LENGYE_CAST_V2, 'true');
  } catch {
    // ignore
  }
}

export function saveProjects(projects: StoryProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.error('Failed to save projects to localStorage:', err);
  }
}

export function loadActiveProjectId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
  } catch {
    return null;
  }
}

export function saveActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
  } catch {
    // ignore
  }
}

export function loadThemePreference(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_THEME);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function saveThemePreference(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  } catch {
    // ignore
  }
}

export function getChapterCompletionRatio(chapter: Chapter): number {
  const words = countLiteraryWords(chapter.content);
  const wordRatio =
    chapter.targetWords > 0 ? Math.min(1, words / chapter.targetWords) : 0;
  const statusWeight = CHAPTER_STATUS_META[chapter.status]?.progressWeight ?? 0;
  return Math.round((wordRatio * 0.5 + statusWeight * 0.5) * 100);
}

export function getBranchLineageIds(
  branches: StoryBranch[],
  activeBranchId: string
): Set<string> {
  const lineage = new Set<string>(['main']);
  let cursor = branches.find((b) => b.id === activeBranchId);
  let guard = 0;
  while (cursor && guard < 30) {
    lineage.add(cursor.id);
    if (cursor.id === 'main' || cursor.parentBranchId === cursor.id) break;
    cursor = branches.find((b) => b.id === cursor!.parentBranchId);
    guard += 1;
  }
  return lineage;
}

export function getChronologicalMemoriesForContext(
  project: StoryProject,
  branchId: string,
  maxTimelineOrder: number
): MemoryEntry[] {
  const activeBranch = project.branches.find((b) => b.id === branchId);
  const lineage = getBranchLineageIds(project.branches, branchId);

  return project.memories
    .filter((m) => {
      if (!lineage.has(m.branchId)) return false;
      if (m.timelineOrder > maxTimelineOrder) return false;
      if (
        activeBranch &&
        activeBranch.id !== 'main' &&
        m.branchId === 'main' &&
        activeBranch.forkTimelineOrder > 0 &&
        m.timelineOrder > activeBranch.forkTimelineOrder
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.timelineOrder - b.timelineOrder);
}

export function getChaptersForBranchRoute(
  project: StoryProject,
  branchId: string
): Chapter[] {
  const activeBranch = project.branches.find((b) => b.id === branchId);
  const lineage = getBranchLineageIds(project.branches, branchId);

  return project.chapters
    .filter((ch) => {
      if (branchId === 'main') {
        return ch.branchId === 'main';
      }
      if (!lineage.has(ch.branchId)) return false;
      if (
        activeBranch &&
        ch.branchId === 'main' &&
        activeBranch.forkTimelineOrder > 0 &&
        ch.timelineOrder > activeBranch.forkTimelineOrder
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.timelineOrder - b.timelineOrder || a.number - b.number);
}

export function buildMarkdownExport(
  project: StoryProject,
  branchId?: string
): string {
  const targetChapters = branchId
    ? getChaptersForBranchRoute(project, branchId)
    : [...project.chapters].sort(
        (a, b) => a.timelineOrder - b.timelineOrder || a.number - b.number
      );

  const branchObj = branchId
    ? project.branches.find((b) => b.id === branchId)
    : null;

  const lines: string[] = [];
  lines.push(`# ${project.title}`);
  if (project.subtitle) {
    lines.push(`> ${project.subtitle}`);
  }
  if (branchObj) {
    lines.push(
      `分支路線：${branchObj.code} · ${branchObj.title}（${branchObj.endingTone}）`
    );
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const ch of targetChapters) {
    const povName =
      ch.povCharacterId === 'omniscient'
        ? '全知視角'
        : project.characters.find((c) => c.id === ch.povCharacterId)?.name ||
          '未指定視角';
    const chBranch = project.branches.find((b) => b.id === ch.branchId);
    if (ch.actTitle) {
      lines.push(`*${ch.actTitle}*`);
    }
    lines.push(`## 第 ${ch.number} 章：${ch.title}`);
    const scoreMeta =
      project.world.mode === 'game_dungeon' && ch.dungeonScore
        ? `｜副本積分：${ch.dungeonScore.currentScore}/${ch.dungeonScore.targetClearScore}`
        : '';
    lines.push(
      `時序：${ch.timelineLabel}（#${ch.timelineOrder}）｜分支：${chBranch?.title || '主線'}｜視角：${povName}${scoreMeta}｜字數：${countLiteraryWords(ch.content)}`
    );
    lines.push('');
    lines.push(ch.content.trim() || '（本章尚未動筆）');
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
