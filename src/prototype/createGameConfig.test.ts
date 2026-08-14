import { describe, expect, it } from "vitest";
import {
  GAME_SCENE_KEY,
  GAME_SUBTITLE,
  GAME_TITLE
} from "./prototypeDefinition";

describe("RageBlock browser scaffold", () => {
  it("defines the finished campaign scene", () => {
    expect(GAME_TITLE).toBe("RageBlock");
    expect(GAME_SUBTITLE).toBe("Six blocks. One stolen Rage Remote.");
    expect(GAME_SCENE_KEY).toBe("rageblock-campaign");
  });
});
