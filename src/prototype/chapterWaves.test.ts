import { describe, expect, it } from "vitest";
import { getChapterWaveBlueprint } from "./chapterWaves";

describe("chapter wave blueprints", () => {
  it("keeps every chapter wave populated and positions independent", () => {
    const first = getChapterWaveBlueprint(0);
    const final = getChapterWaveBlueprint(5);
    expect(first).toHaveLength(8);
    expect(final[0].variant).toBe("boss");
    expect(first.map((entry) => entry.delayMs)).toEqual([0, 780, 1560, 2340, 3120, 3900, 4680, 5460]);
    first[0].position.x = 0;
    expect(getChapterWaveBlueprint(0)[0].position.x).toBe(710);
  });
});
