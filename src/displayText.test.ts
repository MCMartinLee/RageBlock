import { describe, expect, it } from "vitest";
import { formatUnlockName } from "./displayText";

describe("player-facing unlock names", () => {
  it("turns stored reward and cosmetic identifiers into readable names", () => {
    expect(formatUnlockName("sunset-freedom")).toBe("Sunset Freedom");
    expect(formatUnlockName("fair-rage-eyes")).toBe("Fair Rage Eyes");
    expect(formatUnlockName("classic")).toBe("Classic");
  });
});
