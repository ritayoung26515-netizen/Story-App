import type { ChapterSensoryMarkers, SensoryTag } from '../types/story';

export const SENSORY_TAG_META: Record<
  SensoryTag,
  {
    label: string;
    shortLabel: string;
    description: string;
    activeClass: string;
    dotClass: string;
  }
> = {
  erotic: {
    label: '情慾官能',
    shortLabel: '情慾',
    description: '18禁親密挑逗、體溫交纏、喘息與感官沉淪張力',
    activeClass:
      'border-rose-600 bg-rose-800 text-stone-100',
    dotClass: 'bg-rose-500',
  },
  violence: {
    label: '暴力血腥',
    shortLabel: '暴力',
    description: '生死搏殺、冷兵器或槍火衝擊、痛覺與血跡張力',
    activeClass:
      'border-red-600 bg-red-800 text-stone-100',
    dotClass: 'bg-red-500',
  },
  dark_psych: {
    label: '暗黑心理',
    shortLabel: '暗黑心理',
    description: '偏執佔有、權力操控、孤立窒息與道德幽暗',
    activeClass:
      'border-purple-600 bg-purple-800 text-stone-100',
    dotClass: 'bg-purple-500',
  },
  logic_noir: {
    label: '推理冷冽',
    shortLabel: '推理冷冽',
    description: '副本規則博弈、線索拆解、時間差推演與冷靜算計',
    activeClass:
      'border-sky-600 bg-sky-800 text-stone-100',
    dotClass: 'bg-sky-500',
  },
  tender: {
    label: '溫存餘韻',
    shortLabel: '柔情',
    description: '家族庇護、無聲守候、短暫安寧與微光柔情',
    activeClass:
      'border-amber-600 bg-amber-700 text-stone-100',
    dotClass: 'bg-amber-500',
  },
};

export const DEFAULT_CHAPTER_SENSORY_MARKERS: ChapterSensoryMarkers = {
  tags: [],
  sensualIntensity: 20,
  violenceIntensity: 15,
  autoTypography: true,
};

export interface TypographyProfile {
  id: string;
  styleName: string;
  moodLabel: string;
  proseClassName: string;
  titleClassName: string;
  accentBorderClass: string;
  fontSizePx: number;
  lineHeight: number;
  sampleLine: string;
}

const STANDARD_SERIF_PROFILE: TypographyProfile = {
  id: 'standard_serif',
  styleName: '典雅文學宋體',
  moodLabel: '均衡敘事・標準手稿排版',
  proseClassName: 'prose-profile-standard_serif',
  titleClassName: 'title-profile-standard_serif',
  accentBorderClass: 'border-l-[var(--accent-primary)]',
  fontSizePx: 17,
  lineHeight: 1.9,
  sampleLine: '光影落在手稿邊緣，文字以沉穩節奏推進。',
};

export function resolveSensoryTypography(
  markers?: ChapterSensoryMarkers
): TypographyProfile {
  if (!markers || !markers.autoTypography) {
    return STANDARD_SERIF_PROFILE;
  }

  const tags = new Set(markers.tags || []);
  const hasErotic = tags.has('erotic') || markers.sensualIntensity >= 60;
  const hasViolence = tags.has('violence') || markers.violenceIntensity >= 60;
  const hasDarkPsych = tags.has('dark_psych');
  const hasLogic = tags.has('logic_noir');
  const hasTender = tags.has('tender');

  if (hasErotic && hasViolence) {
    return {
      id: 'gothic_passion_razor',
      styleName: '危情哥德宋・情慾與暴力交織',
      moodLabel: '高對比襯線 × 危險呼吸節奏',
      proseClassName: 'prose-profile-gothic_passion_razor',
      titleClassName: 'title-profile-gothic_passion_razor',
      accentBorderClass: 'border-l-rose-600',
      fontSizePx: 17.5,
      lineHeight: 1.88,
      sampleLine: '指尖擦過頸側微涼的血脈，危險與迷戀同時升溫。',
    };
  }

  if (hasErotic) {
    return {
      id: 'velvet_wenkai',
      styleName: '絲絨文楷體・官能呼吸感',
      moodLabel: '手寫楷韻 × 寬行距微暖質感',
      proseClassName: 'prose-profile-velvet_wenkai',
      titleClassName: 'title-profile-velvet_wenkai',
      accentBorderClass: 'border-l-pink-600',
      fontSizePx: 17.5,
      lineHeight: 2.05,
      sampleLine: '呼吸交纏在咫尺之間，字句隨體溫放慢韻律。',
    };
  }

  if (hasViolence) {
    return {
      id: 'razor_sans',
      styleName: '冷鋒銳黑體・暴力衝擊感',
      moodLabel: '銳利無襯線 × 緊湊壓迫行距',
      proseClassName: 'prose-profile-razor_sans',
      titleClassName: 'title-profile-razor_sans',
      accentBorderClass: 'border-l-red-600',
      fontSizePx: 16.5,
      lineHeight: 1.72,
      sampleLine: '冷鐵破風而至，文字收束成毫無餘地的一記重擊。',
    };
  }

  if (hasDarkPsych) {
    return {
      id: 'abyss_mincho',
      styleName: '深淵明朝體・心理窒息感',
      moodLabel: '古典重明朝 × 幽微壓迫對比',
      proseClassName: 'prose-profile-abyss_mincho',
      titleClassName: 'title-profile-abyss_mincho',
      accentBorderClass: 'border-l-purple-600',
      fontSizePx: 17,
      lineHeight: 1.84,
      sampleLine: '沉入寂靜深處的算計，每一筆皆是無聲試探。',
    };
  }

  if (hasLogic) {
    return {
      id: 'logic_dossier_sans',
      styleName: '精密檔案黑・冷冽推理感',
      moodLabel: '理性無襯線 × 清晰因果脈絡',
      proseClassName: 'prose-profile-logic_dossier_sans',
      titleClassName: 'title-profile-logic_dossier_sans',
      accentBorderClass: 'border-l-sky-600',
      fontSizePx: 16,
      lineHeight: 1.78,
      sampleLine: '時間差、規則邊界與道具狀態，精確排列無誤。',
    };
  }

  if (hasTender) {
    return {
      id: 'tender_wenkai',
      styleName: '溫潤手寫楷・微光柔情',
      moodLabel: '舒朗楷書 × 溫和呼吸留白',
      proseClassName: 'prose-profile-tender_wenkai',
      titleClassName: 'title-profile-tender_wenkai',
      accentBorderClass: 'border-l-amber-500',
      fontSizePx: 17,
      lineHeight: 2.0,
      sampleLine: '燈影溫柔垂落，將鋒芒暫時收進柔軟的沉默裡。',
    };
  }

  return STANDARD_SERIF_PROFILE;
}
