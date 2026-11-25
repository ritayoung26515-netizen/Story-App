import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  GitCommitHorizontal,
  LayoutGrid,
  Link2,
  Trash2,
} from 'lucide-react';
import {
  RELATIONSHIP_TYPE_META,
  type Protagonist,
  type RelationshipEdge,
  type RelationshipType,
  type SupportingCharacter,
} from '../types/story';

interface GraphNode {
  id: string;
  name: string;
  subtitle: string;
  isProtagonist: boolean;
  linkedProtagonistId?: string;
  accentColor: string;
}

interface RelationshipGraphProps {
  protagonists: Protagonist[];
  supportingCharacters: SupportingCharacter[];
  edges: RelationshipEdge[];
  nodePositions: Record<string, { x: number; y: number }>;
  onUpdateNodePosition: (id: string, pos: { x: number; y: number }) => void;
  onBatchUpdatePositions: (
    positions: Record<string, { x: number; y: number }>
  ) => void;
  onAddEdge: (edge: RelationshipEdge) => void;
  onUpdateEdge: (edgeId: string, patch: Partial<RelationshipEdge>) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const CANVAS_WIDTH = 880;
const CANVAS_HEIGHT = 540;

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  protagonists,
  supportingCharacters,
  edges,
  nodePositions,
  onUpdateNodePosition,
  onBatchUpdatePositions,
  onAddEdge,
  onUpdateEdge,
  onDeleteEdge,
}) => {
  const [filterScope, setFilterScope] = useState<string>('all');
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(
    edges[0]?.id || null
  );
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const allNodes: GraphNode[] = useMemo(() => {
    const mainNodes: GraphNode[] = protagonists.map((p) => ({
      id: p.id,
      name: p.name,
      subtitle: p.alias || '主角',
      isProtagonist: true,
      accentColor: p.accentColor,
    }));
    const subNodes: GraphNode[] = supportingCharacters.map((s) => ({
      id: s.id,
      name: s.name,
      subtitle: s.titleOrRank,
      isProtagonist: false,
      linkedProtagonistId: s.linkedProtagonistId,
      accentColor: s.accentColor || '#64748B',
    }));
    return [...mainNodes, ...subNodes];
  }, [protagonists, supportingCharacters]);

  const visibleNodes = useMemo(() => {
    if (filterScope === 'all') return allNodes;
    if (filterScope === 'protagonists_only') {
      return allNodes.filter((n) => n.isProtagonist);
    }
    // Filter by specific protagonist's circle
    const connectedIds = new Set<string>([filterScope]);
    edges.forEach((e) => {
      if (e.sourceId === filterScope) connectedIds.add(e.targetId);
      if (e.targetId === filterScope) connectedIds.add(e.sourceId);
    });
    return allNodes.filter(
      (n) =>
        n.isProtagonist ||
        n.linkedProtagonistId === filterScope ||
        connectedIds.has(n.id)
    );
  }, [allNodes, filterScope, edges]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (e) => visibleNodeIds.has(e.sourceId) && visibleNodeIds.has(e.targetId)
      ),
    [edges, visibleNodeIds]
  );

  const getPos = (nodeId: string, index: number): { x: number; y: number } => {
    const saved = nodePositions[nodeId];
    if (saved) return saved;
    const angle = (index / Math.max(1, visibleNodes.length)) * Math.PI * 2;
    return {
      x: Math.round(CANVAS_WIDTH / 2 + Math.cos(angle) * 210),
      y: Math.round(CANVAS_HEIGHT / 2 + Math.sin(angle) * 180),
    };
  };

  const handleAutoArrange = () => {
    const next: Record<string, { x: number; y: number }> = { ...nodePositions };
    const mainList = visibleNodes.filter((n) => n.isProtagonist);
    const subList = visibleNodes.filter((n) => !n.isProtagonist);

    mainList.forEach((n, idx) => {
      if (mainList.length === 1) {
        next[n.id] = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
      } else {
        const angle = (idx / mainList.length) * Math.PI * 2 - Math.PI / 2;
        const radius = subList.length > 0 ? 110 : 165;
        next[n.id] = {
          x: Math.round(CANVAS_WIDTH / 2 + Math.cos(angle) * radius),
          y: Math.round(CANVAS_HEIGHT / 2 + Math.sin(angle) * radius),
        };
      }
    });

    subList.forEach((n, idx) => {
      const angle = (idx / Math.max(1, subList.length)) * Math.PI * 2;
      next[n.id] = {
        x: Math.round(CANVAS_WIDTH / 2 + Math.cos(angle) * 305),
        y: Math.round(CANVAS_HEIGHT / 2 + Math.sin(angle) * 215),
      };
    });

    onBatchUpdatePositions(next);
  };

  const handleNodePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string,
    currentPos: { x: number; y: number }
  ) => {
    if (isDrawMode || connectSourceId) {
      e.stopPropagation();
      if (!connectSourceId) {
        setConnectSourceId(nodeId);
      } else if (connectSourceId === nodeId) {
        setConnectSourceId(null);
      } else {
        const newEdge: RelationshipEdge = {
          id: `rel_${Date.now()}`,
          sourceId: connectSourceId,
          targetId: nodeId,
          type: 'ambiguous',
          bidirectional: true,
          description: '寫下兩人在各平行世界中的互動準則、秘密或張力……',
        };
        onAddEdge(newEdge);
        setSelectedEdgeId(newEdge.id);
        setConnectSourceId(null);
        setIsDrawMode(false);
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDraggingNodeId(nodeId);
    dragOffsetRef.current = {
      dx: e.clientX - rect.left - currentPos.x,
      dy: e.clientY - rect.top - currentPos.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (
    e: React.PointerEvent<HTMLDivElement>,
    nodeId: string
  ) => {
    if (draggingNodeId !== nodeId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(
      64,
      Math.min(
        rect.width - 64,
        Math.round(e.clientX - rect.left - dragOffsetRef.current.dx)
      )
    );
    const y = Math.max(
      34,
      Math.min(
        rect.height - 34,
        Math.round(e.clientY - rect.top - dragOffsetRef.current.dy)
      )
    );
    onUpdateNodePosition(nodeId, { x, y });
  };

  const handleNodePointerUp = () => {
    setDraggingNodeId(null);
  };

  const selectedEdge = edges.find((e) => e.id === selectedEdgeId) || null;
  const sourceNode = selectedEdge
    ? allNodes.find((n) => n.id === selectedEdge.sourceId)
    : null;
  const targetNode = selectedEdge
    ? allNodes.find((n) => n.id === selectedEdge.targetId)
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsDrawMode((v) => !v);
              setConnectSourceId(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
              isDrawMode || connectSourceId
                ? 'bg-[var(--accent-primary)] text-stone-100'
                : 'border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            {connectSourceId
              ? `已選起點「${allNodes.find((n) => n.id === connectSourceId)?.name}」，請點擊目標角色`
              : isDrawMode
                ? '連線模式開啟中（點擊起點角色）'
                : '繪製角色連線'}
          </button>

          <button
            type="button"
            onClick={handleAutoArrange}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] hover:border-[var(--accent-primary)] cursor-pointer"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            環狀自動排列
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="篩選關係網顯示範圍"
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">顯示全部角色（主角 + 配角共 {allNodes.length} 位）</option>
            <option value="protagonists_only">
              僅顯示主角（{protagonists.length} 位）
            </option>
            {protagonists.map((p) => (
              <option key={p.id} value={p.id}>
                聚焦：{p.name} 的人物關係網
              </option>
            ))}
          </select>
          <span className="text-xs font-mono-num text-[var(--text-secondary)]">
            {visibleEdges.length} 條關係線
          </span>
        </div>
      </div>

      {/* Main Split: Interactive Canvas + Edge Description Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Interactive Canvas */}
        <div
          ref={canvasRef}
          className="xl:col-span-8 relative h-[540px] w-full overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] select-none"
        >
          <div className="relative h-full min-w-[880px]">
            {/* SVG Edges Layer */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <defs>
                {Object.entries(RELATIONSHIP_TYPE_META).map(([typeKey, meta]) => (
                  <marker
                    key={typeKey}
                    id={`arrow-${typeKey}`}
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={meta.color} />
                  </marker>
                ))}
              </defs>

              {visibleEdges.map((edge) => {
                const sIdx = visibleNodes.findIndex(
                  (n) => n.id === edge.sourceId
                );
                const tIdx = visibleNodes.findIndex(
                  (n) => n.id === edge.targetId
                );
                if (sIdx === -1 || tIdx === -1) return null;
                const p1 = getPos(edge.sourceId, sIdx);
                const p2 = getPos(edge.targetId, tIdx);
                const isSelected = selectedEdgeId === edge.id;
                const meta =
                  RELATIONSHIP_TYPE_META[edge.type] ||
                  RELATIONSHIP_TYPE_META.custom;
                const label =
                  edge.type === 'custom' && edge.customLabel
                    ? edge.customLabel
                    : meta.label;

                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                return (
                  <g
                    key={edge.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Wide invisible hit target for easy clicking */}
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="transparent"
                      strokeWidth={18}
                    />
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={meta.color}
                      strokeWidth={isSelected ? 3 : 1.75}
                      strokeOpacity={isSelected ? 1 : 0.65}
                      strokeDasharray={
                        edge.type === 'hostile' ? '5 3' : undefined
                      }
                      markerEnd={
                        !edge.bidirectional
                          ? `url(#arrow-${edge.type})`
                          : undefined
                      }
                    />
                    <rect
                      x={midX - 28}
                      y={midY - 10}
                      width={56}
                      height={20}
                      rx={4}
                      fill="var(--bg-elevated)"
                      stroke={isSelected ? meta.color : 'var(--border-hairline)'}
                      strokeWidth={1}
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={isSelected ? 600 : 500}
                      fill="var(--text-primary)"
                    >
                      {label.slice(0, 5)}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Draggable Character Nodes */}
            {visibleNodes.map((node, idx) => {
              const pos = getPos(node.id, idx);
              const isSource = connectSourceId === node.id;

              return (
                <div
                  key={node.id}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id, pos)}
                  onPointerMove={(e) => handleNodePointerMove(e, node.id)}
                  onPointerUp={handleNodePointerUp}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute rounded-md border px-3 py-2 shadow-sm transition-shadow ${
                    isDrawMode || connectSourceId
                      ? 'cursor-crosshair'
                      : 'cursor-grab active:cursor-grabbing'
                  } ${
                    isSource
                      ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/40 bg-[var(--bg-elevated)]'
                      : node.isProtagonist
                        ? 'border-[var(--text-secondary)]/40 bg-[var(--bg-elevated)] min-w-[120px]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] min-w-[104px]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0"
                      style={{ backgroundColor: node.accentColor }}
                    />
                    <span className="text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {node.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] whitespace-nowrap">
                      {node.isProtagonist ? '主角' : '配角'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-[var(--text-secondary)] max-w-[130px] truncate">
                    {node.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Inspector: Edit Clicked Edge Description */}
        <div className="xl:col-span-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-5 flex flex-col justify-between space-y-4">
          {selectedEdge && sourceNode && targetNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-3">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-primary)]">
                  <span>{sourceNode.name}</span>
                  {selectedEdge.bidirectional ? (
                    <ArrowLeftRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  )}
                  <span>{targetNode.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteEdge(selectedEdge.id);
                    setSelectedEdgeId(null);
                  }}
                  title="刪除此關係連線"
                  className="p-1 text-[var(--text-secondary)] hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-[var(--text-secondary)]">
                  關係性質標籤
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(RELATIONSHIP_TYPE_META).map(
                    ([typeKey, meta]) => {
                      const active = selectedEdge.type === typeKey;
                      return (
                        <button
                          key={typeKey}
                          type="button"
                          onClick={() =>
                            onUpdateEdge(selectedEdge.id, {
                              type: typeKey as RelationshipType,
                            })
                          }
                          className={`flex items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                            active
                              ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium'
                              : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <span
                            className="h-2 w-2 shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span className="truncate">{meta.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {selectedEdge.type === 'custom' && (
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    自訂關係名稱
                  </label>
                  <input
                    type="text"
                    value={selectedEdge.customLabel || ''}
                    onChange={(e) =>
                      onUpdateEdge(selectedEdge.id, {
                        customLabel: e.target.value,
                      })
                    }
                    placeholder="例如：主僕、青梅竹馬、交易對象"
                    className="w-full rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs">
                <span className="text-[var(--text-secondary)]">關係方向性</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateEdge(selectedEdge.id, {
                      bidirectional: !selectedEdge.bidirectional,
                    })
                  }
                  className="text-[var(--text-primary)] font-medium underline underline-offset-4 cursor-pointer"
                >
                  {selectedEdge.bidirectional
                    ? '雙向互動關係'
                    : `${sourceNode.name} → ${targetNode.name} 單向`}
                </button>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                  詳細關係描述（多結局互動一致性依據）
                </label>
                <textarea
                  rows={6}
                  value={selectedEdge.description}
                  onChange={(e) =>
                    onUpdateEdge(selectedEdge.id, {
                      description: e.target.value,
                    })
                  }
                  placeholder="說明兩人如何稱呼彼此、相處底線、過往羈絆或衝突原因……"
                  className="w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2 text-xs leading-relaxed text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 space-y-2">
              <GitCommitHorizontal className="h-6 w-6 text-[var(--text-secondary)]" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                點擊任一條關係連線
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-[240px]">
                可拖曳節點位置、點擊「繪製角色連線」新增關係，或點擊畫布上的連線來編寫詳細互動描述。
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--border-hairline)] text-[11px] text-[var(--text-secondary)] leading-relaxed">
            提示：關係網所有連線與描述皆會自動帶入 AI 寫作與相致性審查，確保 20 條平行結局中的互動不走形。
          </div>
        </div>
      </div>
    </div>
  );
};
