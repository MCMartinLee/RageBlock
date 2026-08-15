import { describe, expect, it } from "vitest";
import { getTitleGamepadNavigation, isGamepadActionPressed, isNormalizedActionHeld, isNormalizedActionPressed } from "./inputActions";

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

  it("maps rising controller edges for title mode and chapter selection", () => {
    const buttons = Array.from({ length: 16 }, (_, index) => [0, 5, 15].includes(index));
    expect(getTitleGamepadNavigation(buttons, [])).toEqual({ start: true, modeDelta: 1, chapterDelta: 1 });
    expect(getTitleGamepadNavigation(buttons, buttons)).toEqual({ start: false, modeDelta: 0, chapterDelta: 0 });
  });
});
