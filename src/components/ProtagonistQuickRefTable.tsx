import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, ShieldAlert, Users } from 'lucide-react';
import {
  FAMILIARITY_META,
  RELATIONSHIP_TYPE_META,
  type FamiliarityLevel,
  type Protagonist,
  type RelationshipEdge,
  type StoryBranch,
  type SupportingCharacter,
} from '../types/story';
import {
  getEffectiveFamiliarity,
  getSupportingStatusForBranch,
} from '../utils/familiarity';

interface ProtagonistQuickRefTableProps {
  protagonist: Protagonist;
  allProtagonists: Protagonist[];
  supportingCharacters: SupportingCharacter[];
  edges: RelationshipEdge[];
  branches: StoryBranch[];
  activeBranchId?: string;
  variant?: 'full' | 'compact';
  onUpdateProtagonist: (id: string, patch: Partial<Protagonist>) => void;
  onUpdateSupportingCharacter: (
    id: string,
    patch: Partial<SupportingCharacter>
  ) => void;
}

type QuickFilter = 'all' | 'own_background' | 'unfamiliar' | 'familiar';

export const ProtagonistQuickRefTable: React.FC<
  ProtagonistQuickRefTableProps
> = ({
  protagonist,
  allProtagonists,
  supportingCharacters,
  edges,
  branches,
  activeBranchId = 'main',
  variant = 'full',
  onUpdateProtagonist,
  onUpdateSupportingCharacter,
}) => {
  const [selectedBranchId, setSelectedBranchId] =
    useState<string>(activeBranchId);
  const [filterMode, setFilterMode] = useState<QuickFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentBranchId =
    variant === 'compact' ? activeBranchId : selectedBranchId;
  const currentBranch = branches.find((b) => b.id === currentBranchId);

  const rows = useMemo(() => {
    const findEdgeBetween = (otherId: string): RelationshipEdge | undefined =>
      edges.find(
        (e) =>
          (e.sourceId === protagonist.id && e.targetId === otherId) ||
          (e.targetId === protagonist.id && e.sourceId === otherId)
      );

    const otherProtagonists = allProtagonists
      .filter((p) => p.id !== protagonist.id)
      .map((p) => {
        const edge = findEdgeBetween(p.id);
        const edgeLabel = edge
          ? edge.type === 'custom' && edge.customLabel
            ? edge.customLabel
            : RELATIONSHIP_TYPE_META[edge.type]?.label
          : null;
        const familiarity = getEffectiveFamiliarity(
          protagonist,
          p.id,
          supportingCharacters,
          edges
        );
        return {
          kind: 'protagonist' as const,
          id: p.id,
          name: p.name,
          rankOrRole: p.alias || p.role,
          accentColor: p.accentColor,
          isOwnBackground: false,
          ownerName: '其他主角',
          familiarity,
          relationshipNote:
            edge?.description || p.relationships || '尚未於關係網設定描述',
          edgeTypeLabel: edgeLabel,
          specialty: p.coreTraits,
          currentStatus: p.surfacePersona,
          isBranchOverride: false,
        };
      });

    const supRows = supportingCharacters.map((sup) => {
      const edge = findEdgeBetween(sup.id);
      const edgeLabel = edge
        ? edge.type === 'custom' && edge.customLabel
          ? edge.customLabel
          : RELATIONSHIP_TYPE_META[edge.type]?.label
        : null;
      const familiarity = getEffectiveFamiliarity(
        protagonist,
        sup.id,
        supportingCharacters,
        edges
      );
      const { status, isBranchOverride } = getSupportingStatusForBranch(
        sup,
        currentBranchId
      );
      const ownerName =
        allProtagonists.find((c) => c.id === sup.linkedProtagonistId)?.name ||
        '全局背景';

      return {
        kind: 'supporting' as const,
        sup,
        id: sup.id,
        name: sup.name,
        rankOrRole: sup.titleOrRank,
        accentColor: sup.accentColor || '#64748B',
        isOwnBackground: sup.linkedProtagonistId === protagonist.id,
        ownerName,
        familiarity,
        relationshipNote:
          edge?.description ||
          sup.relationshipToProtagonist ||
          '尚未填寫互動關係',
        edgeTypeLabel: edgeLabel,
        specialty: sup.specialtyOrRole,
        currentStatus: status,
        isBranchOverride,
      };
    });

    const combined = [...supRows, ...otherProtagonists];

    return combined.filter((row) => {
      if (filterMode === 'own_background' && !row.isOwnBackground) return false;
      if (
        filterMode === 'unfamiliar' &&
        row.familiarity !== 'stranger' &&
        row.familiarity !== 'heard_of' &&
        row.familiarity !== 'acquaintance'
      ) {
        return false;
      }
      if (
        filterMode === 'familiar' &&
        row.familiarity !== 'familiar' &&
        row.familiarity !== 'intimate'
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = `${row.name} ${row.rankOrRole} ${row.relationshipNote} ${row.specialty} ${row.currentStatus}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    protagonist,
    allProtagonists,
    supportingCharacters,
    edges,
    currentBranchId,
    filterMode,
    searchQuery,
  ]);

  const handleSetFamiliarity = (targetId: string, level: FamiliarityLevel) => {
    onUpdateProtagonist(protagonist.id, {
      characterFamiliarity: {
        ...(protagonist.characterFamiliarity || {}),
        [targetId]: level,
      },
    });
  };

  const handleUpdateStatus = (sup: SupportingCharacter, nextStatus: string) => {
    if (currentBranchId === 'main') {
      onUpdateSupportingCharacter(sup.id, { currentStatus: nextStatus });
    } else {
      onUpdateSupportingCharacter(sup.id, {
        branchStatusMap: {
          ...(sup.branchStatusMap || {}),
          [currentBranchId]: nextStatus,
        },
      });
    }
  };

  const handleResetBranchStatus = (sup: SupportingCharacter) => {
    const nextMap = { ...(sup.branchStatusMap || {}) };
    delete nextMap[currentBranchId];
    onUpdateSupportingCharacter(sup.id, { branchStatusMap: nextMap });
  };

  const unfamiliarCount = useMemo(() => {
    const allTargets = [
      ...supportingCharacters.map((s) => s.id),
      ...allProtagonists
        .filter((p) => p.id !== protagonist.id)
        .map((p) => p.id),
    ];
    return allTargets.filter((id) => {
      const f = getEffectiveFamiliarity(
        protagonist,
        id,
        supportingCharacters,
        edges
      );
      return f === 'stranger' || f === 'heard_of' || f === 'acquaintance';
    }).length;
  }, [protagonist, allProtagonists, supportingCharacters, edges]);

  if (variant === 'compact') {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="space-y-1.5 pb-2 border-b border-[var(--border-hairline)]">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
              <Users className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              {protagonist.name}・關聯人物速查表
            </span>
            <span className="text-[11px] font-mono-num text-[var(--text-secondary)]">
              {rows.length} 位人物
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            AI 寫作會嚴格遵守此表的「熟悉度邊界」：標為素未謀面或僅聞其名者，絕不會誤寫成老熟人。
          </p>
          <div className="relative pt-1">
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)] absolute left-2.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋配角名字、專長或狀態……"
              className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pl-8 pr-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
            />
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {(
              [
                { id: 'all', label: '全部' },
                { id: 'unfamiliar', label: `不熟／陌生 (${unfamiliarCount})` },
                { id: 'familiar', label: '熟識／至親' },
              ] as { id: QuickFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-2 py-1 rounded text-[11px] cursor-pointer transition-colors whitespace-nowrap ${
                  filterMode === tab.id
                    ? 'bg-[var(--accent-primary)] text-stone-100'
                    : 'bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)] py-6 text-center">
            沒有符合條件的關聯人物。
          </p>
        ) : (
          <div className="space-y-2.5">
            {rows.map((row) => {
              const famMeta = FAMILIARITY_META[row.familiarity];
              return (
                <div
                  key={row.id}
                  className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-2.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0"
                          style={{ backgroundColor: row.accentColor }}
                        />
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {row.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate">
                        {row.rankOrRole}
                      </p>
                    </div>
                    <select
                      aria-label={`${row.name} 對 ${protagonist.name} 的熟悉度`}
                      value={row.familiarity}
                      onChange={(e) =>
                        handleSetFamiliarity(
                          row.id,
                          e.target.value as FamiliarityLevel
                        )
                      }
                      className={`shrink-0 rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-[11px] font-medium cursor-pointer focus:outline-none ${famMeta.toneClass}`}
                    >
                      {Object.entries(FAMILIARITY_META).map(([k, m]) => (
                        <option key={k} value={k}>
                          {m.shortLabel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                    {row.edgeTypeLabel ? `[${row.edgeTypeLabel}] ` : ''}
                    {row.relationshipNote}
                  </p>

                  {row.kind === 'supporting' && (
                    <div className="pt-1 border-t border-[var(--border-hairline)]/60 flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                        {currentBranch?.code || 'MAIN'} 狀態:
                      </span>
                      <input
                        type="text"
                        value={row.currentStatus}
                        onChange={(e) =>
                          handleUpdateStatus(row.sup, e.target.value)
                        }
                        className="flex-1 min-w-0 bg-transparent text-[11px] text-[var(--text-primary)] focus:outline-none focus:underline"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-[var(--border-hairline)] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <ShieldAlert className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            <span>
              熟悉度與平行世界狀態速查 · 共 {rows.length} 位人物（其中{' '}
              {unfamiliarCount} 位屬不熟或陌生邊界）
            </span>
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] mt-1">
            {protagonist.name} 的關聯人物速查表
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            明確設定「{protagonist.name}」對每位家族配角與他角的認識程度，防止 AI 寫作時誤將陌生人或僅見過一面的角色當成老熟人。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="檢視特定平行結局分支的配角狀態"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] cursor-pointer focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                狀態路線：[{b.code}] {b.title}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)] absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋名字、專長或狀態……"
              className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] w-48"
            />
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: 'all', label: '全部關聯人物' },
            {
              id: 'own_background',
              label: `專屬背景人物（歸屬 ${protagonist.name}）`,
            },
            { id: 'unfamiliar', label: '素未謀面 / 認識但不熟' },
            { id: 'familiar', label: '熟悉 / 至親密契' },
          ] as { id: QuickFilter; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterMode(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
              filterMode === tab.id
                ? 'bg-[var(--accent-primary)] text-stone-100'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Reference Table */}
      <div className="overflow-x-auto rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)]/60 text-[11px] font-medium text-[var(--text-secondary)]">
              <th className="py-2.5 px-3.5 w-[190px]">名字與排行定位</th>
              <th className="py-2.5 px-3 w-[175px]">
                對「{protagonist.name}」的熟悉度
              </th>
              <th className="py-2.5 px-3">關係定義與背景專長</th>
              <th className="py-2.5 px-3.5 w-[250px]">
                當前狀態（{currentBranch?.code || 'MAIN'} 線）
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-hairline)] text-xs">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-xs text-[var(--text-secondary)]"
                >
                  目前沒有符合篩選條件的關聯人物。可於下方「家族成員與背後配角群像」新增人物。
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const famMeta = FAMILIARITY_META[row.familiarity];
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--bg-surface)]/70 transition-colors align-top"
                  >
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0"
                          style={{ backgroundColor: row.accentColor }}
                        />
                        <span className="font-semibold text-[var(--text-primary)]">
                          {row.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {row.rankOrRole}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)]/80 mt-0.5">
                        {row.kind === 'protagonist'
                          ? '主要視角人物'
                          : `背景歸屬：${row.ownerName}`}
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        aria-label={`${row.name} 的熟悉度`}
                        value={row.familiarity}
                        onChange={(e) =>
                          handleSetFamiliarity(
                            row.id,
                            e.target.value as FamiliarityLevel
                          )
                        }
                        className={`w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium cursor-pointer focus:outline-none ${famMeta.toneClass}`}
                      >
                        {Object.entries(FAMILIARITY_META).map(([k, m]) => (
                          <option key={k} value={k}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[10px] text-[var(--text-secondary)] leading-snug">
                        {row.familiarity === 'stranger'
                          ? 'AI 嚴禁直呼姓名或裝熟'
                          : row.familiarity === 'heard_of'
                            ? '僅知傳聞，見面須試探'
                            : row.familiarity === 'acquaintance'
                              ? '保留社交距離與戒備'
                              : row.familiarity === 'familiar'
                                ? '自然互動相處'
                                : '無話不談／溺愛默契'}
                      </p>
                    </td>

                    <td className="py-3 px-3 space-y-1">
                      <p className="text-[var(--text-primary)] leading-relaxed">
                        {row.edgeTypeLabel && (
                          <span className="font-medium text-[var(--accent-primary)] mr-1">
                            [{row.edgeTypeLabel}]
                          </span>
                        )}
                        {row.relationshipNote}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        專長／特質：{row.specialty}
                      </p>
                    </td>

                    <td className="py-3 px-3.5">
                      {row.kind === 'supporting' ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={row.currentStatus}
                              onChange={(e) =>
                                handleUpdateStatus(row.sup, e.target.value)
                              }
                              placeholder="輸入該配角目前位置或狀態……"
                              className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                            />
                            {row.isBranchOverride &&
                              currentBranchId !== 'main' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleResetBranchStatus(row.sup)
                                  }
                                  title="恢復與主線相同的預設狀態"
                                  className="p-1.5 rounded border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </button>
                              )}
                          </div>
                          {currentBranchId !== 'main' && (
                            <p className="text-[10px] text-[var(--text-secondary)]">
                              {row.isBranchOverride
                                ? `已寫入「${currentBranch?.code}」分支獨立狀態`
                                : '沿用主線狀態（直接修改即可為此分支獨立紀錄）'}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {row.currentStatus}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
