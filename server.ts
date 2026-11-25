import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  GoogleGenAI,
  HarmBlockThreshold,
  HarmCategory,
  ThinkingLevel,
  Type,
} from '@google/genai';
import type {
  ContentSettings,
  DungeonInstance,
  DungeonScoreState,
  FamiliarityLevel,
  MemoryEntry,
  Protagonist,
  RelationshipEdge,
  RewriteMode,
  StoryBranch,
  SupportingCharacter,
  WorldSettings,
} from './src/types/story.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('尚未設定 GEMINI_API_KEY，請確認環境變數配置。');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const LITERARY_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const RELATIONSHIP_LABELS: Record<string, string> = {
  hostile: '敵對',
  ambiguous: '曖昧',
  mentor_student: '師徒',
  doting_protect: '溺愛保護',
  kinship: '家族血親',
  accomplice: '共犯契約',
  dominance: '支配與臣服',
  custom: '自訂關係',
};

const FAMILIARITY_GUIDANCE: Record<
  FamiliarityLevel,
  { label: string; rule: string }
> = {
  stranger: {
    label: '素未謀面（完全陌生）',
    rule: '完全不認識、未曾見面。嚴禁喊出對方名字或表現熟稔，必須以看待陌生人的距離、戒心或未知視角來互動！',
  },
  heard_of: {
    label: '僅聞其名（單方聽聞）',
    rule: '只耳聞過頭銜或家族名號，無私交。見面時必須保留敬畏或防備距離，先試探與確認身分，不可表現得像熟人。',
  },
  acquaintance: {
    label: '點頭之交（認識但不熟）',
    rule: '曾見過面或有有限交集，但絕不熟悉！對話與動作必須帶有社交界線、客套或試探張力，禁止流露老熟人般的默契與私密稱呼。',
  },
  familiar: {
    label: '熟悉相知',
    rule: '彼此熟悉性格與行事風格，可自然交流配合。',
  },
  intimate: {
    label: '至親密契（極熟）',
    rule: '深度羈絆或血親溺愛，彼此熟知習慣與軟肋，互動親暱無間。',
  },
};

function resolveServerFamiliarity(
  protagonist: Protagonist,
  targetId: string,
  supportingCharacters: SupportingCharacter[],
  edges: RelationshipEdge[]
): FamiliarityLevel {
  const explicit = protagonist.characterFamiliarity?.[targetId];
  if (explicit) return explicit;

  const sup = supportingCharacters.find((s) => s.id === targetId);
  if (sup) {
    if (sup.linkedProtagonistId === protagonist.id) return 'familiar';
    const edge = edges.find(
      (e) =>
        (e.sourceId === protagonist.id && e.targetId === targetId) ||
        (e.targetId === protagonist.id && e.sourceId === targetId)
    );
    if (edge) {
      if (
        edge.type === 'doting_protect' ||
        edge.type === 'kinship' ||
        edge.type === 'dominance'
      ) {
        return 'familiar';
      }
      return 'acquaintance';
    }
    return 'stranger';
  }

  const edge = edges.find(
    (e) =>
      (e.sourceId === protagonist.id && e.targetId === targetId) ||
      (e.targetId === protagonist.id && e.sourceId === targetId)
  );
  if (edge) {
    if (edge.type === 'kinship' || edge.type === 'doting_protect') {
      return 'intimate';
    }
    return 'acquaintance';
  }

  return 'stranger';
}

