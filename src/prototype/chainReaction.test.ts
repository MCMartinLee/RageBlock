import { describe, expect, it } from "vitest";
import { isChainReactionImpact } from "./chainReaction";

describe("chain reactions", () => {
  it("requires a fast prop close to a target", () => {
    expect(isChainReactionImpact({ x: 10, y: 10 }, { x: 180, y: 0 }, { x: 40, y: 10 })).toBe(true);
    expect(isChainReactionImpact({ x: 10, y: 10 }, { x: 20, y: 0 }, { x: 40, y: 10 })).toBe(false);
  });
});
