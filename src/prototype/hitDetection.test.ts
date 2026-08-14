import { describe, expect, it } from "vitest";
import { getAttackPresentation } from "./attackPresentation";
import { getLightComboAttack, spendRageOnHeavyAttack, createPlayerState } from "./combatRules";
import { createAttackHitbox, getKnockbackVelocity, isPointInsideHitbox } from "./hitDetection";

describe("scene hit detection rules", () => {
  it("only hits bully weirdos inside the attack hitbox", () => {
    const presentation = getAttackPresentation(getLightComboAttack(0), "right");
    const hitbox = createAttackHitbox({ x: 200, y: 300 }, presentation);

    expect(isPointInsideHitbox({ x: hitbox.center.x, y: hitbox.center.y }, hitbox)).toBe(true);
    expect(isPointInsideHitbox({ x: hitbox.center.x, y: 300 - 42 }, hitbox)).toBe(true);
    expect(isPointInsideHitbox({ x: 50, y: hitbox.center.y }, hitbox)).toBe(false);
  });

  it("makes finisher knockback stronger than early light hit knockback", () => {
    const first = getKnockbackVelocity(getLightComboAttack(0).knockback, "right", false);
    const finisher = getKnockbackVelocity(getLightComboAttack(2).knockback, "right", false);

    expect(finisher.x).toBeGreaterThan(first.x);
  });

  it("launches heavy attacks and makes empowered heavy attacks stronger", () => {
    const normal = spendRageOnHeavyAttack(createPlayerState({ rage: 0 })).attack;
    const empowered = spendRageOnHeavyAttack(createPlayerState({ rage: 100 })).attack;

    expect(getKnockbackVelocity(normal.knockback, "right", normal.launch).y).toBeLessThan(0);
    expect(getKnockbackVelocity(empowered.knockback, "right", empowered.launch).x).toBeGreaterThan(
      getKnockbackVelocity(normal.knockback, "right", normal.launch).x
    );
  });
});
