import { createCampaignState, RAGE_MODE_MODIFIERS, type CampaignState, type RageMode } from "./campaignRuntime";
import { CAMPAIGN_CHAPTERS } from "./campaignDefinition";

export const CAMPAIGN_STORAGE_KEY = "rageblock-campaign-v1";
export const RAGE_MODE_STORAGE_KEY = "rageblock-mode";
export const START_CHAPTER_STORAGE_KEY = "rageblock-start-chapter";

export type CampaignStorage = Pick<Storage, "getItem" | "setItem">;

export function saveCampaign(storage: CampaignStorage, state: CampaignState): void {
  storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(state));
}

export function loadCampaign(storage: CampaignStorage): CampaignState {
  const selectedMode = loadSelectedMode(storage);
  try {
    const parsed = JSON.parse(storage.getItem(CAMPAIGN_STORAGE_KEY) ?? "null") as Partial<CampaignState> | null;
    if (!parsed || typeof parsed.chapterIndex !== "number") return createCampaignState(selectedMode);
    const chapterIndex = Math.max(0, Math.min(Math.trunc(parsed.chapterIndex), CAMPAIGN_CHAPTERS.length - 1));
    const recoveredRewards = Array.isArray(parsed.recoveredRewards) ? parsed.recoveredRewards.filter((reward): reward is string => typeof reward === "string") : [];
    const rewardProgress = CAMPAIGN_CHAPTERS.reduce((furthest, chapter, index) => recoveredRewards.includes(chapter.reward) ? Math.max(furthest, Math.min(index + 1, CAMPAIGN_CHAPTERS.length - 1)) : furthest, 0);
    const inferredProgress = parsed.completed ? CAMPAIGN_CHAPTERS.length - 1 : Math.max(chapterIndex, rewardProgress);
    const inferredUnlocks = Array.from({ length: inferredProgress + 1 }, (_, index) => index);
    const savedUnlocks = Array.isArray(parsed.unlockedChapters)
      ? parsed.unlockedChapters.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < CAMPAIGN_CHAPTERS.length)
      : [];
    const base = createCampaignState(selectedMode);
    const savedModifiers = Array.isArray(parsed.modifiers) ? parsed.modifiers.filter((modifier): modifier is string => typeof modifier === "string") : [];
    const modeModifiers = new Set<string>(Object.values(RAGE_MODE_MODIFIERS).flat());
    const earnedModifiers = savedModifiers.filter((modifier) => !modeModifiers.has(modifier));
    return {
      ...base,
      ...parsed,
      chapterIndex,
      recoveredRewards,
      unlockedChapters: [...new Set([...inferredUnlocks, ...savedUnlocks])].sort((a, b) => a - b),
      unlockedModes: Array.isArray(parsed.unlockedModes) ? parsed.unlockedModes.filter((mode): mode is RageMode => mode === "crash" || mode === "zip" || mode === "junkstorm") : base.unlockedModes,
      cosmetics: Array.isArray(parsed.cosmetics) ? parsed.cosmetics.filter((cosmetic): cosmetic is string => typeof cosmetic === "string") : base.cosmetics,
      mode: selectedMode,
      modifiers: [...RAGE_MODE_MODIFIERS[selectedMode], ...earnedModifiers]
    };
  } catch {
    return createCampaignState(selectedMode);
  }
}

export function saveSelectedMode(storage: CampaignStorage, mode: RageMode): void {
  storage.setItem(RAGE_MODE_STORAGE_KEY, mode);
}

export function loadSelectedMode(storage: CampaignStorage): RageMode {
  const mode = storage.getItem(RAGE_MODE_STORAGE_KEY);
  return mode === "zip" || mode === "junkstorm" ? mode : "crash";
}

export function saveStartChapter(storage: CampaignStorage, chapterIndex: number): void {
  storage.setItem(START_CHAPTER_STORAGE_KEY, String(chapterIndex));
}

export function loadStartChapter(storage: CampaignStorage, maxChapterIndex: number, fallbackChapter = 0): number {
  const saved = storage.getItem(START_CHAPTER_STORAGE_KEY);
  if (saved === null) return Math.max(0, Math.min(fallbackChapter, maxChapterIndex));
  const parsed = Number.parseInt(saved, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(parsed, maxChapterIndex));
}
