import { describe, expect, it } from "vitest";
import { isGamepadActionPressed, isNormalizedActionHeld, isNormalizedActionPressed } from "./inputActions";

describe("normalized input actions", () => {
  it("maps standard gamepad buttons to every player action", () => {
    expect(isGamepadActionPressed([true], "light")).toBe(true);
    expect(isGamepadActionPressed([false, true], "heavy")).toBe(true);
    expect(isGamepadActionPressed(Array.from({ length: 8 }, (_, i) => i === 7), "run")).toBe(true);
    expect(isGamepadActionPressed(Array.from({ length: 10 }, (_, i) => i === 3), "restart")).toBe(true);
    expect(isGamepadActionPressed(Array.from({ length: 10 }, (_, i) => i === 8), "title")).toBe(true);
    expect(isGamepadActionPressed(Array.from({ length: 10 }, (_, i) => i === 9), "pause")).toBe(true);
  });

  it("normalizes keyboard presses and rising gamepad edges", () => {
    expect(isNormalizedActionPressed({ light: true }, [], [], "light")).toBe(true);
    expect(isNormalizedActionPressed({}, [false, true], [false, false], "heavy")).toBe(true);
    expect(isNormalizedActionPressed({}, [false, true], [false, true], "heavy")).toBe(false);
  });

  it("normalizes held run input", () => {
    expect(isNormalizedActionHeld({ run: true }, [], "run")).toBe(true);
    expect(isNormalizedActionHeld({}, Array.from({ length: 8 }, (_, i) => i === 7), "run")).toBe(true);
  });
});
