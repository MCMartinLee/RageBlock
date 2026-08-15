import { describe, expect, it } from "vitest";
import { loadCampaign, loadStartChapter, saveCampaign, saveSelectedMode, saveStartChapter } from "./campaignPersistence";
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

  it("applies a newly selected mode to saved progress", () => {
    const storage = memoryStorage();
    const progressed = completeChapter(createCampaignState("crash"));
    saveCampaign(storage, completeChapter(progressed, 0));
    saveSelectedMode(storage, "junkstorm");
    expect(loadCampaign(storage).mode).toBe("junkstorm");
    expect(loadCampaign(storage).modifiers).toContain("prop-launch");
    expect(loadCampaign(storage).modifiers).toContain("back-lot-mastery");
  });

  it("stores and clamps the chapter selected for play", () => {
    const storage = memoryStorage();
    saveStartChapter(storage, 4);
    expect(loadStartChapter(storage, 5)).toBe(4);
    saveStartChapter(storage, 99);
    expect(loadStartChapter(storage, 5)).toBe(5);
    storage.setItem("rageblock-start-chapter", "broken");
    expect(loadStartChapter(storage, 5)).toBe(0);
  });

  it("migrates saves from before chapter unlocks and selected starts existed", () => {
    const storage = memoryStorage();
    storage.setItem("rageblock-campaign-v1", JSON.stringify({ chapterIndex: 0, score: 4200, mode: "crash", recoveredRewards: ["crash-core", "zip-core", "sticker-pack", "junkstorm-core"] }));
    expect(loadCampaign(storage).unlockedChapters).toEqual([0, 1, 2, 3, 4]);
    expect(loadStartChapter(storage, 5, loadCampaign(storage).chapterIndex)).toBe(0);
  });
});
