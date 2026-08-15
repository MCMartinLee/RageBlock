import { describe, expect, it } from "vitest";
import {
  applyAttackToBullyWeirdo,
  createBullyWeirdoState,
  createCombatRunState,
  createPlayerState,
  getLightComboAttack,
  isBlockCleared,
  recoverPlayerHealth,
  spendRageOnHeavyAttack
} from "./combatRules";

describe("core combat rules", () => {
  it("progresses through a 3-hit light combo and resets after the finisher", () => {
    const first = getLightComboAttack(0);
    const second = getLightComboAttack(first.nextComboStep);
    const third = getLightComboAttack(second.nextComboStep);
    const reset = getLightComboAttack(third.nextComboStep);

    expect(first.comboStep).toBe(1);
    expect(first.kind).toBe("light");
    expect(second.comboStep).toBe(2);
    expect(third.comboStep).toBe(3);
    expect(third.knockback).toBeGreaterThan(second.knockback);
    expect(third.nextComboStep).toBe(0);
    expect(reset.comboStep).toBe(1);
  });

  it("keeps heavy attacks distinct from light combo hits", () => {
    const player = createPlayerState({ rage: 0 });
    const heavy = spendRageOnHeavyAttack(player);

    expect(heavy.attack.kind).toBe("heavy");
    expect(heavy.attack.comboStep).toBeNull();
    expect(heavy.attack.launch).toBe(true);
    expect(heavy.attack.damage).toBeGreaterThan(getLightComboAttack(0).damage);
    expect(heavy.attack.knockback).toBeGreaterThan(getLightComboAttack(2).knockback);
    expect(heavy.player.rage).toBe(0);
  });

  it("applies damage and counts a defeated bully weirdo once", () => {
    const run = createCombatRunState();
    const bully = createBullyWeirdoState({ health: 10 });
    const result = applyAttackToBullyWeirdo(run, bully, {
      ...getLightComboAttack(0),
      damage: 10
    });
    const repeated = applyAttackToBullyWeirdo(result.run, result.bully, getLightComboAttack(0));

    expect(result.bully.health).toBe(0);
    expect(result.bully.defeated).toBe(true);
    expect(result.run.defeatedBullyWeirdos).toBe(1);
    expect(repeated.run.defeatedBullyWeirdos).toBe(1);
  });

  it("fills rage from landed hits and spends a full meter on one empowered heavy attack", () => {
    const run = createCombatRunState();
    const bully = createBullyWeirdoState({ health: 100 });
    const firstHit = applyAttackToBullyWeirdo(run, bully, getLightComboAttack(0));
    const fullRagePlayer = createPlayerState({ rage: 100 });
    const empowered = spendRageOnHeavyAttack(fullRagePlayer);
    const normal = spendRageOnHeavyAttack(createPlayerState({ rage: 40 }));

    expect(firstHit.run.rage).toBeGreaterThan(run.rage);
    expect(empowered.attack.empowered).toBe(true);
    expect(empowered.attack.knockback).toBeGreaterThan(normal.attack.knockback);
    expect(empowered.player.rage).toBe(0);
    expect(normal.attack.empowered).toBe(false);
    expect(normal.player.rage).toBe(40);
  });

  it("recovers health between fights without exceeding the campaign maximum", () => {
    expect(recoverPlayerHealth(createPlayerState({ health: 61 }), 8).health).toBe(69);
    expect(recoverPlayerHealth(createPlayerState({ health: 97 }), 8).health).toBe(100);
  });

  it("clears the block after 8 bully weirdos are defeated", () => {
    expect(isBlockCleared(createCombatRunState({ defeatedBullyWeirdos: 7 }))).toBe(false);
    expect(isBlockCleared(createCombatRunState({ defeatedBullyWeirdos: 8 }))).toBe(true);
  });
});
