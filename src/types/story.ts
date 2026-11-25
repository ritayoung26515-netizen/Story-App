export type SensualLevel = 'subtle' | 'intense' | 'explicit_literary';
export type DarknessLevel = 'shadows' | 'morally_grey' | 'abyss';
export type ChapterStatus = 'outline' | 'drafting' | 'polishing' | 'continuity' | 'final';
export type MemoryCategory = 'plot' | 'character' | 'intimacy' | 'foreshadowing' | 'sensory';
export type RewriteMode = 'sensual' | 'darkness' | 'polish' | 'pov_shift';
export type WorldMode = 'literary' | 'game_dungeon';
export type BranchStatus = 'planning' | 'writing' | 'completed';

export type RelationshipType =
  | 'hostile'
  | 'ambiguous'
  | 'mentor_student'
  | 'doting_protect'
  | 'kinship'
  | 'accomplice'
  | 'dominance'
  | 'custom';

export type FamiliarityLevel =
  | 'stranger'
  | 'heard_of'
  | 'acquaintance'
  | 'familiar'
  | 'intimate';

export const FAMILIARITY_META: Record<
  FamiliarityLevel,
  { label: string; shortLabel: string; aiRule: string; toneClass: string }
> = {
  stranger: {
    label: '素未謀面（完全陌生）',
    shortLabel: '素未謀面',
    aiRule:
      '完全不認識彼此、從未見面。嚴禁主動喊出對方名字或綽號，嚴禁表現出任何熟悉感或默契，見面時只能以陌生人姿態觀察、戒備或詢問來歷。',
    toneClass: 'text-rose-500 dark:text-rose-400',
  },
  heard_of: {
    label: '僅聞其名（未深交）',
    shortLabel: '僅聞其名',
    aiRule:
      '僅在傳聞或情報中聽過頭銜/名字，沒有私人交情。見面須先核對身分、保持敬畏或距離感，絕對不可像熟人般自然對話。',
    toneClass: 'text-amber-600 dark:text-amber-400',
  },
  acquaintance: {
    label: '點頭之交（認識但不熟）',
    shortLabel: '認識但不熟',
    aiRule:
      '見過面或有有限交集，但並不熟悉。對話必須保留社交禮數、距離感與試探分寸，禁止流露只有深交才知道的私密習慣或過分熱絡。',
    toneClass: 'text-sky-600 dark:text-sky-400',
  },
  familiar: {
    label: '熟悉相知',
    shortLabel: '熟悉',
    aiRule: '彼此熟悉性格與處事風格，可以自然交流、互相配合或調侃。',
    toneClass: 'text-emerald-600 dark:text-emerald-400',
  },
  intimate: {
    label: '至親密契（極熟）',
    shortLabel: '至親極熟',
    aiRule: '血親溺愛或深度羈絆，熟知對方小動作、習慣與軟肋，互動親暱無間。',
    toneClass: 'text-[var(--accent-primary)]',
  },
};

export const RELATIONSHIP_TYPE_META: Record<
  RelationshipType,
  { label: string; color: string }
> = {
  hostile: { label: '敵對', color: '#DC2626' },
  ambiguous: { label: '曖昧', color: '#BE185D' },
  mentor_student: { label: '師徒', color: '#0284C7' },
  doting_protect: { label: '溺愛保護', color: '#D97706' },
  kinship: { label: '家族血親', color: '#64748B' },
  accomplice: { label: '共犯契約', color: '#7C3AED' },
  dominance: { label: '支配與臣服', color: '#9F1239' },
  custom: { label: '自訂關係', color: '#059669' },
};

export const MAX_PROTAGONISTS = 6;

export interface ProtagonistGameProfile {
  className: string;
  levelOrRank: string;
  skills: string;
  keyItems: string;
}

export interface Protagonist {
  id: string;
  name: string;
  alias: string;
  role: string;
  ageOrPresence: string;
  sensorySignature: string;
  coreTraits: string;
  invariants: string[];
  surfacePersona: string;
  hasDarkSide: boolean;
  darkShadow: string;
  secretDesire: string;
  povVoiceStyle: string;
  relationships: string;
  characterFamiliarity?: Record<string, FamiliarityLevel>;
  accentColor: string;
  gameProfile?: ProtagonistGameProfile;
}

export interface SupportingCharacter {
  id: string;
  name: string;
  titleOrRank: string; // e.g., 大哥 · 執掌家族商業帝國
  linkedProtagonistId: string; // 所屬主角背景（如冷夜紫 Emma），或 'global'
  traits: string;
  specialtyOrRole: string;
  relationshipToProtagonist: string;
  currentStatus: string; // 當前狀態（例如：位置、動向、傷勢、警戒狀態）
  branchStatusMap?: Record<string, string>; // 平行結局分支專屬狀態覆寫
  accentColor: string;
}

export interface RelationshipEdge {
  id: string;
  sourceId: string; // protagonist or supporting character id
  targetId: string;
  type: RelationshipType;
  customLabel?: string;
  bidirectional: boolean;
  description: string;
}

