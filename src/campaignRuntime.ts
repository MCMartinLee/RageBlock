import { CAMPAIGN_CHAPTERS, getCampaignChapter, type CampaignChapter } from "./campaignDefinition";

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
  cosmetics: string[];
  bestScore: number;
};

export const RAGE_MODE_MODIFIERS: Record<RageMode, string[]> = {
  crash: ["knockback-up"],
  zip: ["speed-up", "recovery-up"],
  junkstorm: ["prop-launch"]
};

export function createCampaignState(mode: RageMode = "crash"): CampaignState {
  return { chapterIndex: 0, routeNode: 0, recoveredRewards: [], score: 0, defeats: 0, completed: false, mode, modifiers: RAGE_MODE_MODIFIERS[mode], unlockedModes: ["crash", "zip", "junkstorm"], cosmetics: ["classic"], bestScore: 0 };
}

export function selectRageMode(state: CampaignState, mode: RageMode): CampaignState {
  return { ...state, mode, modifiers: RAGE_MODE_MODIFIERS[mode] };
}

export function getActiveChapter(state: CampaignState): CampaignChapter {
  return getCampaignChapter(state.chapterIndex);
}

export function completeChapter(state: CampaignState): CampaignState {
  const chapter = getActiveChapter(state);
  const rewards = state.recoveredRewards.includes(chapter.reward) ? state.recoveredRewards : [...state.recoveredRewards, chapter.reward];
  const finalChapter = state.chapterIndex >= CAMPAIGN_CHAPTERS.length - 1;
  const score = state.score + 1000;
  return { ...state, chapterIndex: finalChapter ? state.chapterIndex : state.chapterIndex + 1, routeNode: 0, recoveredRewards: rewards, score, bestScore: Math.max(state.bestScore, score), completed: finalChapter };
}

export function advanceRouteNode(state: CampaignState, optional = false): CampaignState {
  return { ...state, routeNode: state.routeNode + 1, score: state.score + (optional ? 250 : 0) };
}

export function completeSideRoom(state: CampaignState, reward: string): CampaignState {
  return { ...advanceRouteNode(state, true), recoveredRewards: state.recoveredRewards.includes(reward) ? state.recoveredRewards : [...state.recoveredRewards, reward] };
}

export function recordDefeat(state: CampaignState, points = 100): CampaignState {
  return { ...state, defeats: state.defeats + 1, score: state.score + points };
}

export function recordPlayerDefeat(state: CampaignState): CampaignState {
  return { ...state, routeNode: 0, defeats: state.defeats + 1 };
}

export function restartCampaign(state: CampaignState): CampaignState {
  return { ...createCampaignState(state.mode), bestScore: Math.max(state.bestScore, state.score), cosmetics: [...state.cosmetics], recoveredRewards: [...state.recoveredRewards] };
}

export type RageModeTuning = { speedMultiplier: number; knockbackMultiplier: number; propMultiplier: number };

export function getRageModeTuning(mode: RageMode): RageModeTuning {
  if (mode === "zip") return { speedMultiplier: 1.2, knockbackMultiplier: 1, propMultiplier: 1 };
  if (mode === "junkstorm") return { speedMultiplier: 1, knockbackMultiplier: 1, propMultiplier: 1.8 };
  return { speedMultiplier: 1, knockbackMultiplier: 1.3, propMultiplier: 1 };
}

export function getCampaignRank(score: number): CampaignRank {
  if (score >= 12000) return "S";
  if (score >= 8000) return "A";
  if (score >= 4000) return "B";
  return "C";
}
