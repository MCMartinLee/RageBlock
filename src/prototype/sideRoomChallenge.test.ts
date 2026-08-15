import { describe, expect, it } from "vitest";
import { applyHitToSideCache, createSideCacheState } from "./sideRoomChallenge";

describe("side-room cache", () => {
  it("requires combat to open and only awards the finishing hit", () => {
    const first = applyHitToSideCache(createSideCacheState(), 4);
    const second = applyHitToSideCache(first.state, 4);
    const finish = applyHitToSideCache(second.state, 4);
    expect(first.openedNow).toBe(false);
    expect(second.state.health).toBe(4);
    expect(finish).toEqual({ state: { health: 0, opened: true }, openedNow: true });
    expect(applyHitToSideCache(finish.state, 10).openedNow).toBe(false);
  });
});
