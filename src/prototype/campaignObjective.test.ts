import { describe, expect, it } from "vitest";
import { getCampaignChapter } from "../campaignDefinition";
import { getCampaignObjective } from "./campaignObjective";

describe("campaign objective copy", () => {
  const chapter = getCampaignChapter(0);

  it("changes from combat to navigation when each exit opens", () => {
    expect(getCampaignObjective(chapter, "main", false)).toBe(chapter.objective);
    expect(getCampaignObjective(chapter, "main", true)).toContain("Choose");
    expect(getCampaignObjective(chapter, "main", true, false)).toBe(`Reach ${chapter.route[2].label}`);
    expect(getCampaignObjective(chapter, "side", true)).toContain(chapter.route[2].label);
    expect(getCampaignObjective(chapter, "climax", true)).toContain("next block");
  });

  it("names the final campaign interaction after the boss falls", () => {
    expect(getCampaignObjective(getCampaignChapter(5), "climax", true)).toContain("Rage Remote");
  });
});
