import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Gauge,
  Swords,
  Type as TypeIcon,
} from 'lucide-react';
import type { ChapterSensoryMarkers, SensoryTag } from '../types/story';
import {
  DEFAULT_CHAPTER_SENSORY_MARKERS,
  resolveSensoryTypography,
  SENSORY_TAG_META,
} from '../utils/sensoryTypography';

interface SensoryScaleDashboardProps {
  chapterTitle: string;
  markers?: ChapterSensoryMarkers;
  onChange: (next: ChapterSensoryMarkers) => void;
}

const ORDERED_TAGS: SensoryTag[] = [
  'erotic',
  'violence',
  'dark_psych',
  'logic_noir',
  'tender',
];

export const SensoryScaleDashboard: React.FC<SensoryScaleDashboardProps> = ({
  chapterTitle,
  markers,
  onChange,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const current: ChapterSensoryMarkers =
    markers || DEFAULT_CHAPTER_SENSORY_MARKERS;
  const activeProfile = resolveSensoryTypography(current);

  const toggleTag = (tag: SensoryTag) => {
    const exists = current.tags.includes(tag);
    const nextTags = exists
      ? current.tags.filter((t) => t !== tag)
      : [...current.tags, tag];

    let nextSensual = current.sensualIntensity;
    let nextViolence = current.violenceIntensity;

    if (tag === 'erotic') {
      nextSensual = !exists
        ? Math.max(75, current.sensualIntensity)
        : Math.min(35, current.sensualIntensity);
    }
    if (tag === 'violence') {
      nextViolence = !exists
        ? Math.max(75, current.violenceIntensity)
        : Math.min(35, current.violenceIntensity);
    }

    onChange({
      ...current,
      tags: nextTags,
      sensualIntensity: nextSensual,
      violenceIntensity: nextViolence,
    });
  };

  const handleIntensityChange = (
    field: 'sensualIntensity' | 'violenceIntensity',
    value: number
  ) => {
    const clamped = Math.max(0, Math.min(100, value));
    let nextTags = [...current.tags];
    if (field === 'sensualIntensity') {
      if (clamped >= 60 && !nextTags.includes('erotic')) {
        nextTags.push('erotic');
      } else if (clamped < 25 && nextTags.includes('erotic')) {
        nextTags = nextTags.filter((t) => t !== 'erotic');
      }
    }
    if (field === 'violenceIntensity') {
      if (clamped >= 60 && !nextTags.includes('violence')) {
        nextTags.push('violence');
      } else if (clamped < 25 && nextTags.includes('violence')) {
        nextTags = nextTags.filter((t) => t !== 'violence');
      }
    }

    onChange({
      ...current,
      tags: nextTags,
      [field]: clamped,
    });
  };

  const activeTagsLabel =
    current.tags.length > 0
      ? current.tags.map((t) => SENSORY_TAG_META[t].shortLabel).join(' · ')
      : '均衡基準';

  return (
    <section
      aria-label="感官尺度儀表板"
      className="border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)]/45"
    >
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left hover:bg-[var(--bg-elevated)]/70 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Gauge className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
            感官尺度儀表板
          </span>
          <span className="text-[11px] text-[var(--text-secondary)] truncate">
            · {activeTagsLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-[var(--text-secondary)]">
          <span className="text-[10px] hidden sm:inline truncate max-w-[105px]">
            {activeProfile.styleName.split('・')[0]}
          </span>
          {collapsed ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-3.5 pt-1 space-y-3">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
            <span className="truncate">
              本章：《{chapterTitle || '未命名章節'}》
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...current,
                  autoTypography: !current.autoTypography,
                })
              }
              className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium cursor-pointer transition-colors shrink-0 ${
                current.autoTypography
                  ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/15 text-[var(--text-primary)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
              }`}
              title="切換是否根據感官標記自動調整正文與標題字體風格"
            >
              <TypeIcon className="h-3 w-3" />
              {current.autoTypography ? '自動字體：開' : '鎖定標準宋體'}
            </button>
          </div>

          {/* Sensory Tag Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {ORDERED_TAGS.map((tag) => {
              const meta = SENSORY_TAG_META[tag];
              const isActive = current.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  title={meta.description}
                  className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? meta.activeClass
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                      isActive ? 'bg-stone-100' : meta.dotClass
                    }`}
                  />
                  {meta.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Dual Intensity Sliders */}
          <div className="space-y-2 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                  <Flame className="h-3 w-3 text-rose-500" />
                  情慾官能張力
                </span>
                <span className="font-mono-num text-[var(--text-secondary)]">
                  {current.sensualIntensity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                aria-label="情慾官能張力強度"
                value={current.sensualIntensity}
                onChange={(e) =>
                  handleIntensityChange(
                    'sensualIntensity',
                    Number(e.target.value)
                  )
                }
                className="w-full h-1.5 accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1 pt-1 border-t border-[var(--border-hairline)]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-[var(--text-primary)]">
                  <Swords className="h-3 w-3 text-red-500" />
                  暴力與壓迫衝擊
                </span>
                <span className="font-mono-num text-[var(--text-secondary)]">
                  {current.violenceIntensity}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                aria-label="暴力與壓迫衝擊強度"
                value={current.violenceIntensity}
                onChange={(e) =>
                  handleIntensityChange(
                    'violenceIntensity',
                    Number(e.target.value)
                  )
                }
                className="w-full h-1.5 accent-red-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Live Typography Preview Card */}
          <div
            className={`rounded-md border border-[var(--border-hairline)] border-l-[3px] ${activeProfile.accentBorderClass} bg-[var(--bg-canvas)] px-3 py-2 space-y-1 transition-all`}
          >
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-medium text-[var(--text-primary)] truncate">
                {activeProfile.styleName}
              </span>
              <span className="font-mono-num text-[10px] text-[var(--text-secondary)] shrink-0">
                {activeProfile.fontSizePx}px · 行距 {activeProfile.lineHeight}
              </span>
            </div>
            <p
              className={`${activeProfile.proseClassName} !text-xs text-[var(--text-secondary)] truncate`}
            >
              {activeProfile.sampleLine}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
