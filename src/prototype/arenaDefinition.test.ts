import { describe, expect, it } from "vitest";
import {
  ARENA_BOUNDS,
  clampToArena,
  PLAYER_SPAWN,
  RESERVED_CONTROLS
} from "./arenaDefinition";

describe("schoolyard corner movement sandbox", () => {
  it("spawns the player inside the fixed arena", () => {
    expect(PLAYER_SPAWN.x).toBeGreaterThan(ARENA_BOUNDS.left);
    expect(PLAYER_SPAWN.x).toBeLessThan(ARENA_BOUNDS.right);
    expect(PLAYER_SPAWN.y).toBeGreaterThan(ARENA_BOUNDS.top);
    expect(PLAYER_SPAWN.y).toBeLessThan(ARENA_BOUNDS.bottom);
  });

  it("keeps movement inside the visible arena boundaries", () => {
    expect(clampToArena({ x: -100, y: 999 })).toEqual({
      x: ARENA_BOUNDS.left,
      y: ARENA_BOUNDS.bottom
    });
  });

  it("reserves the upcoming combat controls", () => {
    expect(RESERVED_CONTROLS.lightAttack).toContain("J");
    expect(RESERVED_CONTROLS.heavyAttack).toContain("K");
    expect(RESERVED_CONTROLS.dash).toContain("Shift");
    expect(RESERVED_CONTROLS.jump).toContain("Space");
  });
});
