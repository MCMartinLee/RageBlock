export type CampaignChapter = {
  id: string;
  title: string;
  setting: string;
  objective: string;
  enemyRoster: string[];
  boss?: string;
  reward: string;
};

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  { id: "back-lot", title: "The Back Lot", setting: "After-school trouble", objective: "Break through the first wave", enemyRoster: ["bully", "charger"], reward: "crash-core" },
  { id: "arcade-strip", title: "Arcade Strip", setting: "Neon corner chaos", objective: "Clear the block", enemyRoster: ["bully", "thrower", "charger"], reward: "zip-core" },
  { id: "apartment-maze", title: "Apartment Maze", setting: "Hallway weirdos", objective: "Find the service stairs", enemyRoster: ["bully", "thrower", "heavy"], reward: "sticker-pack" },
  { id: "canal-walk", title: "Canal Walk", setting: "Scooters and shortcuts", objective: "Cross the canal", enemyRoster: ["charger", "thrower", "heavy"], reward: "junkstorm-core" },
  { id: "community-fair", title: "Community Fair", setting: "Mascots gone rogue", objective: "Crash the main attraction", enemyRoster: ["bully", "charger", "thrower", "heavy"], reward: "rage-eyes" },
  { id: "rooftop-relay", title: "Rooftop Relay", setting: "The last word", objective: "Face the block boss", enemyRoster: ["charger", "heavy"], boss: "The Hall Monitor", reward: "sunset-freedom" }
];

export function getCampaignChapter(index: number): CampaignChapter {
  return CAMPAIGN_CHAPTERS[Math.max(0, Math.min(index, CAMPAIGN_CHAPTERS.length - 1))];
}

export function validateCampaignChapters(chapters: CampaignChapter[] = CAMPAIGN_CHAPTERS): boolean {
  const ids = chapters.map((chapter) => chapter.id);
  return chapters.length === 6 && new Set(ids).size === ids.length && chapters.every((chapter) => chapter.enemyRoster.length > 0 && chapter.reward.length > 0);
}
