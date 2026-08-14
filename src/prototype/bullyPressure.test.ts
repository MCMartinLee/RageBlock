import { describe, expect, it } from "vitest";
import { createBullyPressureState, updateBullyPressure } from "./bullyPressure";

describe("simple pressure AI", () => {
  it("starts by taunting before approaching", () => {
    const state = createBullyPressureState(0);
    const result = updateBullyPressure(state, { x: 100, y: 100 }, { x: 400, y: 100 }, 100);

    expect(result.decision.mood).toBe("taunting");
    expect(result.decision.velocity).toEqual({ x: 0, y: 0 });
  });

  it("approaches the player after the taunt expires", () => {
    const state = createBullyPressureState(0);
    const result = updateBullyPressure(state, { x: 100, y: 100 }, { x: 400, y: 100 }, 800);

    expect(result.decision.mood).toBe("approaching");
    expect(result.decision.velocity.x).toBeGreaterThan(0);
    expect(result.decision.damagesPlayer).toBe(false);
  });

  it("shoves and damages the player when close", () => {
    const state = createBullyPressureState(0);
    const result = updateBullyPressure(state, { x: 100, y: 100 }, { x: 130, y: 100 }, 800);

    expect(result.decision.mood).toBe("shoving");
    expect(result.decision.damagesPlayer).toBe(true);
  });

  it("backs off after a shove window expires", () => {
    const shoving = {
      mood: "shoving" as const,
      nextMoodAt: 1000,
      canCharge: false
    };
    const result = updateBullyPressure(shoving, { x: 100, y: 100 }, { x: 130, y: 100 }, 1100);

    expect(result.decision.mood).toBe("backing-off");
    expect(result.decision.velocity.x).toBeLessThan(0);
  });

  it("can spend one charge for light enemy variety", () => {
    const state = createBullyPressureState(0, true);
    const result = updateBullyPressure(state, { x: 100, y: 100 }, { x: 400, y: 100 }, 800);

    expect(result.decision.mood).toBe("charging");
    expect(result.decision.velocity.x).toBeGreaterThan(150);
    expect(result.state.canCharge).toBe(false);
  });
});
