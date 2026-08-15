import { describe, expect, it } from "vitest";
import { hasReadableLayout, type LayoutBounds } from "./layoutGeometry";

describe("screen layout geometry", () => {
  const canvas: LayoutBounds = { x: 0, y: 0, width: 960, height: 540 };

  it("accepts bounded, separated labels", () => {
    expect(hasReadableLayout(canvas, [
      [{ x: 24, y: 12, width: 180, height: 30 }, { x: 600, y: 12, width: 100, height: 20 }, { x: 810, y: 12, width: 126, height: 20 }],
      [{ x: 24, y: 76, width: 420, height: 18 }, { x: 610, y: 76, width: 90, height: 18 }]
    ])).toBe(true);
  });

  it("rejects off-canvas and overlapping labels", () => {
    expect(hasReadableLayout(canvas, [[{ x: -1, y: 10, width: 80, height: 20 }]])).toBe(false);
    expect(hasReadableLayout(canvas, [[
      { x: 24, y: 12, width: 180, height: 30 },
      { x: 190, y: 12, width: 120, height: 20 }
    ]])).toBe(false);
  });
});
