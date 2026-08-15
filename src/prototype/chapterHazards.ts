import type { Point } from "./arenaDefinition";
import type { RoutePhase } from "./chapterWaves";
import { getCampaignChapter } from "../campaignDefinition";

export type ChapterHazardKind = "rolling-tire" | "flicker-sign" | "laundry-cart" | "runaway-scooter" | "parade-float" | "sweeping-antenna";
export type HazardMotion = "horizontal" | "vertical" | "diagonal" | "parade" | "sweep";
export type HazardCollision = { kind: "circle"; radius: number } | { kind: "segment"; halfLength: number; width: number; angleOffset: number };
export type ChapterHazardBlueprint = {
  kind: ChapterHazardKind;
  motion: HazardMotion;
  start: Point;
  end: Point;
  durationMs: number;
  damage: number;
  collision: HazardCollision;
};

const HAZARDS: Record<ChapterHazardKind, ChapterHazardBlueprint> = {
  "rolling-tire": { kind: "rolling-tire", motion: "horizontal", start: { x: 170, y: 430 }, end: { x: 790, y: 430 }, durationMs: 3000, damage: 7, collision: { kind: "circle", radius: 38 } },
  "flicker-sign": { kind: "flicker-sign", motion: "vertical", start: { x: 650, y: 240 }, end: { x: 650, y: 455 }, durationMs: 2200, damage: 8, collision: { kind: "circle", radius: 42 } },
  "laundry-cart": { kind: "laundry-cart", motion: "horizontal", start: { x: 800, y: 420 }, end: { x: 170, y: 420 }, durationMs: 2700, damage: 9, collision: { kind: "circle", radius: 48 } },
  "runaway-scooter": { kind: "runaway-scooter", motion: "diagonal", start: { x: 180, y: 470 }, end: { x: 800, y: 265 }, durationMs: 2400, damage: 8, collision: { kind: "circle", radius: 38 } },
  "parade-float": { kind: "parade-float", motion: "parade", start: { x: 820, y: 400 }, end: { x: 150, y: 400 }, durationMs: 3600, damage: 11, collision: { kind: "circle", radius: 64 } },
  "sweeping-antenna": { kind: "sweeping-antenna", motion: "sweep", start: { x: 500, y: 375 }, end: { x: 500, y: 375 }, durationMs: 2500, damage: 10, collision: { kind: "segment", halfLength: 145, width: 28, angleOffset: -0.66 } }
};

export function getChapterHazardBlueprint(chapterIndex: number, phase: RoutePhase): ChapterHazardBlueprint | undefined {
  if (phase === "side") return undefined;
  const source = HAZARDS[getCampaignChapter(chapterIndex).hazards[0]];
  return {
    ...source,
    start: { ...source.start },
    end: { ...source.end },
    durationMs: phase === "climax" ? Math.max(1600, source.durationMs - 350) : source.durationMs,
    damage: source.damage + (phase === "climax" ? 2 : 0),
    collision: { ...source.collision }
  };
}

export function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const projection = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + projection * dx), point.y - (start.y + projection * dy));
}

export function isPointInsideHazard(
  blueprint: ChapterHazardBlueprint,
  actorPosition: Point,
  actorRotation: number,
  point: Point,
  padding = 0
): boolean {
  if (blueprint.collision.kind === "circle") {
    return Math.hypot(point.x - actorPosition.x, point.y - actorPosition.y) <= blueprint.collision.radius + padding;
  }
  const angle = actorRotation + blueprint.collision.angleOffset;
  const dx = Math.cos(angle) * blueprint.collision.halfLength;
  const dy = Math.sin(angle) * blueprint.collision.halfLength;
  return distanceToSegment(
    point,
    { x: actorPosition.x - dx, y: actorPosition.y - dy },
    { x: actorPosition.x + dx, y: actorPosition.y + dy }
  ) <= blueprint.collision.width + padding;
}
