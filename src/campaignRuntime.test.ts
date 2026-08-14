import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS, validateCampaignChapters } from "./campaignDefinition";
import { advanceRouteNode, completeChapter, completeSideRoom, createCampaignState, getCampaignRank, getRageModeTuning, recordDefeat, recordPlayerDefeat, restartCampaign, selectRageMode } from "./campaignRuntime";

describe("campaign runtime", () => {
  it("validates the six-chapter campaign", () => {
    expect(validateCampaignChapters()).toBe(true);
    expect(CAMPAIGN_CHAPTERS[5].boss).toBe("The Hall Monitor");
  });

  it("selects readable Rage Remote modes", () => {
    const state = selectRageMode(createCampaignState(), "junkstorm");
    expect(state.mode).toBe("junkstorm");
    expect(state.modifiers).toContain("prop-launch");
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
    const routed = advanceRouteNode(createCampaignState());
    const sideRoom = completeSideRoom(routed, "bonus-sticker");
    expect(sideRoom.routeNode).toBe(2);
    expect(sideRoom.recoveredRewards).toContain("bonus-sticker");
    expect(sideRoom.score).toBe(250);
  });

  it("restores defeat and replay state safely", () => {
    const progressed = completeSideRoom(createCampaignState("zip"), "bonus-sticker");
    expect(recordPlayerDefeat(progressed).routeNode).toBe(0);
    expect(restartCampaign(progressed).recoveredRewards).toContain("bonus-sticker");
  });

  it("gives every Rage mode a real tuning effect", () => {
    expect(getRageModeTuning("crash").knockbackMultiplier).toBeGreaterThan(1);
    expect(getRageModeTuning("zip").speedMultiplier).toBeGreaterThan(1);
    expect(getRageModeTuning("junkstorm").propMultiplier).toBeGreaterThan(1);
  });
});