function buildFamiliarityBoundaryBlock(params: {
  characters: Protagonist[];
  supportingCharacters: SupportingCharacter[];
  edges: RelationshipEdge[];
  activePovId: string;
}): string {
  const { characters, supportingCharacters, edges, activePovId } = params;
  const targetProtagonists =
    activePovId === 'omniscient'
      ? characters
      : characters.filter((c) => c.id === activePovId);

  if (targetProtagonists.length === 0) return '';

  return targetProtagonists
    .map((pov) => {
      const targets = [
        ...supportingCharacters.map((s) => ({
          id: s.id,
          name: s.name,
          role: s.titleOrRank,
        })),
        ...characters
          .filter((other) => other.id !== pov.id)
          .map((other) => ({
            id: other.id,
            name: other.name,
            role: other.alias || other.role,
          })),
      ];

      if (targets.length === 0) return '';

      const grouped: Record<FamiliarityLevel, string[]> = {
        stranger: [],
        heard_of: [],
        acquaintance: [],
        familiar: [],
        intimate: [],
      };

      targets.forEach((t) => {
        const level = resolveServerFamiliarity(
          pov,
          t.id,
          supportingCharacters,
          edges
        );
        grouped[level].push(`${t.name}（${t.role}）`);
      });

      const lines: string[] = [
        `【對視角／主角「${pov.name}」的熟悉度邊界規定（絕對禁止把不熟的人寫成老熟人！）】`,
      ];
      (
        ['stranger', 'heard_of', 'acquaintance', 'familiar', 'intimate'] as FamiliarityLevel[]
      ).forEach((lvl) => {
        if (grouped[lvl].length > 0) {
          lines.push(
            `- ${FAMILIARITY_GUIDANCE[lvl].label}：${grouped[lvl].join('、')}\n  → 寫作禁令：${FAMILIARITY_GUIDANCE[lvl].rule}`
          );
        }
      });

      return lines.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
}

function describeSensualLevel(level: ContentSettings['sensualLevel']): string {
  switch (level) {
    case 'subtle':
      return '【感官與情慾尺度：含蓄曖昧】將張力藏在視線交會、指尖擦過衣袖、呼吸停頓與未說出口的試探裡，重在餘韻，不直接越界。';
    case 'intense':
      return '【感官與情慾尺度：熾熱感官】允許深度的身體接觸、唇齒交纏、體溫與喘息的細膩刻畫，結合心理權力博弈或深刻情感牽引。';
    case 'explicit_literary':
      return `【感官與情慾尺度：18禁成年官能・高質感文學情色描寫】
當劇情進入親密、挑逗或床笫交歡時，必須拿出真正具成年質感與官能張力的18禁實寫筆法：
- 細膩刻畫肌膚溫度、汗水與淚水的濕度、指腹摩挲敏感帶的戰慄、唇舌呼吸的節奏、衣料褪落或半掩的視覺刺激，以及結合部位的緊繃、律動、失控喘息與快感攀升。
- 將肉體歡愉與兩人的身份差、心理拉扯（例如嬌貴千金的羞恥與反差沉淪、掌控者的剋制崩解）緊密交織，寫出令人臉紅心跳卻依然優雅高級的純文學情慾。
- 嚴禁以「一夜過去」「春宵苦短」或乾癟生硬的白開水帶過，也禁止使用廉價低俗的粗口堆砌。`;
  }
}

function describeDarknessLevel(level: ContentSettings['darknessLevel']): string {
  switch (level) {
    case 'shadows':
      return '【整體敘事暗度：幽微寫實】存在危機與私心，但允許陽光、良善與正向羈絆真實存在，不強行讓全員陰暗。';
    case 'morally_grey':
      return '【整體敘事暗度：道德灰階與執念】角色依各自人設行動：有陰影的角色可算計與背叛，沒有黑暗面的角色則堅守純粹底線與溫度，碰撞真實張力。';
    case 'abyss':
      return '【整體敘事暗度：深淵暴力與毀滅美學】不迴避殘酷、病態執念、心理操控、傷痛與生存威脅，直面毀滅與創傷的重量，絕不說教。';
  }
}

function filterChronologicalBranchMemories(params: {
  memories: MemoryEntry[];
  branches: StoryBranch[];
  activeBranchId: string;
  currentTimelineOrder: number;
}): MemoryEntry[] {
  const { memories, branches, activeBranchId, currentTimelineOrder } = params;
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const lineage = new Set<string>(['main']);
  let cursor = activeBranch;
  let guard = 0;
  while (cursor && guard < 30) {
    lineage.add(cursor.id);
    if (cursor.id === 'main' || cursor.parentBranchId === cursor.id) break;
    cursor = branches.find((b) => b.id === cursor!.parentBranchId);
    guard += 1;
  }

  return (memories || [])
    .filter((m) => {
      if (!lineage.has(m.branchId || 'main')) return false;
      const memOrder = typeof m.timelineOrder === 'number' ? m.timelineOrder : 0;
      if (memOrder > currentTimelineOrder) return false;
      if (
        activeBranch &&
        activeBranch.id !== 'main' &&
        (m.branchId || 'main') === 'main' &&
        activeBranch.forkTimelineOrder > 0 &&
        memOrder > activeBranch.forkTimelineOrder
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => (a.timelineOrder || 0) - (b.timelineOrder || 0));
}

function formatRelationshipGraph(params: {
  characters: Protagonist[];
  supportingCharacters: SupportingCharacter[];
  edges: RelationshipEdge[];
}): string {
  const { characters, supportingCharacters, edges } = params;
  if (!edges || edges.length === 0) return '尚未繪製額外關係網連線。';

  const nameLookup = new Map<string, string>();
  characters.forEach((c) => nameLookup.set(c.id, c.name));
  supportingCharacters.forEach((s) => nameLookup.set(s.id, s.name));

  return edges
    .map((e) => {
      const sName = nameLookup.get(e.sourceId) || e.sourceId;
      const tName = nameLookup.get(e.targetId) || e.targetId;
      const arrow = e.bidirectional ? '⇄' : '→';
      const typeLabel =
        e.type === 'custom' && e.customLabel
          ? e.customLabel
          : RELATIONSHIP_LABELS[e.type] || e.type;
      return `- ${sName} ${arrow} ${tName} [${typeLabel}]：${e.description}`;
    })
    .join('\n');
}

function buildLiterarySystemInstruction(params: {
  title: string;
  world: WorldSettings;
  contentSettings: ContentSettings;
  characters: Protagonist[];
  supportingCharacters?: SupportingCharacter[];
  relationshipEdges?: RelationshipEdge[];
  activePovId: string;
  memories: MemoryEntry[];
  branches?: StoryBranch[];
  activeBranchId?: string;
  currentTimelineOrder?: number;
  currentTimelineLabel?: string;
  activeDungeon?: DungeonInstance | null;
  dungeonScore?: DungeonScoreState | null;
}): string {
  const {
    title,
    world,
    contentSettings,
    characters,
    supportingCharacters = [],
    relationshipEdges = [],
    activePovId,
    memories,
    branches = [],
    activeBranchId = 'main',
    currentTimelineOrder = 999999,
    currentTimelineLabel = '',
    activeDungeon = null,
    dungeonScore = null,
  } = params;

  const activeChar =
    activePovId === 'omniscient'
      ? null
      : characters.find((c) => c.id === activePovId) || null;

  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const castSummary = characters
    .map((c, i) => {
      const invariantsText =
        c.invariants && c.invariants.length > 0
          ? c.invariants.map((inv) => `「${inv}」`).join('、')
          : '維持其核心性格一致，不可突然 OOC';

      const darkBlock = c.hasDarkSide
        ? `   - 內心黑暗面：${c.darkShadow || '深藏不露的私心或執念'}`
        : `   - 黑暗面設定：【無黑暗面】此角色本質真誠/純粹/受寵卻有韌性，嚴禁擅自為其強加陰險、邪惡或虛偽算計！`;

      const gameBlock =
        world.mode === 'game_dungeon' && c.gameProfile?.className
          ? `\n   - 副本職業/等級：${c.gameProfile.className}（${c.gameProfile.levelOrRank}）｜已登記技能：${c.gameProfile.skills}｜已登記攜帶道具：${c.gameProfile.keyItems}`
          : '';

      return `${i + 1}. 【${c.name}】（${c.alias || c.role}）
   - 外在氣質與感官印記：${c.ageOrPresence}；${c.sensorySignature}
   - 核心性格底色：${c.coreTraits}
   - 【跨世界不變人設鐵則（絕對不可違背）】：${invariantsText}
   - 日常形象：${c.surfacePersona}
${darkBlock}
   - 深層渴望/目標：${c.secretDesire}${gameBlock}`;
    })
    .join('\n');

  const supportingSummary =
    supportingCharacters.length > 0
      ? supportingCharacters
          .map((s) => {
            const linkedName =
              characters.find((c) => c.id === s.linkedProtagonistId)?.name ||
              '全局背景';
            const branchStatus =
              s.branchStatusMap?.[activeBranchId]?.trim() ||
              s.currentStatus ||
              '狀態正常';
            return `- 【${s.name}】（${s.titleOrRank}｜歸屬：${linkedName}）：${s.traits}｜專長/職責：${s.specialtyOrRole}｜互動基調：${s.relationshipToProtagonist}｜目前狀態（${activeBranchId}）：${branchStatus}`;
          })
          .join('\n')
      : '（無額外配角團）';

  const relationshipText = formatRelationshipGraph({
    characters,
    supportingCharacters,
    edges: relationshipEdges,
  });

  const familiarityBlock = buildFamiliarityBoundaryBlock({
    characters,
    supportingCharacters,
    edges: relationshipEdges,
    activePovId,
  });

  const chronologicalMemories = filterChronologicalBranchMemories({
    memories,
    branches,
    activeBranchId,
    currentTimelineOrder,
  });

  const pinnedFirst = chronologicalMemories.filter((m) => m.pinned);
  const nonPinned = chronologicalMemories.filter((m) => !m.pinned);
  const selectedMemories = [...pinnedFirst, ...nonPinned.slice(-24)].sort(
    (a, b) => (a.timelineOrder || 0) - (b.timelineOrder || 0)
  );

  const memoryLedger = selectedMemories
    .map(
      (m) =>
        `- [時序 #${m.timelineOrder} · ${m.timelineLabel || '既定時刻'}${m.branchId !== 'main' ? ' · 當前分支線' : ''}${m.resolved ? ' · 已回收' : ''}] ${m.title}：${m.detail}`
    )
    .join('\n');

  const povDirective = activeChar
    ? `【本次寫作必須嚴格鎖定視角：${activeChar.name}（限知第三人稱緊密視角）】
- 所有景物、氣味、對話停頓與生理反應，都必須透過「${activeChar.name}」的感官濾鏡來書寫。
- 寫作口吻：${activeChar.povVoiceStyle}
- ${activeChar.hasDarkSide ? `符合其陰影與私心（${activeChar.darkShadow}）` : '嚴格保持此角色無黑暗面的本質底色，切勿強行黑化'}。
- 認知與熟悉度鐵律：只寫「${activeChar.name}」真正認識且處於其認知範圍內的人事物；對於標註為「素未謀面」「僅聞其名」「點頭之交」的配角或他角，絕不可寫出如老熟人般自然攀談、直呼小名或提前知曉私事的描寫！`
    : `【本次寫作視角：全知俯瞰視角】
- 保持精準敘事距離，能捕捉多方角色在同一空間裡的微表情、呼吸落差與嚴守各自人設與陌生/熟悉邊界的反應。`;

  const scoreBlock =
    world.mode === 'game_dungeon' && dungeonScore
      ? `
【當前副本即時記分板（務必牢記目前分數，絕對不可寫到一半忘記或前後矛盾！）】
- 目前累計積分：${dungeonScore.currentScore} / ${dungeonScore.targetClearScore} 分（通關門檻：${dungeonScore.targetClearScore} 分）
- 角色精神/體力狀態：${dungeonScore.sanOrHp}
- 近期計分明細：
${
  dungeonScore.scoreLog.length > 0
    ? dungeonScore.scoreLog
        .slice(-8)
        .map(
          (log) =>
            `  * [${log.timelineLabel}] ${log.reason}（${log.delta >= 0 ? `+${log.delta}` : log.delta} 分）`
        )
        .join('\n')
    : '  * 尚無加減分紀錄（目前 0 分）'
}
- 若本段情節觸發得分或扣分，必須基於副本規則明確計算，並與上述目前總分正確銜接！`
      : '';

  const gameWorldBlock =
    world.mode === 'game_dungeon'
      ? `
【遊戲世界與系統法則】
- 系統名稱：${world.gameSystem?.systemName || '主系統'}
- 核心計分與規則機制：${world.gameSystem?.coreMechanics || '積分與生存規則判定'}
- 系統播報語氣：${world.gameSystem?.systemVoiceTone || '冰冷簡潔的機械文字'}
- 代價與懲罰：${world.gameSystem?.currencyAndPenalty || '違規即扣分或抹殺'}
${
  activeDungeon
    ? `【當前所在副本：${activeDungeon.code}《${activeDungeon.name}》（${activeDungeon.difficulty}）】
- 通關條件：${activeDungeon.clearCondition}
- 死亡禁忌與扣分規則：${activeDungeon.deathPenaltyAndTaboos}
- 副本環境限制：${activeDungeon.environmentNotes}
- 核心Boss/異常體：${activeDungeon.bossOrAnomaly}`
    : ''
}${scoreBlock}`
      : '';

  const canonLockBlock =
    contentSettings.strictCanonLock !== false
      ? `
【絕對鎖定設定鐵則（Strict Canon Lock — 嚴禁擅自新增設定！）】
- 絕對禁止為了讓主角完成某個動作、解開某道謎題或脫離危機，而臨時憑空捏造「既有設定裡沒有的」秘密技能、口袋裡的萬能道具、未曾登場的隱藏親戚/暗衛、或副本規則外的不明漏洞！
- 角色只能動用上方明確列出的「已登記技能」「已登記攜帶道具」「已登場配角專長」以及現場已鋪陳的物理環境線索。
- 若現有資源不足以解決難題，必須靠嚴密的邏輯推理、協作代價或承擔真實的失敗/扣分後果，不可強行開掛！`
      : '';

  const branchBlock = activeBranch
    ? `
【當前平行世界／結局分支定位】
- 分支代號：${activeBranch.code}《${activeBranch.title}》（調性：${activeBranch.endingTone}）
- 分歧核心假設：${activeBranch.divergencePremise}
- 當前時間點座標：時序 #${currentTimelineOrder}${currentTimelineLabel ? `（${currentTimelineLabel}）` : ''}
- 嚴禁引用任何未來時序或其他平行結局分支的記憶！`
    : '';

  return `你是一位文筆極具質感、邏輯嚴密且敢於書寫高質感成年情慾與人性深度的繁體中文小說家，正在撰寫《${title}》。

【核心寫作五大支柱】
1. **文字質感與拒絕白開水**：禁用「他感到很震驚/她心想不妙」等乾癟總結。善用細膩的感官顆粒（光影、面料摩擦、體溫差、脈搏、氣味、喉結滾動與語氣停頓）營造沉浸電影感。
2. **嚴格邏輯性**：所有推理、試探、機關破解與行動都必須遵守嚴格的因果鏈與物理條件（線索從哪裡觀察到、時間差如何吻合、受傷或環境限制如何影響動作），不可跳躍推理或強行降智。
3. **嚴守「認識度與熟悉度邊界」（極重要）**：絕不把「素未謀面」「僅聞其名」或「認識但不熟」的配角／他角寫成彷彿與主角早就是老熟人！見面稱呼、語氣親疏、是否知道對方背景秘密，一律以熟悉度矩陣為準。
4. **嚴格遵守角色關係網、配角當前狀態與人設鐵則**：無論寫到哪個平行結局，角色的性格底色、兄長排行專長、當前位置狀態以及關係網互動都必須前後一致。
5. **繁體中文書面語**：使用「」與『』引號，直接輸出敘事正文，不加前言後記。

${describeSensualLevel(contentSettings.sensualLevel)}
${describeDarknessLevel(contentSettings.darknessLevel)}
${canonLockBlock}

【作者設定的文筆風格與禁令】
- 文筆流派：${contentSettings.proseStyle}
${contentSettings.antiBlandnessRules.map((r) => `- 創作鐵則：${r}`).join('\n')}
${contentSettings.customDirectives ? `- 額外指示：${contentSettings.customDirectives}` : ''}

【故事環境與感官舞台】
- 時代舞台：${world.eraAndSetting}
- 氣候與感官肌理：${world.climateAndSenses}
- 權力與潛規則：${world.powerStructure}
- 禁忌紅線：${world.taboos}
- 已知關鍵地點：${world.locations.join('、')}
${gameWorldBlock}
${branchBlock}

【登場主角檔案（嚴守人設鐵則與已登記道具技能）】
${castSummary || '尚未建立主角檔案。'}

【背景配角團與當前狀態速查（含家族/勢力成員排行、專長與實時狀態，嚴禁張冠李戴）】
${supportingSummary}

【角色關係網（互動必須嚴守此關係圖定義）】
${relationshipText}

${familiarityBlock}

${povDirective}

【時序性角色與世界記憶庫（已依時間先後與當前平行分支嚴格過濾）】
${memoryLedger || '目前此時序之前尚無既定記憶條目。'}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // 1. Streaming literary prose continuation / generation
  app.post('/api/story/generate-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const {
        projectTitle,
        world,
        contentSettings,
        characters,
        supportingCharacters,
        relationshipEdges,
        memories,
        branches,
        activeBranchId,
        chapterTitle,
        chapterNumber,
        timelineOrder,
        timelineLabel,
        dungeonId,
        dungeonScore,
        chapterSummary,
        povCharacterId,
        currentContent,
        previousChapterSummary,
        direction,
        targetLengthHint,
      } = req.body;

      const activeDungeon =
        world?.mode === 'game_dungeon' && dungeonId
          ? (world.gameSystem?.dungeons || []).find(
              (d: DungeonInstance) => d.id === dungeonId
            ) || null
          : null;

      const ai = getAiClient();
      const systemInstruction = buildLiterarySystemInstruction({
        title: projectTitle || '未命名小說',
        world,
        contentSettings,
        characters: characters || [],
        supportingCharacters: supportingCharacters || [],
        relationshipEdges: relationshipEdges || [],
        activePovId: povCharacterId || 'omniscient',
        memories: memories || [],
        branches: branches || [],
        activeBranchId: activeBranchId || 'main',
        currentTimelineOrder:
          typeof timelineOrder === 'number' ? timelineOrder : 999999,
        currentTimelineLabel: timelineLabel || '',
        activeDungeon,
        dungeonScore: dungeonScore || null,
      });

      const recentTail = (currentContent || '').slice(-3200);
      const lengthGuide =
        targetLengthHint || '約 600 至 900 字，完整推進這一場戲的質感與邏輯張力';

      const prompt = `【當前章節資訊】
第 ${chapterNumber} 章：《${chapterTitle}》
時序位置：#${timelineOrder || chapterNumber * 10}（${timelineLabel || '未標註'}）
章節大綱/核心衝突：${chapterSummary || '依既有情節自然推進'}
${previousChapterSummary ? `上一章前情提要：${previousChapterSummary}` : ''}

【本章已寫出的最新段落（請無縫銜接其語氣、空間位置、分數與道具狀態）】
${recentTail ? `---\n${recentTail}\n---` : '（本章尚未寫出開頭，請直接從極具畫面感與張力的第一句落筆）'}

【作者給下一段的場記與方向指令】
${direction?.trim() ? direction.trim() : '嚴守既有設定與推理邏輯，延續角色關係張力與感官質感往下推進。'}

【篇幅與輸出要求】
- 目標篇幅：${lengthGuide}。
- ${recentTail ? '請直接接續前文最後一個動作或對白往下寫，不要重複前文已發生的內容。' : '請直接寫出本章開篇正文，不要輸出章節標題。'}`;

      const stream = await ai.models.generateContentStream({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          safetySettings: LITERARY_SAFETY_SETTINGS,
        },
      });

      let emittedAny = false;
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          emittedAny = true;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
        }
        const finishReason = chunk.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP' && !emittedAny) {
          res.write(
            `data: ${JSON.stringify({
              type: 'error',
              message: `生成被中斷（原因：${finishReason}），請嘗試微調場景指令的措辭。`,
            })}\n\n`
          );
        }
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '生成小說內容時發生未預期的錯誤';
      console.error('Error in /api/story/generate-stream:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
      res.end();
    }
  });

  // 2. Passage literary refinement / POV shift / 18+ sensual & logic polish
  app.post('/api/story/rewrite', async (req, res) => {
    try {
      const {
        projectTitle,
        world,
        contentSettings,
        characters,
        supportingCharacters,
        relationshipEdges,
        memories,
        branches,
        activeBranchId,
        timelineOrder,
        timelineLabel,
        dungeonId,
        dungeonScore,
        povCharacterId,
        selectedText,
        surroundingContext,
        mode,
        customNote,
      } = req.body as {
        projectTitle: string;
        world: WorldSettings;
        contentSettings: ContentSettings;
        characters: Protagonist[];
        supportingCharacters?: SupportingCharacter[];
        relationshipEdges?: RelationshipEdge[];
        memories: MemoryEntry[];
        branches?: StoryBranch[];
        activeBranchId?: string;
        timelineOrder?: number;
        timelineLabel?: string;
        dungeonId?: string;
        dungeonScore?: DungeonScoreState;
        povCharacterId: string;
        selectedText: string;
        surroundingContext?: string;
        mode: RewriteMode;
        customNote?: string;
      };

      if (!selectedText?.trim()) {
        res.status(400).json({ error: '請先在手稿中選取要潤飾的段落。' });
        return;
      }

      const activeDungeon =
        world?.mode === 'game_dungeon' && dungeonId
          ? (world.gameSystem?.dungeons || []).find((d) => d.id === dungeonId) ||
            null
          : null;

      const ai = getAiClient();
      const systemInstruction = buildLiterarySystemInstruction({
        title: projectTitle || '未命名小說',
        world,
        contentSettings,
        characters: characters || [],
        supportingCharacters: supportingCharacters || [],
        relationshipEdges: relationshipEdges || [],
        activePovId: povCharacterId || 'omniscient',
        memories: memories || [],
        branches: branches || [],
        activeBranchId: activeBranchId || 'main',
        currentTimelineOrder:
          typeof timelineOrder === 'number' ? timelineOrder : 999999,
        currentTimelineLabel: timelineLabel || '',
        activeDungeon,
        dungeonScore: dungeonScore || null,
      });

      const modeInstructionMap: Record<RewriteMode, string> = {
        sensual:
          '將選取段落重寫，全面強化18禁成年官能實寫與感官質感：精準刻畫肌膚溫度、呼吸喘息、指尖觸碰敏感處的戰慄、體液濕度與心理沉淪邊緣的張力，保持文學高級感與角色關係一致性，拒絕一筆帶過。',
        darkness:
          '將選取段落重寫，強化情境壓迫感、生死危機、推理邏輯嚴密性或陰影心理張力；若當前角色不具黑暗面，則維持其純粹本性並透過外部危險反襯其韌性，不可強行黑化。',
        polish:
          '替選取段落「去白開水」與「邏輯加固」：刪除空洞的情緒形容詞，換成有顆粒感的感官細節、嚴密的物理/因果描述與優雅冷冽的文學句式。',
        pov_shift:
          '保留原本發生的外部事件與道具/分數狀態，徹底改寫為當前指定主角的限知主觀視角，注入其獨有感官焦點與人設口吻。',
      };

      const prompt = `【潤飾任務】
${modeInstructionMap[mode] || modeInstructionMap.polish}
${customNote?.trim() ? `\n【作者補充要求】${customNote.trim()}` : ''}

【前後文參考（僅供銜接語氣，不要重複輸出）】
${surroundingContext || '（無）'}

【需要被重寫的原段落】
${selectedText}

請只輸出「重寫後的新段落正文」，不要包含任何說明文字或前後文。`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          safetySettings: LITERARY_SAFETY_SETTINGS,
        },
      });

      const rewritten = response.text?.trim();
      if (!rewritten) {
        const reason = response.candidates?.[0]?.finishReason || 'UNKNOWN';
        res.status(422).json({
          error: `無法取得重寫結果（狀態：${reason}），請調整選取範圍或指示再試一次。`,
        });
        return;
      }

      res.json({ rewritten });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '潤飾段落時發生錯誤';
      console.error('Error in /api/story/rewrite:', error);
      res.status(500).json({ error: message });
    }
  });

  // 3. Automatic Chronological Memory + Dungeon Score Event Extraction
  app.post('/api/story/extract-memory', async (req, res) => {
    try {
      const {
        chapterTitle,
        chapterNumber,
        chapterContent,
        timelineOrder,
        timelineLabel,
        branchId,
        branches,
        characters,
        existingMemories,
        isGameMode,
        currentScoreLog,
      } = req.body as {
        chapterTitle: string;
        chapterNumber: number;
        chapterContent: string;
        timelineOrder?: number;
        timelineLabel?: string;
        branchId?: string;
        branches?: StoryBranch[];
        characters: Protagonist[];
        existingMemories: MemoryEntry[];
        isGameMode?: boolean;
        currentScoreLog?: { reason: string; delta: number }[];
      };

      if (!chapterContent || chapterContent.trim().length < 30) {
        res.status(400).json({ error: '章節內文字數過少，無法擷取有效記憶。' });
        return;
      }

      const ai = getAiClient();
      const characterList = (characters || [])
        .map((c) => `${c.id}: ${c.name}（${c.alias || c.role}）`)
        .join('\n');

      const visiblePriorMemories = filterChronologicalBranchMemories({
        memories: existingMemories || [],
        branches: branches || [],
        activeBranchId: branchId || 'main',
        currentTimelineOrder:
          typeof timelineOrder === 'number' ? timelineOrder : 999999,
      });

      const existingList = visiblePriorMemories
        .slice(-40)
        .map(
          (m) =>
            `- [時序 #${m.timelineOrder} ${m.timelineLabel}] [${m.category}] ${m.title}: ${m.detail}`
        )
        .join('\n');

      const existingScoreSummary = (currentScoreLog || [])
        .map((s) => `- ${s.reason} (${s.delta >= 0 ? `+${s.delta}` : s.delta})`)
        .join('\n');

      const prompt = `你是一位嚴謹的小說編輯與時序記憶管理員。請細讀以下第 ${chapterNumber} 章《${chapterTitle}》（時序標籤：${timelineLabel || `第 ${chapterNumber} 章`}）的正文，按事件發生先後，擷取「必須被後續時序牢記的事實、心理變化、情慾/關係互動、未解伏筆、以及道具狀態」。

【登場主角 ID 對照表】
${characterList || '（尚無主角）'}

【當前分支截至此時序的既有記憶庫（請勿重複擷取完全相同的舊條目）】
${existingList || '（目前為空）'}

${
  isGameMode
    ? `【已知副本計分明細（勿重複計算已登錄過的項目）】\n${existingScoreSummary || '（尚無計分明細）'}`
    : ''
}

【本章正文】
${chapterContent.slice(0, 18000)}

請回傳 JSON 格式，包含：
1. chapterSummary: 一句至兩句精煉的本章情節摘要。
2. newMemories: 依正文發生先後排序，最多 6 條全新時序記憶條目（分類為 plot / character / intimacy / foreshadowing / sensory）。
3. scoreChanges: ${isGameMode ? '若本章正文有明確新觸發的得分或扣分事件（且未在已知計分明細中），請列出每筆 reason, delta (整數), timeMoment；無新變動則回傳空陣列。' : '請回傳空陣列 []。'}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chapterSummary: { type: Type.STRING },
              newMemories: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    timeMoment: { type: Type.STRING },
                    relatedCharacterIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    shouldPin: { type: Type.BOOLEAN },
                  },
                  required: [
                    'category',
                    'title',
                    'detail',
                    'timeMoment',
                    'relatedCharacterIds',
                    'shouldPin',
                  ],
                },
              },
              scoreChanges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reason: { type: Type.STRING },
                    delta: { type: Type.INTEGER },
                    timeMoment: { type: Type.STRING },
                  },
                  required: ['reason', 'delta', 'timeMoment'],
                },
              },
            },
            required: ['chapterSummary', 'newMemories', 'scoreChanges'],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '自動擷取記憶時發生錯誤';
      console.error('Error in /api/story/extract-memory:', error);
      res.status(500).json({ error: message });
    }
  });

  // 4. Consistency Audit: OOC, Timeline, Branch Leak, Invented Canon (擅自加設定), & Score Mismatch
  app.post('/api/story/check-consistency', async (req, res) => {
    try {
      const {
        chapterTitle,
        chapterNumber,
        chapterContent,
        timelineOrder,
        timelineLabel,
        branchId,
        branches,
        characters,
        supportingCharacters,
        relationshipEdges,
        memories,
        world,
        dungeonId,
        dungeonScore,
      } = req.body as {
        chapterTitle: string;
        chapterNumber: number;
        chapterContent: string;
        timelineOrder: number;
        timelineLabel: string;
        branchId: string;
        branches: StoryBranch[];
        characters: Protagonist[];
        supportingCharacters?: SupportingCharacter[];
        relationshipEdges?: RelationshipEdge[];
        memories: MemoryEntry[];
        world: WorldSettings;
        dungeonId?: string;
        dungeonScore?: DungeonScoreState;
      };

      if (!chapterContent || chapterContent.trim().length < 20) {
        res.status(400).json({ error: '章節正文字數過少，請先寫入內容再檢查相致性。' });
        return;
      }

      const ai = getAiClient();
      const allowedMemories = filterChronologicalBranchMemories({
        memories: memories || [],
        branches: branches || [],
        activeBranchId: branchId || 'main',
        currentTimelineOrder: timelineOrder,
      });

      const forbiddenMemories = (memories || []).filter(
        (m) => !allowedMemories.some((a) => a.id === m.id)
      );

      const castRules = (characters || [])
        .map(
          (c) =>
            `- 【${c.name}】核心性格：${c.coreTraits}｜是否有黑暗面：${c.hasDarkSide ? `是（${c.darkShadow}）` : '否（嚴禁強行寫出陰暗背刺心理）'}｜不可違背鐵則：${(c.invariants || []).join('；')}｜已登記技能與道具：${c.gameProfile?.skills || '無'} / ${c.gameProfile?.keyItems || '無'}`
        )
        .join('\n');

      const supRules = (supportingCharacters || [])
        .map((s) => {
          const st = s.branchStatusMap?.[branchId]?.trim() || s.currentStatus || '正常';
          return `- ${s.name}（${s.titleOrRank}）：${s.specialtyOrRole}｜目前狀態：${st}`;
        })
        .join('\n');

      const relText = formatRelationshipGraph({
        characters: characters || [],
        supportingCharacters: supportingCharacters || [],
        edges: relationshipEdges || [],
      });

      const familiarityAuditBlock = buildFamiliarityBoundaryBlock({
        characters: characters || [],
        supportingCharacters: supportingCharacters || [],
        edges: relationshipEdges || [],
        activePovId: 'omniscient',
      });

      const activeDungeon =
        world?.mode === 'game_dungeon' && dungeonId
          ? (world.gameSystem?.dungeons || []).find((d) => d.id === dungeonId) ||
            null
          : null;

      const prompt = `你是一位極度嚴謹的總編輯，專門審查長篇小說的七項致命漏洞：
1. ooc（人設或關係網偏離）：違背主角鐵則、無黑暗面角色被強行寫黑、配角排行專長或目前狀態張冠李戴、或違反角色關係網定義。
2. familiarity_violation（強行寫熟／違背陌生度邊界）：主角對「素未謀面」「僅聞其名」或「認識但不熟」的配角或他角表現出不合理的熟稔、沒經過介紹就直呼姓名/小名、或提前知道對方背景秘密！
3. invented_canon（擅自偷加設定）：為了讓主角脫困或做事，寫出設定裡原本不存在的新技能、未登記道具、突如其來的親戚/密道或未定義規則。
4. score_mismatch（副本計分遺漏或矛盾）：遊戲副本中寫出的得分/扣分/總分與目前記分板 (${dungeonScore ? `${dungeonScore.currentScore}/${dungeonScore.targetClearScore}` : '無'}) 前後矛盾。
5. timeline_paradox（時序與邏輯錯亂）：角色提前知道未來時序的事、或推理過程違反物理與因果邏輯。
6. branch_leak（平行世界串線）：混入其他平行結局分支的事件。
7. world_rule（世界／副本規則衝突）：違反時代背景或副本紅字禁忌。

【主角人設與已登記資源】
${castRules}

【配角團（排行、專長與當前狀態）】
${supRules || '無'}

【角色關係網】
${relText}

${familiarityAuditBlock}

【合法可見的過去記憶（時序 <= #${timelineOrder}）】
${allowedMemories.map((m) => `- [#${m.timelineOrder}] ${m.title}: ${m.detail}`).join('\n') || '（無）'}

【不可知曉的未來或其他平行分支記憶】
${forbiddenMemories.slice(0, 20).map((m) => `- [分支:${m.branchId} 時序:#${m.timelineOrder}] ${m.title}: ${m.detail}`).join('\n') || '（無）'}

${activeDungeon ? `【當前副本規則與記分板】${activeDungeon.name}｜通關：${activeDungeon.clearCondition}｜禁忌：${activeDungeon.deathPenaltyAndTaboos}｜目前積分：${dungeonScore?.currentScore ?? 0}/${dungeonScore?.targetClearScore ?? 500}` : ''}

【待審查第 ${chapterNumber} 章《${chapterTitle}》（${timelineLabel}）正文】
${chapterContent.slice(0, 18000)}

請回傳 JSON 格式審查報告（繁體中文）。若沒有明顯問題，issues 回傳空陣列並將 isConsistent 設為 true。`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isConsistent: { type: Type.BOOLEAN },
              summary: { type: Type.STRING },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    severity: { type: Type.STRING },
                    type: { type: Type.STRING },
                    characterName: { type: Type.STRING },
                    description: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                  },
                  required: [
                    'severity',
                    'type',
                    'characterName',
                    'description',
                    'suggestion',
                  ],
                },
              },
            },
            required: ['isConsistent', 'summary', 'issues'],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json(parsed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '檢查人設與設定相致性時發生錯誤';
      console.error('Error in /api/story/check-consistency:', error);
      res.status(500).json({ error: message });
    }
  });

  // 5. Deepen Protagonist
  app.post('/api/story/deepen-character', async (req, res) => {
    try {
      const { character, world, otherCharacters } = req.body as {
        character: Protagonist;
        world: WorldSettings;
        otherCharacters: Protagonist[];
      };

      const ai = getAiClient();
      const prompt = `你是一位重視角色立體度與人設一致性的小說家。請根據以下角色雛形與世界觀，幫作者打磨這個角色的「感官印記」「核心性格底色」「跨平行世界不變人設鐵則 (2-3條)」「深層渴望」與「獨特視角語氣」${character.hasDarkSide ? '，以及具立體感的「內心黑暗面」' : '（注意：此角色設定為「沒有黑暗面」，請勿編造陰暗邪惡設定，darkShadow 請回傳空字串，改為打磨其純粹、明豔或真實的性格韌性！）'}。

【世界觀模式與背景】
模式：${world.mode === 'game_dungeon' ? '遊戲副本／無限流世界' : '一般文學／幻想世界'}
${world.eraAndSetting}
${world.climateAndSenses}

【其他登場主角】
${(otherCharacters || []).map((c) => `${c.name}（${c.role}）`).join('、') || '尚無'}

【目前主角資料】
姓名：${character.name}
稱謂/身分：${character.alias} / ${character.role}
核心性格：${character.coreTraits}
是否具備黑暗面：${character.hasDarkSide ? '是' : '否（無黑暗面）'}
${character.hasDarkSide ? `目前黑暗面構想：${character.darkShadow}` : ''}
目前渴望/目標構想：${character.secretDesire}

請回傳 JSON（繁體中文）。`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          safetySettings: LITERARY_SAFETY_SETTINGS,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sensorySignature: { type: Type.STRING },
              coreTraits: { type: Type.STRING },
              invariants: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              darkShadow: { type: Type.STRING },
              secretDesire: { type: Type.STRING },
              povVoiceStyle: { type: Type.STRING },
            },
            required: [
              'sensorySignature',
              'coreTraits',
              'invariants',
              'darkShadow',
              'secretDesire',
              'povVoiceStyle',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json(parsed);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '深化角色設定時發生錯誤';
      console.error('Error in /api/story/deepen-character:', error);
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ink & Chiaroscuro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
