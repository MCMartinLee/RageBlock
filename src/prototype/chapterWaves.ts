import type { Point } from "./arenaDefinition";
import type { EnemyArchetype } from "./enemyArchetypes";

export type ChapterWaveEntry = { position: Point; delayMs: number; canCharge: boolean; variant: EnemyArchetype };

const POSITIONS: Point[] = [
  { x: 710, y: 375 }, { x: 620, y: 455 }, { x: 820, y: 430 }, { x: 760, y: 465 },
  { x: 675, y: 315 }, { x: 860, y: 360 }, { x: 585, y: 395 }, { x: 805, y: 485 }
];

export function getChapterWaveBlueprint(chapterIndex: number): ChapterWaveEntry[] {
  const variants: EnemyArchetype[] = chapterIndex === 0
    ? ["charger", "bully", "charger", "thrower", "charger", "heavy", "charger", "bully"]
    : chapterIndex === 5
      ? ["boss", "bully", "charger", "heavy", "charger", "heavy", "thrower", "bully"]
      : ["thrower", "bully", "charger", "thrower", "charger", "heavy", "charger", "bully"];

  return variants.map((variant, index) => ({
    position: { ...POSITIONS[index] },
    delayMs: index * 160,
    canCharge: variant === "charger" || variant === "boss",
    variant
  }));
}
