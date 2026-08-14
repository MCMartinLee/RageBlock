export type CampaignChapter = {
  id: string;
  title: string;
  setting: string;
  objective: string;
  enemyRoster: string[];
  boss?: string;
};

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  { id: "back-lot", title: "The Back Lot", setting: "After-school trouble", objective: "Break through the first wave", enemyRoster: ["bully", "charger"] },
  { id: "arcade-strip", title: "Arcade Strip", setting: "Neon corner chaos", objective: "Clear the block", enemyRoster: ["bully", "thrower", "charger"] },
  { id: "rooftop", title: "The Rooftop", setting: "The last word", objective: "Face the block boss", enemyRoster: ["bully", "heavy"], boss: "The Hall Monitor"
  }
];

export function getCampaignChapter(index: number): CampaignChapter {
  return CAMPAIGN_CHAPTERS[Math.max(0, Math.min(index, CAMPAIGN_CHAPTERS.length - 1))];
}
