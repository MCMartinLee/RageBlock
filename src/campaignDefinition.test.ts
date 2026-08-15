import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS, getCampaignChapter } from "./campaignDefinition";

describe("campaign definition", () => {
  it("contains a complete six-chapter arc", () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(6);
    expect(CAMPAIGN_CHAPTERS[5].boss).toBeTruthy();
    expect(new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.faction)).size).toBe(6);
    expect(new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.enemyTint)).size).toBe(6);
  });

  it("clamps chapter lookup to the campaign", () => {
    expect(getCampaignChapter(-1).id).toBe("back-lot");
    expect(getCampaignChapter(99).id).toBe("rooftop-relay");
  });
});
