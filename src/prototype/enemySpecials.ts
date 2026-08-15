import type { EnemyArchetype } from "./enemyArchetypes";

export type EnemySpecialPlan = {
  kind: "throw" | "slam";
  telegraphMs: number;
  cooldownMs: number;
};

export function getEnemySpecialPlan(variant: EnemyArchetype, distance: number, now: number, nextSpecialAt: number): EnemySpecialPlan | undefined {
  if (now < nextSpecialAt) return undefined;
  if (variant === "thrower" && distance >= 140 && distance <= 360) return { kind: "throw", telegraphMs: 320, cooldownMs: 1650 };
  if (variant === "heavy" && distance <= 115) return { kind: "slam", telegraphMs: 460, cooldownMs: 1900 };
  return undefined;
}
