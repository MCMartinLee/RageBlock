import { describe, expect, it } from "vitest";
import { getBossRule, getBossRuleLabel } from "./bossRules";

describe("boss rules", () => {
  it("cycles through readable arena-rule phases", () => {
    expect(getBossRule(0)).toBe("pressure");
    expect(getBossRule(1800)).toBe("charge");
    expect(getBossRule(3600)).toBe("lane-lock");
    expect(getBossRuleLabel("lane-lock")).toContain("LANE LOCK");
  });
});
