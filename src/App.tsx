import { useEffect, useMemo, useState } from 'react';
import { TopBar, type WorkspaceTab } from './components/TopBar';
import { WritingStudio } from './components/WritingStudio';
import { CastAndWorldView } from './components/CastAndWorldView';
import { MemoryVaultView } from './components/MemoryVaultView';
import { ProgressTrackerView } from './components/ProgressTrackerView';
import { ExportModal } from './components/ExportModal';
import {
  FloatingInstallPrompt,
  OfflineIndicator,
} from './components/PWAInstallBanner';
import {
  createBlankProject,
  createLengyeEmmaProject,
  createStarterProject,
  LENGYE_TWELVE_BROTHERS_PRESET,
} from './data/starterProject';
import {
  MAX_PROTAGONISTS,
  type Chapter,
  type ContentSettings,
  type MemoryEntry,
  type Protagonist,
  type RelationshipEdge,
  type StoryBranch,
  type StoryProject,
  type SupportingCharacter,
  type WorldSettings,
} from './types/story';
import {
  getChaptersForBranchRoute,
  hasSeededLengyeProject,
  hasUpgradedLengyeCastV2,
  loadActiveProjectId,
  loadProjects,
  loadThemePreference,
  markLengyeCastV2Upgraded,
  markLengyeProjectSeeded,
  saveActiveProjectId,
  saveProjects,
  saveThemePreference,
} from './utils/storage';

function initializeProjectsAndSelection(): {
  initialProjects: StoryProject[];
  initialActiveId: string;
} {
  const existing = loadProjects();
  const alreadySeeded = hasSeededLengyeProject();
  const alreadyUpgradedV2 = hasUpgradedLengyeCastV2();

  if (existing.length === 0) {
    const lengye = createLengyeEmmaProject();
    const tide = createStarterProject();
    markLengyeProjectSeeded();
    markLengyeCastV2Upgraded();
    return {
      initialProjects: [lengye, tide],
      initialActiveId: lengye.id,
    };
  }

  let workingProjects = existing;

  if (!alreadySeeded && !workingProjects.some((p) => p.id === 'proj_lengye_emma')) {
    const lengye = createLengyeEmmaProject();
    markLengyeProjectSeeded();
    markLengyeCastV2Upgraded();
    return {
      initialProjects: [lengye, ...workingProjects],
      initialActiveId: lengye.id,
    };
  }

  // Upgrade existing proj_lengye_emma once with updated Ash (Yan Chen) + Ray Fok + Kelvin Luk + Ann Shum
  if (!alreadyUpgradedV2) {
    const freshTemplate = createLengyeEmmaProject();
    workingProjects = workingProjects.map((proj) => {
      if (proj.id !== 'proj_lengye_emma') return proj;

      const updatedChars = proj.characters.map((c) => {
        if (c.id === 'char_yanchen') {
          const freshYan = freshTemplate.characters.find(
            (fc) => fc.id === 'char_yanchen'
          );
          return freshYan
            ? {
                ...freshYan,
                characterFamiliarity: {
                  ...(c.characterFamiliarity || {}),
                  ...freshYan.characterFamiliarity,
                },
              }
            : c;
        }
        if (c.id === 'char_emma') {
          const freshEmma = freshTemplate.characters.find(
            (fc) => fc.id === 'char_emma'
          );
          return freshEmma
            ? {
                ...c,
                characterFamiliarity: {
                  ...(c.characterFamiliarity || {}),
                  ...freshEmma.characterFamiliarity,
                },
              }
            : c;
        }
        return c;
      });

      const existingCharIds = new Set(updatedChars.map((c) => c.id));
      const newProtagonists = freshTemplate.characters.filter(
        (fc) =>
          !existingCharIds.has(fc.id) &&
          updatedChars.length +
            freshTemplate.characters.filter((x) => !existingCharIds.has(x.id))
              .indexOf(fc) <
            MAX_PROTAGONISTS
      );

      const existingEdgeIds = new Set(proj.relationshipEdges.map((e) => e.id));
      const newEdges = freshTemplate.relationshipEdges.filter(
        (e) => !existingEdgeIds.has(e.id)
      );

      return {
        ...proj,
        characters: [...updatedChars, ...newProtagonists].slice(
          0,
          MAX_PROTAGONISTS
        ),
        relationshipEdges: [...proj.relationshipEdges, ...newEdges],
        nodePositions: {
          ...freshTemplate.nodePositions,
          ...proj.nodePositions,
        },
      };
    });
    markLengyeCastV2Upgraded();
  }

  const savedId = loadActiveProjectId();
  const activeId =
    savedId && workingProjects.some((p) => p.id === savedId)
      ? savedId
      : workingProjects[0].id;
  return {
    initialProjects: workingProjects,
    initialActiveId: activeId,
  };
}

