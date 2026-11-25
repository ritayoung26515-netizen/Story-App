import React, { useState } from 'react';
import {
  Gamepad2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  MAX_PROTAGONISTS,
  PROTAGONIST_SWATCHES,
  type ContentSettings,
  type DarknessLevel,
  type DungeonInstance,
  type GameSystemConfig,
  type Protagonist,
  type RelationshipEdge,
  type SensualLevel,
  type StoryProject,
  type SupportingCharacter,
  type WorldMode,
  type WorldSettings,
} from '../types/story';
import { RelationshipGraph } from './RelationshipGraph';
import { ProtagonistQuickRefTable } from './ProtagonistQuickRefTable';

interface CastAndWorldViewProps {
  project: StoryProject;
  onUpdateProjectMeta: (patch: Partial<StoryProject>) => void;
  onAddProtagonist: (protagonist: Protagonist) => void;
  onUpdateProtagonist: (id: string, patch: Partial<Protagonist>) => void;
  onDeleteProtagonist: (id: string) => void;
  onAddSupportingCharacter: (sup: SupportingCharacter) => void;
  onUpdateSupportingCharacter: (
    id: string,
    patch: Partial<SupportingCharacter>
  ) => void;
  onDeleteSupportingCharacter: (id: string) => void;
  onImportLengyePreset: () => void;
  onUpdateNodePosition: (id: string, pos: { x: number; y: number }) => void;
  onBatchUpdatePositions: (
    positions: Record<string, { x: number; y: number }>
  ) => void;
  onAddRelationshipEdge: (edge: RelationshipEdge) => void;
  onUpdateRelationshipEdge: (
    edgeId: string,
    patch: Partial<RelationshipEdge>
  ) => void;
  onDeleteRelationshipEdge: (edgeId: string) => void;
  onUpdateWorld: (patch: Partial<WorldSettings>) => void;
  onUpdateContentSettings: (patch: Partial<ContentSettings>) => void;
}

const SENSUAL_OPTIONS: {
  id: SensualLevel;
  title: string;
  desc: string;
}[] = [
  {
    id: 'subtle',
    title: '含蓄曖昧',
    desc: '著重視線試探、衣物摩擦與欲言又止的克制距離。',
  },
  {
    id: 'intense',
    title: '熾熱感官',
    desc: '刻畫體溫、喘息、唇齒交纏與親密接觸下的心理角力。',
  },
  {
    id: 'explicit_literary',
    title: '18禁・成年官能實寫（文學質感）',
    desc: '寫出肌膚觸感、體溫濕度、呼吸喘息與肉體結合的高級18禁情色張力，絕不以白開水一筆帶過。',
  },
];

const DARKNESS_OPTIONS: {
  id: DarknessLevel;
  title: string;
  desc: string;
}[] = [
  {
    id: 'shadows',
    title: '幽微寫實',
    desc: '存在危機與私心，但允許陽光、良善與真誠羈絆真實存在。',
  },
  {
    id: 'morally_grey',
    title: '道德灰階與執念',
    desc: '有黑暗面的角色可算計與背叛，無黑暗面的角色則堅守底線。',
  },
  {
    id: 'abyss',
    title: '深淵暴力與毀滅美學',
    desc: '直面極限生存威脅、病態執念、心理操控與殘酷代價，絕不說教。',
  },
];