export interface DungeonInstance {
  id: string;
  code: string;
  name: string;
  difficulty: string;
  clearCondition: string;
  deathPenaltyAndTaboos: string;
  environmentNotes: string;
  bossOrAnomaly: string;
}

export interface GameSystemConfig {
  systemName: string;
  coreMechanics: string;
  systemVoiceTone: string;
  currencyAndPenalty: string;
  dungeons: DungeonInstance[];
}

export interface ScoreLogItem {
  id: string;
  reason: string;
  delta: number;
  timelineLabel: string;
}

export interface DungeonScoreState {
  currentScore: number;
  targetClearScore: number;
  sanOrHp: string;
  scoreLog: ScoreLogItem[];
}

export interface WorldSettings {
  mode: WorldMode;
  eraAndSetting: string;
  climateAndSenses: string;
  powerStructure: string;
  taboos: string;
  locations: string[];
  atmosphereImage: string;
  gameSystem: GameSystemConfig;
}

export interface ContentSettings {
  proseStyle: string;
  sensualLevel: SensualLevel;
  darknessLevel: DarknessLevel;
  strictCanonLock: boolean; // 禁止 AI 為強行推劇情而擅自新增未寫明的設定/道具/規則
  antiBlandnessRules: string[];
  customDirectives: string;
}

export interface StoryBranch {
  id: string;
  code: string;
  title: string;
  parentBranchId: string;
  forkTimelineOrder: number;
  endingTone: string;
  divergencePremise: string;
  status: BranchStatus;
}

export interface SceneBeat {
  id: string;
  title: string;
  povCharacterId: string;
  summary: string;
  completed: boolean;
}

export interface Chapter {
  id: string;
  number: number;
  timelineOrder: number;
  timelineLabel: string;
  branchId: string;
  dungeonId?: string;
  dungeonScore?: DungeonScoreState;
  actTitle: string;
  title: string;
  povCharacterId: string;
  status: ChapterStatus;
  targetWords: number;
  summary: string;
  beats: SceneBeat[];
  content: string;
  lastMemorySyncAt?: string;
  updatedAt: string;
}

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  title: string;
  detail: string;
  timelineOrder: number;
  timelineLabel: string;
  branchId: string;
  relatedCharacterIds: string[];
  sourceChapterId: string;
  sourceChapterTitle: string;
  pinned: boolean;
  resolved: boolean;
  createdAt: string;
}

export interface ConsistencyIssue {
  severity: 'high' | 'medium';
  type:
    | 'ooc'
    | 'familiarity_violation'
    | 'timeline_paradox'
    | 'branch_leak'
    | 'world_rule'
    | 'invented_canon'
    | 'score_mismatch';
  characterName: string;
  description: string;
  suggestion: string;
}

export interface ConsistencyReport {
  isConsistent: boolean;
  summary: string;
  issues: ConsistencyIssue[];
}

export interface StoryProject {
  id: string;
  title: string;
  subtitle: string;
  genreNote: string;
  coverImage: string;
  characters: Protagonist[];
  supportingCharacters: SupportingCharacter[];
  relationshipEdges: RelationshipEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  world: WorldSettings;
  contentSettings: ContentSettings;
  branches: StoryBranch[];
  chapters: Chapter[];
  memories: MemoryEntry[];
  autoExtractOnGenerate: boolean;
  targetTotalWords: number;
  updatedAt: string;
}

export const CHAPTER_STATUS_META: Record<
  ChapterStatus,
  { label: string; shortLabel: string; progressWeight: number }
> = {
  outline: { label: '構思大綱', shortLabel: '大綱', progressWeight: 0.15 },
  drafting: { label: '草稿書寫', shortLabel: '草稿', progressWeight: 0.45 },
  polishing: { label: '張力打磨', shortLabel: '打磨', progressWeight: 0.7 },
  continuity: { label: '相致校對', shortLabel: '校對', progressWeight: 0.88 },
  final: { label: '定稿完成', shortLabel: '定稿', progressWeight: 1.0 },
};

export const MEMORY_CATEGORY_META: Record<
  MemoryCategory,
  { label: string; description: string }
> = {
  plot: { label: '關鍵事件', description: '推動主線或不可逆轉的情節節點' },
  character: { label: '心理與成長', description: '角色心態轉變、信念動搖或關鍵認知更新' },
  intimacy: { label: '情慾與羈絆', description: '身體越界、試探、支配或深刻情感承諾' },
  foreshadowing: { label: '伏筆懸念', description: '尚未收束的威脅、線索或副本異常規則' },
  sensory: { label: '感官物件', description: '具有象徵意義的物品、氣味、傷痕或道具狀態' },
};

export const BRANCH_STATUS_META: Record<BranchStatus, string> = {
  planning: '分支構思',
  writing: '撰寫中',
  completed: '結局已定稿',
};

export const PROTAGONIST_SWATCHES = [
  { name: '牛血緋紅', value: '#9F1239' },
  { name: '深海灰藍', value: '#334155' },
  { name: '舊銅琥珀', value: '#92400E' },
  { name: '苔蘚暗綠', value: '#3F6212' },
  { name: '煙燻梅紫', value: '#6B21A8' },
  { name: '晴空靛青', value: '#0369A1' },
];
