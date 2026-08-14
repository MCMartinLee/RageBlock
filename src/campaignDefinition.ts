export type CampaignChapter = {
  id: string;
  title: string;
  setting: string;
  objective: string;
  enemyRoster: string[];
  boss?: string;
  reward: string;
  palette: { sky: number; ground: number; accent: number; structure: number };
  route: Array<{ id: string; kind: "main" | "side" | "climax"; label: string }>;
  hazards: string[];
};

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  { id: "back-lot", title: "The Back Lot", setting: "After-school trouble", objective: "Break through the first wave", enemyRoster: ["bully", "charger"], reward: "crash-core", palette: { sky: 0x26354a, ground: 0x64716d, accent: 0xf0c15c, structure: 0x8f3f3f }, route: [{ id: "fence", kind: "main", label: "Fence Line" }, { id: "shed", kind: "side", label: "Tool Shed" }, { id: "gate", kind: "climax", label: "Back Gate" }], hazards: ["rolling-tire"] },
  { id: "arcade-strip", title: "Arcade Strip", setting: "Neon corner chaos", objective: "Clear the block", enemyRoster: ["bully", "thrower", "charger"], reward: "zip-core", palette: { sky: 0x1c2038, ground: 0x45445d, accent: 0x36d1dc, structure: 0xd83b87 }, route: [{ id: "tokens", kind: "main", label: "Token Row" }, { id: "cabinet", kind: "side", label: "Broken Cabinet" }, { id: "marquee", kind: "climax", label: "Neon Marquee" }], hazards: ["flicker-sign"] },
  { id: "apartment-maze", title: "Apartment Maze", setting: "Hallway weirdos", objective: "Find the service stairs", enemyRoster: ["bully", "thrower", "heavy"], reward: "sticker-pack", palette: { sky: 0x485269, ground: 0x6f695f, accent: 0xffd166, structure: 0x4d7f73 }, route: [{ id: "lobby", kind: "main", label: "Lobby" }, { id: "laundry", kind: "side", label: "Laundry Room" }, { id: "stairs", kind: "climax", label: "Service Stairs" }], hazards: ["laundry-cart"] },
  { id: "canal-walk", title: "Canal Walk", setting: "Scooters and shortcuts", objective: "Cross the canal", enemyRoster: ["charger", "thrower", "heavy"], reward: "junkstorm-core", palette: { sky: 0x87a6a6, ground: 0x5c7772, accent: 0xff6b35, structure: 0x2f5d62 }, route: [{ id: "ramp", kind: "main", label: "Canal Ramp" }, { id: "tunnel", kind: "side", label: "Drain Tunnel" }, { id: "bridge", kind: "climax", label: "Footbridge" }], hazards: ["runaway-scooter"] },
  { id: "community-fair", title: "Community Fair", setting: "Mascots gone rogue", objective: "Crash the main attraction", enemyRoster: ["bully", "charger", "thrower", "heavy"], reward: "rage-eyes", palette: { sky: 0x42355b, ground: 0x596b4d, accent: 0xffd23f, structure: 0xe84a5f }, route: [{ id: "stalls", kind: "main", label: "Food Stalls" }, { id: "games", kind: "side", label: "Rigged Games" }, { id: "stage", kind: "climax", label: "Main Stage" }], hazards: ["parade-float"] },
  { id: "rooftop-relay", title: "Rooftop Relay", setting: "The last word", objective: "Face the block boss", enemyRoster: ["charger", "heavy"], boss: "The Hall Monitor", reward: "sunset-freedom", palette: { sky: 0x472d48, ground: 0x4d5159, accent: 0xff875e, structure: 0x713e5a }, route: [{ id: "vents", kind: "main", label: "Vent Run" }, { id: "antenna", kind: "side", label: "Antenna Deck" }, { id: "relay", kind: "climax", label: "Relay Roof" }], hazards: ["sweeping-antenna"] }
];

export function getCampaignChapter(index: number): CampaignChapter {
  return CAMPAIGN_CHAPTERS[Math.max(0, Math.min(index, CAMPAIGN_CHAPTERS.length - 1))];
}

export function validateCampaignChapters(chapters: CampaignChapter[] = CAMPAIGN_CHAPTERS): boolean {
  const ids = chapters.map((chapter) => chapter.id);
  return chapters.length === 6 && new Set(ids).size === ids.length && chapters.every((chapter) => chapter.enemyRoster.length > 0 && chapter.reward.length > 0 && chapter.route.some((node) => node.kind === "side") && chapter.route.some((node) => node.kind === "climax") && chapter.hazards.length > 0);
}