export default function App() {
  const [{ initialProjects, initialActiveId }] = useState(() =>
    initializeProjectsAndSelection()
  );

  const [projects, setProjects] = useState<StoryProject[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] =
    useState<string>(initialActiveId);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    loadThemePreference()
  );
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  const [activeBranchId, setActiveBranchId] = useState<string>(
    () => activeProject?.branches[0]?.id || 'main'
  );

  const [activeChapterId, setActiveChapterId] = useState<string>(
    () => activeProject?.chapters[0]?.id || ''
  );

  useEffect(() => {
    if (!activeProject) return;
    const branchExists = activeProject.branches.some(
      (b) => b.id === activeBranchId
    );
    if (!branchExists) {
      setActiveBranchId(activeProject.branches[0]?.id || 'main');
    }
  }, [activeProject, activeBranchId]);

  useEffect(() => {
    if (!activeProject) return;
    const exists = activeProject.chapters.some((c) => c.id === activeChapterId);
    if (!exists) {
      const route = getChaptersForBranchRoute(activeProject, activeBranchId);
      setActiveChapterId(
        route[0]?.id || activeProject.chapters[0]?.id || ''
      );
    }
  }, [activeProject, activeBranchId, activeChapterId]);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    if (activeProject?.id) {
      saveActiveProjectId(activeProject.id);
    }
  }, [activeProject?.id]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemePreference(theme);
  }, [theme]);

  const mutateActiveProject = (
    updater: (project: StoryProject) => StoryProject
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== activeProject.id) return p;
        return {
          ...updater(p),
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    const route = getChaptersForBranchRoute(activeProject, branchId);
    const ownChapter = route.find((c) => c.branchId === branchId);
    const fallback = ownChapter || route[route.length - 1];
    if (fallback) {
      setActiveChapterId(fallback.id);
    }
  };

  const handleAddBranch = (branch: StoryBranch) => {
    mutateActiveProject((p) => ({
      ...p,
      branches: [...p.branches, branch],
    }));
    setActiveBranchId(branch.id);
  };

  const handleUpdateBranch = (
    branchId: string,
    patch: Partial<StoryBranch>
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      branches: p.branches.map((b) =>
        b.id === branchId ? { ...b, ...patch } : b
      ),
    }));
  };

  const handleDeleteBranch = (branchId: string) => {
    if (branchId === 'main') return;
    mutateActiveProject((p) => ({
      ...p,
      branches: p.branches.filter((b) => b.id !== branchId),
      chapters: p.chapters.map((ch) =>
        ch.branchId === branchId ? { ...ch, branchId: 'main' } : ch
      ),
      memories: p.memories.map((m) =>
        m.branchId === branchId ? { ...m, branchId: 'main' } : m
      ),
    }));
    if (activeBranchId === branchId) {
      setActiveBranchId('main');
    }
  };

  const handleAddChapter = (targetBranchId?: string) => {
    const branchId = targetBranchId || activeBranchId || 'main';
    const branchObj = activeProject.branches.find((b) => b.id === branchId);
    const routeChapters = getChaptersForBranchRoute(activeProject, branchId);
    const prevChapter = routeChapters[routeChapters.length - 1];
    const maxOrder = routeChapters.reduce(
      (max, c) => Math.max(max, c.timelineOrder),
      branchObj?.forkTimelineOrder || 0
    );
    const nextNumber = activeProject.chapters.length + 1;
    const defaultPov = activeProject.characters[0]?.id || 'omniscient';

    const newChapter: Chapter = {
      id: `ch_${Date.now()}`,
      number: nextNumber,
      timelineOrder: maxOrder + 10,
      timelineLabel: `時序 ${maxOrder + 10}`,
      branchId,
      dungeonId:
        activeProject.world.mode === 'game_dungeon'
          ? prevChapter?.dungeonId
          : undefined,
      // Inherit score state from previous chapter on the same route so score is never forgotten!
      dungeonScore: prevChapter?.dungeonScore
        ? {
            currentScore: prevChapter.dungeonScore.currentScore,
            targetClearScore: prevChapter.dungeonScore.targetClearScore,
            sanOrHp: prevChapter.dungeonScore.sanOrHp,
            scoreLog: [...prevChapter.dungeonScore.scoreLog],
          }
        : {
            currentScore: 0,
            targetClearScore: 500,
            sanOrHp: 'SAN 100 / 正常',
            scoreLog: [],
          },
      actTitle: branchObj ? `${branchObj.code} ${branchObj.title}` : '共同主線',
      title: `第 ${nextNumber} 章未命名`,
      povCharacterId: defaultPov,
      status: 'outline',
      targetWords: 2500,
      summary: '',
      beats: [],
      content: '',
      updatedAt: new Date().toISOString(),
    };

    mutateActiveProject((p) => ({
      ...p,
      chapters: [...p.chapters, newChapter],
    }));
    setActiveChapterId(newChapter.id);
  };

  const handleUpdateChapter = (chapterId: string, patch: Partial<Chapter>) => {
    mutateActiveProject((p) => ({
      ...p,
      chapters: p.chapters.map((ch) =>
        ch.id === chapterId
          ? { ...ch, ...patch, updatedAt: new Date().toISOString() }
          : ch
      ),
    }));
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (activeProject.chapters.length <= 1) return;
    mutateActiveProject((p) => {
      const remaining = p.chapters
        .filter((ch) => ch.id !== chapterId)
        .map((ch, idx) => ({ ...ch, number: idx + 1 }));
      return { ...p, chapters: remaining };
    });
  };

  const handleMoveChapter = (chapterId: string, direction: 'up' | 'down') => {
    mutateActiveProject((p) => {
      const idx = p.chapters.findIndex((c) => c.id === chapterId);
      if (idx === -1) return p;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= p.chapters.length) return p;

      const copy = [...p.chapters];
      const [moved] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, moved);
      return {
        ...p,
        chapters: copy.map((c, i) => ({ ...c, number: i + 1 })),
      };
    });
  };

  const handleAddProtagonist = (protagonist: Protagonist) => {
    if (activeProject.characters.length >= MAX_PROTAGONISTS) return;
    mutateActiveProject((p) => ({
      ...p,
      characters: [...p.characters, protagonist],
      nodePositions: {
        ...p.nodePositions,
        [protagonist.id]: {
          x: 240 + p.characters.length * 90,
          y: 250,
        },
      },
    }));
  };

  const handleUpdateProtagonist = (id: string, patch: Partial<Protagonist>) => {
    mutateActiveProject((p) => ({
      ...p,
      characters: p.characters.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  };

  const handleDeleteProtagonist = (id: string) => {
    if (activeProject.characters.length <= 1) return;
    mutateActiveProject((p) => {
      const remaining = p.characters.filter((c) => c.id !== id);
      const fallbackPov = remaining[0]?.id || 'omniscient';
      return {
        ...p,
        characters: remaining,
        relationshipEdges: p.relationshipEdges.filter(
          (e) => e.sourceId !== id && e.targetId !== id
        ),
        chapters: p.chapters.map((ch) =>
          ch.povCharacterId === id
            ? { ...ch, povCharacterId: fallbackPov }
            : ch
        ),
      };
    });
  };

  const handleAddSupportingCharacter = (sup: SupportingCharacter) => {
    mutateActiveProject((p) => ({
      ...p,
      supportingCharacters: [...p.supportingCharacters, sup],
      nodePositions: {
        ...p.nodePositions,
        [sup.id]: {
          x: 180 + (p.supportingCharacters.length % 5) * 130,
          y: 120 + Math.floor(p.supportingCharacters.length / 5) * 120,
        },
      },
    }));
  };

  const handleUpdateSupportingCharacter = (
    id: string,
    patch: Partial<SupportingCharacter>
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      supportingCharacters: p.supportingCharacters.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    }));
  };

  const handleDeleteSupportingCharacter = (id: string) => {
    mutateActiveProject((p) => ({
      ...p,
      supportingCharacters: p.supportingCharacters.filter((s) => s.id !== id),
      relationshipEdges: p.relationshipEdges.filter(
        (e) => e.sourceId !== id && e.targetId !== id
      ),
    }));
  };

  const handleImportLengyePresetIntoActive = () => {
    const preset = createLengyeEmmaProject();
    const emma = preset.characters[0];
    if (!emma || activeProject.characters.length >= MAX_PROTAGONISTS) return;
    const emmaId = `char_emma_${Date.now()}`;
    const importedBrothers: SupportingCharacter[] =
      LENGYE_TWELVE_BROTHERS_PRESET.map((b, idx) => ({
        ...b,
        id: `sup_lengye_${Date.now()}_${idx}`,
        linkedProtagonistId: emmaId,
      }));
    const familiarityForEmma: Record<string, 'intimate'> = {};
    importedBrothers.forEach((b) => {
      familiarityForEmma[b.id] = 'intimate';
    });
    const importedEmma: Protagonist = {
      ...emma,
      id: emmaId,
      characterFamiliarity: familiarityForEmma,
    };
    const newEdges: RelationshipEdge[] = importedBrothers.map((b, idx) => ({
      id: `rel_lengye_${Date.now()}_${idx}`,
      sourceId: b.id,
      targetId: emmaId,
      type: 'doting_protect',
      bidirectional: false,
      description: `${b.name}（${b.titleOrRank}）：${b.relationshipToProtagonist}`,
    }));

    const nextPositions = { ...activeProject.nodePositions };
    nextPositions[emmaId] = { x: 420, y: 270 };
    importedBrothers.forEach((b, idx) => {
      const angle = (idx / importedBrothers.length) * Math.PI * 2;
      nextPositions[b.id] = {
        x: Math.round(420 + Math.cos(angle) * 260),
        y: Math.round(270 + Math.sin(angle) * 205),
      };
    });

    mutateActiveProject((p) => ({
      ...p,
      characters: [...p.characters, importedEmma],
      supportingCharacters: [...p.supportingCharacters, ...importedBrothers],
      relationshipEdges: [...p.relationshipEdges, ...newEdges],
      nodePositions: nextPositions,
    }));
  };

  const handleUpdateNodePosition = (
    id: string,
    pos: { x: number; y: number }
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      nodePositions: {
        ...p.nodePositions,
        [id]: pos,
      },
    }));
  };

  const handleBatchUpdatePositions = (
    positions: Record<string, { x: number; y: number }>
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      nodePositions: positions,
    }));
  };

  const handleAddRelationshipEdge = (edge: RelationshipEdge) => {
    mutateActiveProject((p) => ({
      ...p,
      relationshipEdges: [...p.relationshipEdges, edge],
    }));
  };

  const handleUpdateRelationshipEdge = (
    edgeId: string,
    patch: Partial<RelationshipEdge>
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      relationshipEdges: p.relationshipEdges.map((e) =>
        e.id === edgeId ? { ...e, ...patch } : e
      ),
    }));
  };

  const handleDeleteRelationshipEdge = (edgeId: string) => {
    mutateActiveProject((p) => ({
      ...p,
      relationshipEdges: p.relationshipEdges.filter((e) => e.id !== edgeId),
    }));
  };

  const handleUpdateWorld = (patch: Partial<WorldSettings>) => {
    mutateActiveProject((p) => ({
      ...p,
      world: { ...p.world, ...patch },
    }));
  };

  const handleUpdateContentSettings = (patch: Partial<ContentSettings>) => {
    mutateActiveProject((p) => ({
      ...p,
      contentSettings: { ...p.contentSettings, ...patch },
    }));
  };

  const handleAddMemoriesFromChapter = (
    entries: MemoryEntry[],
    chapterId: string,
    syncedAt: string
  ) => {
    mutateActiveProject((p) => ({
      ...p,
      memories: [...p.memories, ...entries],
      chapters: p.chapters.map((ch) =>
        ch.id === chapterId ? { ...ch, lastMemorySyncAt: syncedAt } : ch
      ),
    }));
  };

  const handleToggleMemoryPin = (memoryId: string) => {
    mutateActiveProject((p) => ({
      ...p,
      memories: p.memories.map((m) =>
        m.id === memoryId ? { ...m, pinned: !m.pinned } : m
      ),
    }));
  };

  const handleAddMemory = (entry: MemoryEntry) => {
    mutateActiveProject((p) => ({
      ...p,
      memories: [...p.memories, entry],
    }));
  };

  const handleUpdateMemory = (id: string, patch: Partial<MemoryEntry>) => {
    mutateActiveProject((p) => ({
      ...p,
      memories: p.memories.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  };

  const handleDeleteMemory = (id: string) => {
    mutateActiveProject((p) => ({
      ...p,
      memories: p.memories.filter((m) => m.id !== id),
    }));
  };

  const handleCreateProject = (
    title: string,
    template: 'literary' | 'game_dungeon' | 'lengye_emma'
  ) => {
    const created = createBlankProject(title, template);
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    setActiveBranchId(created.branches[0]?.id || 'main');
    setActiveChapterId(created.chapters[0]?.id || '');
    setActiveTab('cast_world');
  };

  const handleDeleteProject = (id: string) => {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (activeProjectId === id && remaining[0]) {
      setActiveProjectId(remaining[0].id);
    }
  };

  const handleImportProject = (imported: StoryProject) => {
    setProjects((prev) => [imported, ...prev]);
    setActiveProjectId(imported.id);
    setActiveBranchId(imported.branches[0]?.id || 'main');
    setActiveChapterId(imported.chapters[0]?.id || '');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExportModal={() => setExportModalOpen(true)}
      />

      {activeTab === 'studio' && (
        <WritingStudio
          project={activeProject}
          activeBranchId={activeBranchId}
          activeChapterId={activeChapterId}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
          }
          onSelectBranch={handleSelectBranch}
          onSelectChapter={setActiveChapterId}
          onAddChapter={handleAddChapter}
          onUpdateChapter={handleUpdateChapter}
          onUpdateProtagonist={handleUpdateProtagonist}
          onUpdateSupportingCharacter={handleUpdateSupportingCharacter}
          onAddMemories={handleAddMemoriesFromChapter}
          onToggleMemoryPin={handleToggleMemoryPin}
          onGoToCast={() => setActiveTab('cast_world')}
          onGoToProgress={() => setActiveTab('progress')}
        />
      )}

      {activeTab === 'cast_world' && (
        <CastAndWorldView
          project={activeProject}
          onUpdateProjectMeta={(patch) =>
            mutateActiveProject((p) => ({ ...p, ...patch }))
          }
          onAddProtagonist={handleAddProtagonist}
          onUpdateProtagonist={handleUpdateProtagonist}
          onDeleteProtagonist={handleDeleteProtagonist}
          onAddSupportingCharacter={handleAddSupportingCharacter}
          onUpdateSupportingCharacter={handleUpdateSupportingCharacter}
          onDeleteSupportingCharacter={handleDeleteSupportingCharacter}
          onImportLengyePreset={handleImportLengyePresetIntoActive}
          onUpdateNodePosition={handleUpdateNodePosition}
          onBatchUpdatePositions={handleBatchUpdatePositions}
          onAddRelationshipEdge={handleAddRelationshipEdge}
          onUpdateRelationshipEdge={handleUpdateRelationshipEdge}
          onDeleteRelationshipEdge={handleDeleteRelationshipEdge}
          onUpdateWorld={handleUpdateWorld}
          onUpdateContentSettings={handleUpdateContentSettings}
        />
      )}

      {activeTab === 'memories' && (
        <MemoryVaultView
          project={activeProject}
          onAddMemory={handleAddMemory}
          onUpdateMemory={handleUpdateMemory}
          onDeleteMemory={handleDeleteMemory}
          onAddMemoriesFromChapter={handleAddMemoriesFromChapter}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressTrackerView
          project={activeProject}
          activeBranchId={activeBranchId}
          onUpdateProjectMeta={(patch) =>
            mutateActiveProject((p) => ({ ...p, ...patch }))
          }
          onSelectBranch={handleSelectBranch}
          onAddBranch={handleAddBranch}
          onUpdateBranch={handleUpdateBranch}
          onDeleteBranch={handleDeleteBranch}
          onAddChapter={handleAddChapter}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onMoveChapter={handleMoveChapter}
          onOpenChapterInStudio={(chapterId, branchId) => {
            if (branchId) setActiveBranchId(branchId);
            setActiveChapterId(chapterId);
            setActiveTab('studio');
          }}
        />
      )}

      <ExportModal
        isOpen={exportModalOpen}
        projects={projects}
        activeProject={activeProject}
        onClose={() => setExportModalOpen(false)}
        onSelectProject={(id) => setActiveProjectId(id)}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onImportProject={handleImportProject}
      />

      <FloatingInstallPrompt />
      <OfflineIndicator />
    </div>
  );
}
