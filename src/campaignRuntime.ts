import { CAMPAIGN_CHAPTERS, getCampaignChapter, type CampaignChapter, type CampaignChapterId } from "./campaignDefinition";

export type RageMode = "crash" | "zip" | "junkstorm";
export type CampaignRank = "C" | "B" | "A" | "S";
export type CampaignState = {
  chapterIndex: number;
  routeNode: number;
  recoveredRewards: string[];
  score: number;
  defeats: number;
  completed: boolean;
  mode: RageMode;
  modifiers: string[];
  unlockedModes: RageMode[];
  unlockedChapters: number[];
  cosmetics: string[];
  bestScore: number;
};

export const RAGE_MODE_MODIFIERS: Record<RageMode, string[]> = {
  crash: ["knockback-up"],
  zip: ["speed-up", "recovery-up"],
  junkstorm: ["prop-launch"]
};

const CHAPTER_REWARDS: Record<CampaignChapterId, { cosmetic: string; masteryModifier: string; masteryCosmetic: string }> = {
  "back-lot": { cosmetic: "crash-jacket", masteryModifier: "back-lot-mastery", masteryCosmetic: "fence-crew-colors" },
  "arcade-strip": { cosmetic: "zip-laces", masteryModifier: "arcade-mastery", masteryCosmetic: "token-crew-colors" },
  "apartment-maze": { cosmetic: "maze-stickers", masteryModifier: "apartment-mastery", masteryCosmetic: "stairwell-squad-colors" },
  "canal-walk": { cosmetic: "canal-scarf", masteryModifier: "canal-mastery", masteryCosmetic: "canal-rider-colors" },
  "community-fair": { cosmetic: "fair-rage-eyes", masteryModifier: "fair-mastery", masteryCosmetic: "prize-patrol-colors" },
  "rooftop-relay": { cosmetic: "sunset-remote", masteryModifier: "rooftop-mastery", masteryCosmetic: "relay-guard-colors" }
};
const MODE_MODIFIERS = new Set<string>(Object.values(RAGE_MODE_MODIFIERS).flat());

export function createCampaignState(mode: RageMode = "crash"): CampaignState {
  return { chapterIndex: 0, routeNode: 0, recoveredRewards: [], score: 0, defeats: 0, completed: false, mode, modifiers: RAGE_MODE_MODIFIERS[mode], unlockedModes: ["crash", "zip", "junkstorm"], unlockedChapters: [0], cosmetics: ["classic"], bestScore: 0 };
}

export function selectRageMode(state: CampaignState, mode: RageMode): CampaignState {
  const earnedModifiers = state.modifiers.filter((modifier) => !MODE_MODIFIERS.has(modifier));
  return { ...state, mode, modifiers: [...RAGE_MODE_MODIFIERS[mode], ...earnedModifiers] };
}

export function getActiveChapter(state: CampaignState): CampaignChapter {
  return getCampaignChapter(state.chapterIndex);
}

export function completeChapter(state: CampaignState, completedChapterIndex = state.chapterIndex): CampaignState {
  const chapter = getCampaignChapter(completedChapterIndex);
  const chapterRewards = CHAPTER_REWARDS[chapter.id];
  const detachedReplay = state.completed || completedChapterIndex !== state.chapterIndex;
  const masteryEligible = detachedReplay || state.recoveredRewards.includes(chapter.reward);
  const rewards = state.recoveredRewards.includes(chapter.reward) ? state.recoveredRewards : [...state.recoveredRewards, chapter.reward];
  const finalChapter = !detachedReplay && state.chapterIndex >= CAMPAIGN_CHAPTERS.length - 1;
  const score = state.score + 1000;
  const nextChapter = detachedReplay || finalChapter ? state.chapterIndex : state.chapterIndex + 1;
  const unlockedChapters = state.unlockedChapters.includes(nextChapter) ? state.unlockedChapters : [...state.unlockedChapters, nextChapter];
  let cosmetics = state.cosmetics.includes(chapterRewards.cosmetic) ? state.cosmetics : [...state.cosmetics, chapterRewards.cosmetic];
  let modifiers = state.modifiers;
  if (masteryEligible) {
    if (!modifiers.includes(chapterRewards.masteryModifier)) modifiers = [...modifiers, chapterRewards.masteryModifier];
    if (!cosmetics.includes(chapterRewards.masteryCosmetic)) cosmetics = [...cosmetics, chapterRewards.masteryCosmetic];
  }
  return { ...state, chapterIndex: nextChapter, routeNode: detachedReplay ? state.routeNode : 0, recoveredRewards: rewards, score, bestScore: Math.max(state.bestScore, score), completed: state.completed || finalChapter, unlockedChapters, cosmetics, modifiers };
}

export function advanceRouteNode(state: CampaignState, optional = false): CampaignState {
  return { ...state, routeNode: Math.min(2, state.routeNode + 1), score: state.score + (optional ? 250 : 0) };
}

export function completeSideRoom(state: CampaignState, reward: string): CampaignState {
  if (state.recoveredRewards.includes(reward)) return state;
  return { ...state, score: state.score + 250, recoveredRewards: [...state.recoveredRewards, reward] };
}

export function recordDefeat(state: CampaignState, points = 100): CampaignState {
  return { ...state, defeats: state.defeats + 1, score: state.score + points };
}

export function recordPlayerDefeat(state: CampaignState): CampaignState {
  return { ...state, defeats: state.defeats + 1 };
}

export function restartCampaign(state: CampaignState): CampaignState {
  return { ...createCampaignState(state.mode), bestScore: Math.max(state.bestScore, state.score), cosmetics: [...state.cosmetics], recoveredRewards: [...state.recoveredRewards], unlockedChapters: [...state.unlockedChapters], modifiers: [...state.modifiers] };
}

export function prepareCampaignStart(state: CampaignState, requestedChapter: number): CampaignState {
  return state.completed && requestedChapter === 0 ? restartCampaign(state) : state;
}

export function resolveChapterStart(state: CampaignState, requestedChapter: number): { chapterIndex: number; replay: boolean } {
  const chapterIndex = state.unlockedChapters.includes(requestedChapter) ? requestedChapter : state.chapterIndex;
  return { chapterIndex, replay: state.completed || chapterIndex !== state.chapterIndex };
}

export type RageModeTuning = { speedMultiplier: number; knockbackMultiplier: number; propMultiplier: number; recoveryMultiplier: number };

export function getRageModeTuning(mode: RageMode, modifiers: string[] = []): RageModeTuning {
  const base = mode === "zip"
    ? { speedMultiplier: 1.2, knockbackMultiplier: 1, propMultiplier: 1 }
    : mode === "junkstorm"
      ? { speedMultiplier: 1, knockbackMultiplier: 1, propMultiplier: 1.8 }
      : { speedMultiplier: 1, knockbackMultiplier: 1.3, propMultiplier: 1 };
  const masteryCount = modifiers.filter((modifier) => modifier.endsWith("-mastery")).length;
  return {
    speedMultiplier: base.speedMultiplier * (1 + masteryCount * 0.015),
    knockbackMultiplier: base.knockbackMultiplier * (1 + masteryCount * 0.01),
    propMultiplier: base.propMultiplier * (1 + masteryCount * 0.02),
    recoveryMultiplier: mode === "zip" || modifiers.includes("recovery-up") ? 0.82 : 1
  };
}

export function getCampaignRank(score: number): CampaignRank {
  if (score >= 12000) return "S";
  if (score >= 8000) return "A";
  if (score >= 4000) return "B";
  return "C";
}
