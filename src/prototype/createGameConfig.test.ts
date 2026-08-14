import { describe, expect, it } from "vitest";
import {
  PROTOTYPE_SCENE_KEY,
  PROTOTYPE_SUBTITLE,
  PROTOTYPE_TITLE
} from "./prototypeDefinition";

describe("RageBlock browser scaffold", () => {
  it("names the prototype screen the app boots into", () => {
    expect(PROTOTYPE_TITLE).toBe("RageBlock");
    expect(PROTOTYPE_SUBTITLE).toBe("Combat Feel Prototype");
    expect(PROTOTYPE_SCENE_KEY).toBe("combat-feel-prototype");
  });
});
