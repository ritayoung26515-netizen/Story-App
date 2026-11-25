import type {
  FamiliarityLevel,
  Protagonist,
  RelationshipEdge,
  SupportingCharacter,
} from '../types/story';

/**
 * Resolves how familiar `protagonist` is with `targetId`.
 * Crucially defaults unlinked / unconnected characters to `'stranger'`
 * so AI never falsely assumes a protagonist knows every character in the cast.
 */
export function getEffectiveFamiliarity(
  protagonist: Protagonist,
  targetId: string,
  supportingCharacters: SupportingCharacter[],
  edges: RelationshipEdge[]
): FamiliarityLevel {
  const explicit = protagonist.characterFamiliarity?.[targetId];
  if (explicit) return explicit;

  const sup = supportingCharacters.find((s) => s.id === targetId);
  if (sup) {
    if (sup.linkedProtagonistId === protagonist.id) {
      return 'familiar';
    }
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

  // Target is another protagonist
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

export function getSupportingStatusForBranch(
  sup: SupportingCharacter,
  branchId: string
): { status: string; isBranchOverride: boolean } {
  const override = sup.branchStatusMap?.[branchId];
  if (override !== undefined && override.trim() !== '') {
    return { status: override, isBranchOverride: true };
  }
  return {
    status: sup.currentStatus || '狀態正常 / 待補充',
    isBranchOverride: false,
  };
}
