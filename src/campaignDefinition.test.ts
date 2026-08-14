import { describe, expect, it } from "vitest";
import { CAMPAIGN_CHAPTERS, getCampaignChapter } from "./campaignDefinition";

describe("campaign definition", () => {
  it("contains a complete three-chapter arc", () => {
    expect(CAMPAIGN_CHAPTERS).toHaveLength(3);
    expect(CAMPAIGN_CHAPTERS[2].boss).toBeTruthy();
  });

  it("clamps chapter lookup to the campaign", () => {
    expect(getCampaignChapter(-1).id).toBe("back-lot");
    expect(getCampaignChapter(99).id).toBe("rooftop");
  });
});
