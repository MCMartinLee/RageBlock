import { describe, expect, it } from "vitest";
import { createPlayerState, getLightComboAttack, spendRageOnHeavyAttack } from "./combatRules";
import { getHitFeedback } from "./hitFeedback";

describe("hit feedback", () => {
  it("adds hit pause and sparks to every successful hit", () => {
    const feedback = getHitFeedback(getLightComboAttack(0));

    expect(feedback.hitPauseMs).toBeGreaterThan(0);
    expect(feedback.sparkCount).toBeGreaterThan(0);
    expect(feedback.flashMs).toBeGreaterThan(0);
  });

  it("makes light combo finishers stronger than early light hits", () => {
    const first = getHitFeedback(getLightComboAttack(0));
    const finisher = getHitFeedback(getLightComboAttack(2));

    expect(finisher.hitPauseMs).toBeGreaterThan(first.hitPauseMs);
    expect(finisher.shakeDurationMs).toBeGreaterThan(first.shakeDurationMs);
  });

  it("keeps heavy hit feedback restrained but heavier than light feedback", () => {
    const light = getHitFeedback(getLightComboAttack(0));
    const heavy = getHitFeedback(spendRageOnHeavyAttack(createPlayerState()).attack);
    const empowered = getHitFeedback(spendRageOnHeavyAttack(createPlayerState({ rage: 100 })).attack);

    expect(heavy.hitPauseMs).toBeGreaterThan(light.hitPauseMs);
    expect(heavy.shakeIntensity).toBeLessThan(0.01);
    expect(empowered.sparkCount).toBeGreaterThan(heavy.sparkCount);
  });
});
