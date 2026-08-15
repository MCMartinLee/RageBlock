import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS, validateCampaignChapters } from "./campaignDefinition";
import { advanceRouteNode, completeChapter, completeSideRoom, createCampaignState, getCampaignRank, getRageModeTuning, prepareCampaignStart, recordDefeat, recordPlayerDefeat, resolveChapterStart, restartCampaign, selectRageMode } from "./campaignRuntime";

describe("campaign runtime", () => {
  it("validates the six-chapter campaign", () => {
    expect(validateCampaignChapters()).toBe(true);
    expect(CAMPAIGN_CHAPTERS[5].boss).toBe("Block Captain");
  });

  it("selects readable Rage Remote modes", () => {
    const state = selectRageMode({ ...createCampaignState(), modifiers: ["knockback-up", "back-lot-mastery"] }, "junkstorm");
    expect(state.mode).toBe("junkstorm");
    expect(state.modifiers).toContain("prop-launch");
    expect(state.modifiers).toContain("back-lot-mastery");
    expect(state.modifiers).not.toContain("knockback-up");
  });

  it("awards chapters and completes after the final reward", () => {
    let state = createCampaignState("zip");
    for (let index = 0; index < 6; index += 1) state = completeChapter(state);
    expect(state.completed).toBe(true);
    expect(state.recoveredRewards).toHaveLength(6);
    expect(getCampaignRank(12000)).toBe("S");
    expect(recordDefeat(state, 500).score).toBeGreaterThan(state.score);
  });

  it("tracks main route and optional side-room progress", () => {
    const sideRoom = completeSideRoom(createCampaignState(), "bonus-sticker");
    const routed = advanceRouteNode(sideRoom);
    expect(sideRoom.routeNode).toBe(0);
    expect(routed.routeNode).toBe(1);
    expect(sideRoom.recoveredRewards).toContain("bonus-sticker");
    expect(sideRoom.score).toBe(250);
    expect(completeSideRoom(sideRoom, "bonus-sticker")).toEqual(sideRoom);
  });

  it("unlocks replayable chapters and chapter cosmetics through rewards", () => {
    const progressed = completeChapter(createCampaignState());
    expect(progressed.unlockedChapters).toEqual([0, 1]);
    expect(progressed.cosmetics).toContain("crash-jacket");
    expect(resolveChapterStart(progressed, 0)).toEqual({ chapterIndex: 0, replay: true });
    expect(resolveChapterStart(progressed, 5)).toEqual({ chapterIndex: 1, replay: false });
  });

  it("awards a replay without moving or erasing the active checkpoint", () => {
    const checkpoint = completeChapter(completeChapter(createCampaignState()));
    const replayed = completeChapter(checkpoint, 0);
    expect(replayed.chapterIndex).toBe(2);
    expect(replayed.completed).toBe(false);
    expect(replayed.score).toBe(checkpoint.score + 1000);
    expect(replayed.unlockedChapters).toEqual([0, 1, 2]);
    expect(replayed.modifiers).toContain("back-lot-mastery");
    expect(replayed.cosmetics).toContain("fence-crew-colors");
  });

  it("restores defeat and replay state safely", () => {
    const progressed = completeSideRoom(createCampaignState("zip"), "bonus-sticker");
    expect(recordPlayerDefeat(progressed).routeNode).toBe(0);
    expect(recordPlayerDefeat(advanceRouteNode(progressed)).routeNode).toBe(1);
    expect(restartCampaign(progressed).recoveredRewards).toContain("bonus-sticker");
  });

  it("awards mastery while a completed save plays a fresh campaign", () => {
    const completed = {
      ...createCampaignState(),
      completed: true,
      recoveredRewards: [CAMPAIGN_CHAPTERS[0].reward],
      unlockedChapters: [0, 1, 2, 3, 4, 5]
    };
    const restarted = restartCampaign(completed);
    const replayedFirstChapter = completeChapter(restarted, 0);

    expect(replayedFirstChapter.chapterIndex).toBe(1);
    expect(replayedFirstChapter.modifiers).toContain("back-lot-mastery");
    expect(replayedFirstChapter.cosmetics).toContain("fence-crew-colors");
  });

  it("turns chapter one on a completed title save into a fresh advancing campaign", () => {
    const completed = {
      ...createCampaignState(),
      completed: true,
      chapterIndex: 5,
      recoveredRewards: CAMPAIGN_CHAPTERS.map((chapter) => chapter.reward),
      unlockedChapters: [0, 1, 2, 3, 4, 5]
    };
    const prepared = prepareCampaignStart(completed, 0);

    expect(prepared.completed).toBe(false);
    expect(prepared.chapterIndex).toBe(0);
    expect(prepared.recoveredRewards).toEqual(completed.recoveredRewards);
    expect(resolveChapterStart(prepared, 0).replay).toBe(false);
  });

  it("gives every Rage mode a real tuning effect", () => {
    expect(getRageModeTuning("crash").knockbackMultiplier).toBeGreaterThan(1);
    expect(getRageModeTuning("zip").speedMultiplier).toBeGreaterThan(1);
    expect(getRageModeTuning("zip", ["speed-up", "recovery-up"]).recoveryMultiplier).toBeLessThan(1);
    expect(getRageModeTuning("junkstorm").propMultiplier).toBeGreaterThan(1);
    expect(getRageModeTuning("crash", ["knockback-up", "back-lot-mastery"]).speedMultiplier).toBeGreaterThan(getRageModeTuning("crash").speedMultiplier);
  });
});
