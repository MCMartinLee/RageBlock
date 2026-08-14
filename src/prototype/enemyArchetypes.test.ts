import { describe, expect, it } from "vitest";
import { ENEMY_ARCHETYPES } from "./enemyArchetypes";

describe("enemy archetypes", () => {
  it("defines distinct readable counters and telegraphs", () => {
    expect(ENEMY_ARCHETYPES.thrower.telegraph).toBe("wind-up");
    expect(ENEMY_ARCHETYPES.thrower.approachScale).toBeLessThan(1);
    expect(ENEMY_ARCHETYPES.heavy.health).toBeGreaterThan(ENEMY_ARCHETYPES.bully.health);
    expect(ENEMY_ARCHETYPES.charger.counter).toBe("sidestep");
  });
});
