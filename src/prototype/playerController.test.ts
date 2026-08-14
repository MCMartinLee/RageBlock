import { describe, expect, it } from "vitest";
import { bufferAttack, consumeBufferedAttack, getPlayerMotionState } from "./playerController";

describe("player controller", () => {
  it("reports idle, move, and run states", () => {
    expect(getPlayerMotionState(false, false)).toBe("idle");
    expect(getPlayerMotionState(true, false)).toBe("move");
    expect(getPlayerMotionState(true, true)).toBe("run");
  });

  it("keeps the first buffered attack", () => {
    expect(bufferAttack(undefined, "light")).toBe("light");
    expect(bufferAttack("light", "heavy")).toBe("light");
    expect(consumeBufferedAttack("heavy")).toBe("heavy");
  });
});
