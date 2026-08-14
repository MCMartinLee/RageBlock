import { describe, expect, it } from "vitest";
import { isGamepadActionPressed } from "./inputActions";

describe("normalized input actions", () => {
  it("maps gamepad face buttons and menu to combat actions", () => {
    expect(isGamepadActionPressed([true], "light")).toBe(true);
    expect(isGamepadActionPressed([false, true], "heavy")).toBe(true);
    expect(isGamepadActionPressed(Array.from({ length: 10 }, (_, i) => i === 9), "pause")).toBe(true);
  });
});
