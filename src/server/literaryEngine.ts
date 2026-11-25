import {
  HarmBlockThreshold,
  HarmCategory,
} from '@google/genai';
import type {
  ChapterSensoryMarkers,
  ContentSettings,
  DungeonInstance,
  DungeonScoreState,
  FamiliarityLevel,
  MemoryEntry,
  Protagonist,
  RelationshipEdge,
  StoryBranch,
  SupportingCharacter,
  WorldSettings,
} from '../types/story.js';

export const MODEL_NAME = 'gemini-4-hydrogen';

export const LITERARY_SAFETY_SETTINGS = [
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

// Placeholder: full helper implementations load with storyApi.
export function buildLiterarySystemInstruction(_params: unknown): string {
  return '';
}
