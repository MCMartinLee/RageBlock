import type { CampaignChapter } from "../campaignDefinition";
import type { RoutePhase } from "./chapterWaves";

export function getCampaignObjective(chapter: CampaignChapter, phase: RoutePhase, exitOpen: boolean, sideAvailable = true): string {
  if (exitOpen) {
    if (phase === "main") return sideAvailable ? `Choose ${chapter.route[1].label} or ${chapter.route[2].label}` : `Reach ${chapter.route[2].label}`;
    if (phase === "side") return `Return to ${chapter.route[2].label}`;
    return chapter.boss ? "Recover the Rage Remote" : "Reach the exit to the next block";
  }
  if (phase === "main") return chapter.objective;
  if (phase === "side") return `Open the cache and clear ${chapter.route[1].label}`;
  return `Clear ${chapter.route[2].label}${chapter.boss ? `: ${chapter.boss}` : ""}`;
}
