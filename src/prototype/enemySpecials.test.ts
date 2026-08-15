import { describe, expect, it } from "vitest";
import { getEnemySpecialPlan } from "./enemySpecials";

describe("enemy specials", () => {
  it("gives throwers a ranged wind-up and heavies a close slam", () => {
    expect(getEnemySpecialPlan("thrower", 240, 2000, 1000)).toMatchObject({ kind: "throw", telegraphMs: 320 });
    expect(getEnemySpecialPlan("heavy", 88, 2000, 1000)).toMatchObject({ kind: "slam", telegraphMs: 460 });
  });

  it("respects range, cooldown, and ordinary archetype boundaries", () => {
    expect(getEnemySpecialPlan("thrower", 80, 2000, 1000)).toBeUndefined();
    expect(getEnemySpecialPlan("heavy", 200, 2000, 1000)).toBeUndefined();
    expect(getEnemySpecialPlan("thrower", 240, 500, 1000)).toBeUndefined();
    expect(getEnemySpecialPlan("bully", 40, 2000, 1000)).toBeUndefined();
    expect(getEnemySpecialPlan("charger", 200, 2000, 1000)).toBeUndefined();
  });
});
