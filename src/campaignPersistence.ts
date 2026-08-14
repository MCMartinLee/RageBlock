import { createCampaignState, RAGE_MODE_MODIFIERS, type CampaignState, type RageMode } from "./campaignRuntime";

export const CAMPAIGN_STORAGE_KEY = "rageblock-campaign-v1";
export const RAGE_MODE_STORAGE_KEY = "rageblock-mode";

export type CampaignStorage = Pick<Storage, "getItem" | "setItem">;

export function saveCampaign(storage: CampaignStorage, state: CampaignState): void {
  storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(state));
}

export function loadCampaign(storage: CampaignStorage): CampaignState {
  const selectedMode = loadSelectedMode(storage);
  try {
    const parsed = JSON.parse(storage.getItem(CAMPAIGN_STORAGE_KEY) ?? "null") as Partial<CampaignState> | null;
    if (!parsed || typeof parsed.chapterIndex !== "number") return createCampaignState(selectedMode);
    return { ...createCampaignState(selectedMode), ...parsed, mode: selectedMode, modifiers: RAGE_MODE_MODIFIERS[selectedMode] };
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