export const CastAndWorldView: React.FC<CastAndWorldViewProps> = ({
  project,
  onUpdateProjectMeta,
  onAddProtagonist,
  onUpdateProtagonist,
  onDeleteProtagonist,
  onAddSupportingCharacter,
  onUpdateSupportingCharacter,
  onDeleteSupportingCharacter,
  onImportLengyePreset,
  onUpdateNodePosition,
  onBatchUpdatePositions,
  onAddRelationshipEdge,
  onUpdateRelationshipEdge,
  onDeleteRelationshipEdge,
  onUpdateWorld,
  onUpdateContentSettings,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    project.characters[0]?.id || ''
  );
  const [supportingFilter, setSupportingFilter] = useState<string>('all');
  const [newInvariant, setNewInvariant] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRule, setNewRule] = useState('');
  const [isDeepening, setIsDeepening] = useState(false);
  const [deepenError, setDeepenError] = useState<string | null>(null);

  const selectedChar =
    project.characters.find((c) => c.id === selectedCharId) ||
    project.characters[0];

  const canAddMore = project.characters.length < MAX_PROTAGONISTS;
  const isGameMode = project.world.mode === 'game_dungeon';

  const filteredSupporting = project.supportingCharacters.filter((s) =>
    supportingFilter === 'all' ? true : s.linkedProtagonistId === supportingFilter
  );

  const handleCreateProtagonist = () => {
    if (!canAddMore) return;
    const index = project.characters.length;
    const swatch =
      PROTAGONIST_SWATCHES[index % PROTAGONIST_SWATCHES.length].value;
    const created: Protagonist = {
      id: `char_${Date.now()}`,
      name: `新主角 ${index + 1}`,
      alias: '未定稱謂',
      role: `第 ${index + 1} 視角人物`,
      ageOrPresence: '描述外在年齡、姿態與給人的第一印象',
      sensorySignature: '身上獨特的氣味、傷痕、聲音或習慣動作',
      coreTraits: '誠實、敏銳、固執或冷靜——不強求黑暗面',
      invariants: ['寫下一條跨所有平行世界都絕不可違背的人設原則'],
      surfacePersona: '在他人面前展現的日常形象',
      hasDarkSide: false,
      darkShadow: '',
      secretDesire: '內心真正渴望守護或追求的目標',
      povVoiceStyle: '此視角獨有的觀察焦點與敘事語調',
      relationships: '與現有主角之間的羈絆、信任或張力',
      accentColor: swatch,
      gameProfile: {
        className: '未定職業',
        levelOrRank: 'Lv.1',
        skills: '',
        keyItems: '',
      },
    };
    onAddProtagonist(created);
    setSelectedCharId(created.id);
  };

  const handleCreateSupporting = () => {
    const idx = project.supportingCharacters.length + 1;
    const created: SupportingCharacter = {
      id: `sup_${Date.now()}`,
      name: `配角 ${idx}`,
      titleOrRank: '家族成員 / 勢力人物',
      linkedProtagonistId:
        supportingFilter !== 'all'
          ? supportingFilter
          : project.characters[0]?.id || 'global',
      traits: '性格特點與說話習慣',
      specialtyOrRole: '在故事中的專長、職責或背景資源',
      relationshipToProtagonist: '與所屬主角的相處方式',
      currentStatus: '狀態正常・依既定背景行事',
      branchStatusMap: {},
      accentColor: '#64748B',
    };
    onAddSupportingCharacter(created);
  };

  const handleDeepenCharacter = async () => {
    if (!selectedChar) return;
    setIsDeepening(true);
    setDeepenError(null);
    try {
      const res = await fetch('/api/story/deepen-character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: selectedChar,
          world: project.world,
          otherCharacters: project.characters.filter(
            (c) => c.id !== selectedChar.id
          ),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '深化角色失敗');
      }
      onUpdateProtagonist(selectedChar.id, {
        sensorySignature:
          data.sensorySignature || selectedChar.sensorySignature,
        coreTraits: data.coreTraits || selectedChar.coreTraits,
        invariants:
          Array.isArray(data.invariants) && data.invariants.length > 0
            ? data.invariants
            : selectedChar.invariants,
        darkShadow: selectedChar.hasDarkSide
          ? data.darkShadow || selectedChar.darkShadow
          : '',
        secretDesire: data.secretDesire || selectedChar.secretDesire,
        povVoiceStyle: data.povVoiceStyle || selectedChar.povVoiceStyle,
      });
    } catch (err) {
      setDeepenError(
        err instanceof Error ? err.message : '深化角色時發生錯誤'
      );
    } finally {
      setIsDeepening(false);
    }
  };

  const updateGameSystem = (patch: Partial<GameSystemConfig>) => {
    onUpdateWorld({
      gameSystem: {
        ...project.world.gameSystem,
        ...patch,
      },
    });
  };

  const handleAddDungeon = () => {
    const nextIdx = project.world.gameSystem.dungeons.length + 1;
    const created: DungeonInstance = {
      id: `dung_${Date.now()}`,
      code: `DUN-${String(nextIdx).padStart(2, '0')}`,
      name: `新副本 ${nextIdx}`,
      difficulty: '★★★☆☆',
      clearCondition: '輸入通關分數門檻與核心邏輯謎題目標',
      deathPenaltyAndTaboos: '輸入副本紅字規則與觸犯扣分代價',
      environmentNotes: '封閉空間的感官與物理限制',
      bossOrAnomaly: '核心異常體或守關 Boss',
    };
    updateGameSystem({
      dungeons: [...project.world.gameSystem.dungeons, created],
    });
  };

  const handleUpdateDungeon = (
    dungeonId: string,
    patch: Partial<DungeonInstance>
  ) => {
    updateGameSystem({
      dungeons: project.world.gameSystem.dungeons.map((d) =>
        d.id === dungeonId ? { ...d, ...patch } : d
      ),
    });
  };

  const handleDeleteDungeon = (dungeonId: string) => {
    updateGameSystem({
      dungeons: project.world.gameSystem.dungeons.filter(
        (d) => d.id !== dungeonId
      ),
    });
  };

  const hasEmmaAlready = project.characters.some((c) =>
    c.name.includes('冷夜紫')
  );

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-8 space-y-12">
      {/* Section 1: Novel Identity & World Mode Switch */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border-b border-[var(--border-hairline)] pb-10">
        <div className="lg:col-span-4">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            <img
              src={project.coverImage}
              alt={`${project.title} 封面意象`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-5">
              <p className="text-xs text-stone-300">{project.genreNote}</p>
              <h1 className="font-display text-3xl font-semibold text-stone-100 mt-1">
                {project.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
              作品題名與世界架構模式
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                  小說書名
                </label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) =>
                    onUpdateProjectMeta({ title: e.target.value })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                  類型與調性標籤
                </label>
                <input
                  type="text"
                  value={project.genreNote}
                  onChange={(e) =>
                    onUpdateProjectMeta({ genreNote: e.target.value })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                核心題旨 / 多結局背景簡介
              </label>
              <input
                type="text"
                value={project.subtitle}
                onChange={(e) =>
                  onUpdateProjectMeta({ subtitle: e.target.value })
                }
                className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              />
            </div>

            {/* World Mode Switcher */}
            <div className="space-y-2">
              <span className="block text-xs text-[var(--text-secondary)]">
                故事世界模式
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    {
                      id: 'literary',
                      title: '一般文學 / 寫實幻想世界',
                      desc: '聚焦豪門、城市肌理、人際張力與情感博弈。',
                    },
                    {
                      id: 'game_dungeon',
                      title: '遊戲世界 / 計分制副本小說',
                      desc: '啟用主系統計分板、副本通關條件、死亡禁忌與職業道具欄。',
                    },
                  ] as { id: WorldMode; title: string; desc: string }[]
                ).map((modeOpt) => {
                  const active = project.world.mode === modeOpt.id;
                  return (
                    <button
                      key={modeOpt.id}
                      type="button"
                      onClick={() => onUpdateWorld({ mode: modeOpt.id })}
                      className={`text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                        active
                          ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {modeOpt.title}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {active ? '已啟用' : '切換'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {modeOpt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                寫作後自動依時序擷取記憶與副本積分
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                每次採納 AI 續寫後，自動萃取新事件並記錄副本加減分明細，確保分數永不遺忘。
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateProjectMeta({
                  autoExtractOnGenerate: !project.autoExtractOnGenerate,
                })
              }
              className={`px-4 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                project.autoExtractOnGenerate
                  ? 'bg-[var(--accent-primary)] text-stone-100'
                  : 'border border-[var(--border-hairline)] text-[var(--text-secondary)] bg-[var(--bg-canvas)]'
              }`}
            >
              {project.autoExtractOnGenerate ? '已開啟自動同步' : '目前為手動擷取'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 2A: Up to 6 Protagonists */}
      <section className="space-y-6 border-b border-[var(--border-hairline)] pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-mono-num">
              登場主角配額 · {project.characters.length} / {MAX_PROTAGONISTS}{' '}
              位主角
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mt-1">
              核心主角人設與不變鐵則
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!hasEmmaAlready && canAddMore && (
              <button
                type="button"
                onClick={onImportLengyePreset}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
              >
                <Users className="h-3.5 w-3.5" />
                匯入「冷夜紫 Emma 與 12 位哥哥」設定
              </button>
            )}
            <button
              type="button"
              disabled={!canAddMore}
              onClick={handleCreateProtagonist}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs sm:text-sm font-medium text-stone-100 hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {canAddMore ? '新增主角（上限六位）' : '已達六位主角上限'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {project.characters.map((char) => {
            const active = selectedChar?.id === char.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => setSelectedCharId(char.id)}
                className={`text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                  active
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ backgroundColor: char.accentColor }}
                  />
                  <span className="text-[11px] text-[var(--text-secondary)] truncate">
                    {char.hasDarkSide ? '含陰影' : '無黑暗面'}
                  </span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold text-[var(--text-primary)] truncate">
                  {char.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-secondary)] truncate">
                  {char.alias || char.role}
                </p>
              </button>
            );
          })}
        </div>

        {selectedChar && (
          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  {PROTAGONIST_SWATCHES.map((sw) => (
                    <button
                      key={sw.value}
                      type="button"
                      title={`視角代表色：${sw.name}`}
                      onClick={() =>
                        onUpdateProtagonist(selectedChar.id, {
                          accentColor: sw.value,
                        })
                      }
                      className={`h-4 w-4 rounded-sm cursor-pointer transition-transform ${
                        selectedChar.accentColor === sw.value
                          ? 'ring-2 ring-[var(--text-primary)] scale-110'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: sw.value }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateProtagonist(selectedChar.id, {
                      hasDarkSide: !selectedChar.hasDarkSide,
                    })
                  }
                  className={`px-3 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
                    selectedChar.hasDarkSide
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-stone-100'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)]'
                  }`}
                >
                  {selectedChar.hasDarkSide
                    ? '此角色具備黑暗面 / 陰影'
                    : '此角色無黑暗面（純粹 / 受寵 / 無惡意）'}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isDeepening}
                  onClick={handleDeepenCharacter}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isDeepening ? '正在打磨人設與鐵則……' : 'AI 深化人設與鐵則'}
                </button>
                {project.characters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onDeleteProtagonist(selectedChar.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    移除
                  </button>
                )}
              </div>
            </div>

            {deepenError && (
              <p className="text-xs text-rose-400">{deepenError}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  角色姓名
                </label>
                <input
                  type="text"
                  value={selectedChar.name}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  英文名 / 稱謂
                </label>
                <input
                  type="text"
                  value={selectedChar.alias}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      alias: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  故事定位
                </label>
                <input
                  type="text"
                  value={selectedChar.role}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      role: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  核心性格底色
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.coreTraits}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      coreTraits: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  感官印記（氣味、配飾、神態細節）
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.sensorySignature}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      sensorySignature: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  年齡、外貌與氣場
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.ageOrPresence}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      ageOrPresence: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  外在日常形象
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.surfacePersona}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      surfacePersona: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>

              {selectedChar.hasDarkSide && (
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    內心黑暗面
                  </label>
                  <textarea
                    rows={2}
                    value={selectedChar.darkShadow}
                    onChange={(e) =>
                      onUpdateProtagonist(selectedChar.id, {
                        darkShadow: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  深層渴望 / 情慾與情感張力
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.secretDesire}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      secretDesire: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  專屬視角語調
                </label>
                <textarea
                  rows={2}
                  value={selectedChar.povVoiceStyle}
                  onChange={(e) =>
                    onUpdateProtagonist(selectedChar.id, {
                      povVoiceStyle: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Invariants */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
              <label className="block text-xs font-medium text-[var(--text-primary)]">
                跨平行世界不可違背之人設鐵則（AI 在 20 條結局線寫作與審查時皆嚴格遵守）
              </label>
              <div className="divide-y divide-[var(--border-hairline)] rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
                {selectedChar.invariants.length === 0 ? (
                  <p className="px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
                    尚未新增人設鐵則。
                  </p>
                ) : (
                  selectedChar.invariants.map((inv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 px-3.5 py-2 text-xs text-[var(--text-primary)]"
                    >
                      <span>{inv}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateProtagonist(selectedChar.id, {
                            invariants: selectedChar.invariants.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        className="text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInvariant}
                  onChange={(e) => setNewInvariant(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newInvariant.trim()) {
                      e.preventDefault();
                      onUpdateProtagonist(selectedChar.id, {
                        invariants: [
                          ...selectedChar.invariants,
                          newInvariant.trim(),
                        ],
                      });
                      setNewInvariant('');
                    }
                  }}
                  placeholder="新增此角色絕不崩人設的底線……"
                  className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newInvariant.trim()) return;
                    onUpdateProtagonist(selectedChar.id, {
                      invariants: [
                        ...selectedChar.invariants,
                        newInvariant.trim(),
                      ],
                    });
                    setNewInvariant('');
                  }}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
                >
                  加入鐵則
                </button>
              </div>
            </div>

            {/* Game Profile */}
            {isGameMode && (
              <div className="space-y-3 pt-3 border-t border-[var(--border-hairline)]">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]">
                  <Gamepad2 className="h-4 w-4 text-[var(--accent-primary)]" />
                  <span>
                    已登記副本資源（開啟「設定鎖定」時，AI 僅可動用此處登記的技能與道具）
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                      職業 / 定位
                    </label>
                    <input
                      type="text"
                      value={selectedChar.gameProfile?.className || ''}
                      onChange={(e) =>
                        onUpdateProtagonist(selectedChar.id, {
                          gameProfile: {
                            className: e.target.value,
                            levelOrRank:
                              selectedChar.gameProfile?.levelOrRank || '',
                            skills: selectedChar.gameProfile?.skills || '',
                            keyItems: selectedChar.gameProfile?.keyItems || '',
                          },
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                      等級 / 評階
                    </label>
                    <input
                      type="text"
                      value={selectedChar.gameProfile?.levelOrRank || ''}
                      onChange={(e) =>
                        onUpdateProtagonist(selectedChar.id, {
                          gameProfile: {
                            className:
                              selectedChar.gameProfile?.className || '',
                            levelOrRank: e.target.value,
                            skills: selectedChar.gameProfile?.skills || '',
                            keyItems: selectedChar.gameProfile?.keyItems || '',
                          },
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                      已登記天賦技能
                    </label>
                    <input
                      type="text"
                      value={selectedChar.gameProfile?.skills || ''}
                      onChange={(e) =>
                        onUpdateProtagonist(selectedChar.id, {
                          gameProfile: {
                            className:
                              selectedChar.gameProfile?.className || '',
                            levelOrRank:
                              selectedChar.gameProfile?.levelOrRank || '',
                            skills: e.target.value,
                            keyItems: selectedChar.gameProfile?.keyItems || '',
                          },
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                      已登記攜帶道具
                    </label>
                    <input
                      type="text"
                      value={selectedChar.gameProfile?.keyItems || ''}
                      onChange={(e) =>
                        onUpdateProtagonist(selectedChar.id, {
                          gameProfile: {
                            className:
                              selectedChar.gameProfile?.className || '',
                            levelOrRank:
                              selectedChar.gameProfile?.levelOrRank || '',
                            skills: selectedChar.gameProfile?.skills || '',
                            keyItems: e.target.value,
                          },
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Associated Characters & Familiarity Quick Reference Table for this Protagonist */}
            <ProtagonistQuickRefTable
              protagonist={selectedChar}
              allProtagonists={project.characters}
              supportingCharacters={project.supportingCharacters}
              edges={project.relationshipEdges}
              branches={project.branches}
              variant="full"
              onUpdateProtagonist={onUpdateProtagonist}
              onUpdateSupportingCharacter={onUpdateSupportingCharacter}
            />
          </div>
        )}
      </section>

      {/* Section 2B: Supporting Cast Ensemble (No Cap — Supports 12+ Brothers/Family/Retainers) */}
      <section className="space-y-5 border-b border-[var(--border-hairline)] pb-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-[var(--text-secondary)] font-mono-num">
              背景配角團（無人數上限）· 目前共 {project.supportingCharacters.length} 位配角
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mt-1">
              家族成員與背後配角群像
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="篩選所屬主角背景"
              value={supportingFilter}
              onChange={(e) => setSupportingFilter(e.target.value)}
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="all">全部配角 ({project.supportingCharacters.length})</option>
              {project.characters.map((c) => (
                <option key={c.id} value={c.id}>
                  歸屬：{c.name} 的背景團
                </option>
              ))}
              <option value="global">全局共同配角</option>
            </select>

            <button
              type="button"
              onClick={handleCreateSupporting}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-4 py-2 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              新增配角
            </button>
          </div>
        </div>

        {filteredSupporting.length === 0 ? (
          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-sm text-[var(--text-primary)]">
              尚未建立背景配角群（例如某位主角背後的 12 位兄長、幕僚或組織成員）
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              點擊右上「新增配角」即可逐一建立，並納入下方角色關係網與 AI 寫作記憶。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSupporting.map((sup) => (
              <div
                key={sup.id}
                className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0"
                        style={{ backgroundColor: sup.accentColor }}
                      />
                      <input
                        type="text"
                        value={sup.name}
                        onChange={(e) =>
                          onUpdateSupportingCharacter(sup.id, {
                            name: e.target.value,
                          })
                        }
                        className="font-display text-lg font-semibold bg-transparent text-[var(--text-primary)] focus:outline-none w-full"
                      />
                    </div>
                    <input
                      type="text"
                      value={sup.titleOrRank}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          titleOrRank: e.target.value,
                        })
                      }
                      className="w-full bg-transparent text-xs text-[var(--text-secondary)] focus:text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSupportingCharacter(sup.id)}
                    title="移除配角"
                    className="p-1 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-secondary)] shrink-0">
                      歸屬主角：
                    </span>
                    <select
                      value={sup.linkedProtagonistId}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          linkedProtagonistId: e.target.value,
                        })
                      }
                      className="bg-[var(--bg-canvas)] border border-[var(--border-hairline)] rounded px-2 py-1 text-[var(--text-primary)] text-xs cursor-pointer"
                    >
                      {project.characters.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="global">全局配角</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-0.5">
                      性格特徵
                    </label>
                    <input
                      type="text"
                      value={sup.traits}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          traits: e.target.value,
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-0.5">
                      專長 / 職權
                    </label>
                    <input
                      type="text"
                      value={sup.specialtyOrRole}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          specialtyOrRole: e.target.value,
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-0.5">
                      與主角互動態度
                    </label>
                    <input
                      type="text"
                      value={sup.relationshipToProtagonist}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          relationshipToProtagonist: e.target.value,
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[var(--text-secondary)] mb-0.5">
                      當前狀態（主線預設）
                    </label>
                    <input
                      type="text"
                      value={sup.currentStatus}
                      onChange={(e) =>
                        onUpdateSupportingCharacter(sup.id, {
                          currentStatus: e.target.value,
                        })
                      }
                      className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2C: Interactive Character Relationship Graph */}
      <section className="space-y-4 border-b border-[var(--border-hairline)] pb-12">
        <div>
          <p className="text-xs text-[var(--text-secondary)]">
            互動式人物關係繪製 · 點擊任意連線即可編輯關係說明
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] mt-1">
            角色關係網
          </h2>
        </div>

        <RelationshipGraph
          protagonists={project.characters}
          supportingCharacters={project.supportingCharacters}
          edges={project.relationshipEdges}
          nodePositions={project.nodePositions}
          onUpdateNodePosition={onUpdateNodePosition}
          onBatchUpdatePositions={onBatchUpdatePositions}
          onAddEdge={onAddRelationshipEdge}
          onUpdateEdge={onUpdateRelationshipEdge}
          onDeleteEdge={onDeleteRelationshipEdge}
        />
      </section>

      {/* Section 3: Environment & Game Dungeon System */}
      <section className="space-y-6 border-b border-[var(--border-hairline)] pb-12">
        <div className="relative h-48 sm:h-56 w-full overflow-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
          <img
            src={project.world.atmosphereImage}
            alt="環境舞台氛圍意象"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-100">
              {isGameMode
                ? '遊戲世界法則與計分副本目錄'
                : '環境與感官舞台設定'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              {isGameMode
                ? '定義主系統計分規則、懲罰代價與各獨立副本的通關門檻及禁忌。'
                : '決定故事的氣候濕度、建築質地、權力階級與所有角色不可觸碰的紅線。'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              時代背景與地理 / 空間結構
            </label>
            <textarea
              rows={3}
              value={project.world.eraAndSetting}
              onChange={(e) =>
                onUpdateWorld({ eraAndSetting: e.target.value })
              }
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              氣候、氣味與感官基調
            </label>
            <textarea
              rows={3}
              value={project.world.climateAndSenses}
              onChange={(e) =>
                onUpdateWorld({ climateAndSenses: e.target.value })
              }
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              權力結構與地下潛規則
            </label>
            <textarea
              rows={3}
              value={project.world.powerStructure}
              onChange={(e) =>
                onUpdateWorld({ powerStructure: e.target.value })
              }
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              世界禁忌與代價
            </label>
            <textarea
              rows={3}
              value={project.world.taboos}
              onChange={(e) => onUpdateWorld({ taboos: e.target.value })}
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
        </div>

        {/* Game World System & Dungeon Roster */}
        {isGameMode && (
          <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-hairline)] pb-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                  遊戲主系統與副本目錄
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  在寫作室選定章節所屬副本後，AI 會自動讀取該副本的計分門檻、通關條件與死亡禁忌。
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDungeon}
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-primary)] px-3.5 py-2 text-xs font-medium text-stone-100 hover:bg-[var(--accent-hover)] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                新增遊戲副本
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  系統名稱
                </label>
                <input
                  type="text"
                  value={project.world.gameSystem.systemName}
                  onChange={(e) =>
                    updateGameSystem({ systemName: e.target.value })
                  }
                  className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  系統播報語氣
                </label>
                <input
                  type="text"
                  value={project.world.gameSystem.systemVoiceTone}
                  onChange={(e) =>
                    updateGameSystem({ systemVoiceTone: e.target.value })
                  }
                  className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  核心計分與邏輯判定機制
                </label>
                <textarea
                  rows={2}
                  value={project.world.gameSystem.coreMechanics}
                  onChange={(e) =>
                    updateGameSystem({ coreMechanics: e.target.value })
                  }
                  className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  貨幣資源與失敗懲罰
                </label>
                <textarea
                  rows={2}
                  value={project.world.gameSystem.currencyAndPenalty}
                  onChange={(e) =>
                    updateGameSystem({ currencyAndPenalty: e.target.value })
                  }
                  className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="space-y-4">
              {project.world.gameSystem.dungeons.map((dung) => (
                <div
                  key={dung.id}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={dung.code}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, { code: e.target.value })
                        }
                        className="w-24 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-mono-num text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={dung.name}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, { name: e.target.value })
                        }
                        className="flex-1 min-w-[160px] rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-sm font-medium text-[var(--text-primary)]"
                      />
                      <input
                        type="text"
                        value={dung.difficulty}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, {
                            difficulty: e.target.value,
                          })
                        }
                        className="w-40 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDungeon(dung.id)}
                      className="p-1.5 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">
                        通關條件與分數門檻
                      </label>
                      <textarea
                        rows={2}
                        value={dung.clearCondition}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, {
                            clearCondition: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">
                        死亡禁忌與扣分紅線
                      </label>
                      <textarea
                        rows={2}
                        value={dung.deathPenaltyAndTaboos}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, {
                            deathPenaltyAndTaboos: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">
                        副本環境限制
                      </label>
                      <input
                        type="text"
                        value={dung.environmentNotes}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, {
                            environmentNotes: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-secondary)] mb-1">
                        核心異常體 / Boss
                      </label>
                      <input
                        type="text"
                        value={dung.bossOrAnomaly}
                        onChange={(e) =>
                          handleUpdateDungeon(dung.id, {
                            bossOrAnomaly: e.target.value,
                          })
                        }
                        className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locations List */}
        <div className="space-y-3">
          <label className="block text-xs text-[var(--text-secondary)]">
            關鍵場景地點
          </label>
          <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {project.world.locations.map((loc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateWorld({
                      locations: project.world.locations.filter(
                        (_, i) => i !== idx
                      ),
                    })
                  }
                  className="text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLocation.trim()) {
                  e.preventDefault();
                  onUpdateWorld({
                    locations: [...project.world.locations, newLocation.trim()],
                  });
                  setNewLocation('');
                }
              }}
              placeholder="新增關鍵場景地點……"
              className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              type="button"
              onClick={() => {
                if (!newLocation.trim()) return;
                onUpdateWorld({
                  locations: [...project.world.locations, newLocation.trim()],
                });
                setNewLocation('');
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              加入地點
            </button>
          </div>
        </div>
      </section>

      {/* Section 4: Content, 18+ Sensual Quality & Strict Canon Lock */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]">
              內容尺度、18禁文筆質感與設定鎖定
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              確保情色段落具備18禁真實感官張力、推理講求嚴密邏輯，並禁止 AI 擅自加設定。
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateContentSettings({
                strictCanonLock: !project.contentSettings.strictCanonLock,
              })
            }
            className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-xs font-medium cursor-pointer transition-colors ${
              project.contentSettings.strictCanonLock
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-stone-100'
                : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            {project.contentSettings.strictCanonLock
              ? '設定鎖定已開啟（嚴禁 AI 憑空加設定）'
              : '設定鎖定未開啟'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              情色與感官張力設定
            </span>
            <div className="space-y-2.5">
              {SENSUAL_OPTIONS.map((opt) => {
                const active = project.contentSettings.sensualLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateContentSettings({ sensualLevel: opt.id })
                    }
                    className={`w-full text-left rounded-lg border p-4 transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {opt.title}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {active ? '目前採用' : '切換'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-xs font-medium text-[var(--text-secondary)]">
              敘事暗度與衝突尺度
            </span>
            <div className="space-y-2.5">
              {DARKNESS_OPTIONS.map((opt) => {
                const active = project.contentSettings.darknessLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onUpdateContentSettings({ darknessLevel: opt.id })
                    }
                    className={`w-full text-left rounded-lg border p-4 transition-colors cursor-pointer ${
                      active
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {opt.title}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {active ? '目前採用' : '切換'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              核心文筆流派與邏輯要求
            </label>
            <textarea
              rows={3}
              value={project.contentSettings.proseStyle}
              onChange={(e) =>
                onUpdateContentSettings({ proseStyle: e.target.value })
              }
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
              作者自訂補充規範
            </label>
            <textarea
              rows={3}
              value={project.contentSettings.customDirectives}
              onChange={(e) =>
                onUpdateContentSettings({ customDirectives: e.target.value })
              }
              className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-[var(--text-secondary)]">
            拒絕白開水、嚴守邏輯與設定鎖定鐵則
          </label>
          <div className="divide-y divide-[var(--border-hairline)] rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {project.contentSettings.antiBlandnessRules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-[var(--text-primary)]"
              >
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateContentSettings({
                      antiBlandnessRules:
                        project.contentSettings.antiBlandnessRules.filter(
                          (_, i) => i !== idx
                        ),
                    })
                  }
                  className="text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newRule.trim()) {
                  e.preventDefault();
                  onUpdateContentSettings({
                    antiBlandnessRules: [
                      ...project.contentSettings.antiBlandnessRules,
                      newRule.trim(),
                    ],
                  });
                  setNewRule('');
                }
              }}
              placeholder="新增一條創作鐵則……"
              className="flex-1 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3.5 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
            <button
              type="button"
              onClick={() => {
                if (!newRule.trim()) return;
                onUpdateContentSettings({
                  antiBlandnessRules: [
                    ...project.contentSettings.antiBlandnessRules,
                    newRule.trim(),
                  ],
                });
                setNewRule('');
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              加入準則
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
