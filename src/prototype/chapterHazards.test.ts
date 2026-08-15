import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS } from "../campaignDefinition";
import { distanceToSegment, getChapterHazardBlueprint, isPointInsideHazard } from "./chapterHazards";

describe("chapter hazards", () => {
  it("authors a distinct mechanic and silhouette for every chapter", () => {
    const hazards = CAMPAIGN_CHAPTERS.map((_, index) => getChapterHazardBlueprint(index, "main"));
    expect(new Set(hazards.map((hazard) => hazard?.kind)).size).toBe(6);
    expect(new Set(hazards.map((hazard) => hazard?.motion)).size).toBeGreaterThanOrEqual(4);
    const antenna = getChapterHazardBlueprint(5, "main");
    expect(antenna?.collision.kind).toBe("segment");
    expect(antenna?.collision.kind === "segment" ? antenna.collision.angleOffset : 0).toBeLessThan(0);
    expect(getChapterHazardBlueprint(0, "side")).toBeUndefined();
  });

  it("measures rotating sweep collisions against a segment", () => {
    expect(distanceToSegment({ x: 5, y: 5 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
    expect(distanceToSegment({ x: 20, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(10);
  });

  it("checks circle and rotating-segment hazard contacts for any actor", () => {
    const tire = getChapterHazardBlueprint(0, "main")!;
    const antenna = getChapterHazardBlueprint(5, "main")!;
    expect(isPointInsideHazard(tire, tire.start, 0, { x: tire.start.x + 30, y: tire.start.y }, 4)).toBe(true);
    expect(isPointInsideHazard(tire, tire.start, 0, { x: tire.start.x + 100, y: tire.start.y }, 4)).toBe(false);
    expect(isPointInsideHazard(antenna, antenna.start, 0, antenna.start, 0)).toBe(true);
  });
});
