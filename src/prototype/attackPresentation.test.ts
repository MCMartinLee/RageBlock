import { describe, expect, it } from "vitest";
import { getAttackPresentation } from "./attackPresentation";
import { getLightComboAttack, spendRageOnHeavyAttack, createPlayerState } from "./combatRules";

describe("attack presentation", () => {
  it("makes the light combo finisher read larger than earlier light hits", () => {
    const first = getAttackPresentation(getLightComboAttack(0), "right");
    const finisher = getAttackPresentation(getLightComboAttack(2), "right");

    expect(finisher.hitboxWidth).toBeGreaterThan(first.hitboxWidth);
    expect(finisher.label).toBe("LIGHT 3");
  });

  it("makes heavy attacks slower and larger than light attacks", () => {
    const light = getAttackPresentation(getLightComboAttack(0), "right");
    const heavyAttack = spendRageOnHeavyAttack(createPlayerState()).attack;
    const heavy = getAttackPresentation(heavyAttack, "right");

    expect(heavy.durationMs).toBeGreaterThan(light.durationMs);
    expect(heavy.impactDelayMs).toBeGreaterThan(light.impactDelayMs);
    expect(heavy.impactDelayMs).toBeLessThan(heavy.durationMs);
    expect(heavy.hitboxWidth).toBeGreaterThan(light.hitboxWidth);
    expect(heavy.label).toBe("HEAVY LAUNCH");
  });

  it("ties attack hit ranges to the player's facing direction", () => {
    const attack = getLightComboAttack(0);

    expect(getAttackPresentation(attack, "right").hitboxOffsetX).toBeGreaterThan(0);
    expect(getAttackPresentation(attack, "left").hitboxOffsetX).toBeLessThan(0);
  });
});
