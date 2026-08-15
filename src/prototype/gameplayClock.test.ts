import { describe, expect, it } from "vitest";
import { advanceGameplayClock } from "./gameplayClock";

describe("gameplay clock", () => {
  it("freezes while paused and advances normally during play", () => {
    expect(advanceGameplayClock(1200, 16, { paused: true, hitPaused: false })).toEqual({ time: 1200, delta: 0 });
    expect(advanceGameplayClock(1200, 16, { paused: false, hitPaused: false })).toEqual({ time: 1216, delta: 16 });
  });

  it("slows simulation together with hit-pause feedback", () => {
    expect(advanceGameplayClock(1200, 20, { paused: false, hitPaused: true })).toEqual({ time: 1201, delta: 1 });
  });
});
