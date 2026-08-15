import { describe, expect, it } from "vitest";
import { canBossCharge, getBossRule, getBossRuleLabel, getBossRulePhase, getBossRuleTuning } from "./bossRules";

describe("boss rules", () => {
  it("cycles through readable arena-rule phases", () => {
    expect(getBossRule(0)).toBe("pressure");
    expect(getBossRule(2200)).toBe("charge");
    expect(getBossRule(4400)).toBe("lane-lock");
    expect(getBossRuleLabel("lane-lock")).toContain("LANE LOCK");
    expect(getBossRulePhase(2200)).toEqual({ rule: "charge", telegraphing: true });
    expect(getBossRulePhase(2620)).toEqual({ rule: "charge", telegraphing: false });
  });

  it("changes combat pressure rather than only changing a label", () => {
    expect(getBossRuleTuning("charge").speedMultiplier).toBeGreaterThan(getBossRuleTuning("pressure").speedMultiplier);
    expect(getBossRuleTuning("charge").damage).toBeGreaterThan(getBossRuleTuning("lane-lock").damage);
    expect(getBossRuleTuning("charge").damage).toBeLessThanOrEqual(8);
    expect(getBossRuleTuning("lane-lock").lane).toEqual({ top: 345, bottom: 425 });
    expect(getBossRuleTuning("charge", true).damage).toBe(0);
    expect(getBossRuleTuning("lane-lock", true).lane).toBeUndefined();
    expect(canBossCharge("charge", false)).toBe(true);
    expect(canBossCharge("charge", true)).toBe(false);
    expect(canBossCharge("pressure", false)).toBe(false);
    expect(canBossCharge("lane-lock", false)).toBe(false);
  });
});
