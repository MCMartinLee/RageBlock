import type { Point } from "./arenaDefinition";

export function isChainReactionImpact(prop: Point, velocity: Point, target: Point): boolean {
  const speed = Math.hypot(velocity.x, velocity.y);
  const distance = Math.hypot(prop.x - target.x, prop.y - target.y);
  return speed >= 140 && distance <= 46;
}
