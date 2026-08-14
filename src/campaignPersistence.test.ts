import { describe, expect, it } from "vitest";
import { loadCampaign, saveCampaign, saveSelectedMode } from "./campaignPersistence";
import { completeChapter, createCampaignState } from "./campaignRuntime";

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("campaign persistence", () => {
  it("restores campaign progress and selected mode", () => {
    const storage = memoryStorage();
    saveSelectedMode(storage, "zip");
    saveCampaign(storage, completeChapter(createCampaignState("zip")));
    expect(loadCampaign(storage).chapterIndex).toBe(1);
    expect(loadCampaign(storage).mode).toBe("zip");
  });

  it("recovers from invalid browser data", () => {
    const storage = memoryStorage();
    storage.setItem("rageblock-campaign-v1", "not-json");
    expect(loadCampaign(storage).chapterIndex).toBe(0);
  });
});
