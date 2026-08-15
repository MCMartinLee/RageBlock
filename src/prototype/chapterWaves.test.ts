import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS } from "../campaignDefinition";
import { getChapterPropBlueprint, getChapterWaveBlueprint } from "./chapterWaves";

describe("chapter wave blueprints", () => {
  it("builds independent main and climax waves from each authored roster", () => {
    const first = getChapterWaveBlueprint(0);
    const apartment = getChapterWaveBlueprint(2);
    const final = getChapterWaveBlueprint(5, "climax");
    expect(first).toHaveLength(4);
    expect(getChapterWaveBlueprint(3, "side")).toHaveLength(2);
    expect(getChapterWaveBlueprint(0, "climax")).toHaveLength(2);
    expect(final.map((entry) => entry.variant)).toEqual(["boss"]);
    expect(apartment.every((entry) => CAMPAIGN_CHAPTERS[2].enemyRoster.includes(entry.variant as never))).toBe(true);
    expect(apartment.some((entry) => entry.variant === "heavy")).toBe(true);
    expect(first.map((entry) => entry.delayMs)).toEqual([0, 620, 1240, 1860]);
    expect(new Set(CAMPAIGN_CHAPTERS.map((_, chapter) => JSON.stringify(getChapterWaveBlueprint(chapter, "main").map((entry) => entry.position)))).size).toBe(6);
    first[0].position.x = 0;
    expect(getChapterWaveBlueprint(0)[0].position.x).toBe(710);
  });

  it("gives chapters and route phases distinct prop arrangements", () => {
    const signatures = CAMPAIGN_CHAPTERS.map((_, chapter) => JSON.stringify(getChapterPropBlueprint(chapter, "main")));
    expect(new Set(signatures).size).toBe(CAMPAIGN_CHAPTERS.length);
    expect(getChapterPropBlueprint(3, "climax")).not.toEqual(getChapterPropBlueprint(3, "main"));
    expect(getChapterPropBlueprint(3, "side")).not.toEqual(getChapterPropBlueprint(3, "main"));
    const signatureKinds = CAMPAIGN_CHAPTERS.map((_, chapter) => getChapterPropBlueprint(chapter, "main").at(-1)?.kind);
    expect(new Set(signatureKinds).size).toBe(CAMPAIGN_CHAPTERS.length);
  });
});
