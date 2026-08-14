import type { Point } from "./arenaDefinition";
import type { AttackPresentation, FacingDirection } from "./attackPresentation";

export type AttackHitbox = {
  center: Point;
  width: number;
  height: number;
};

export function createAttackHitbox(
  playerPosition: Point,
  presentation: AttackPresentation
): AttackHitbox {
  return {
    center: {
      x: playerPosition.x + presentation.hitboxOffsetX,
      y: playerPosition.y - 30
    },
    width: presentation.hitboxWidth,
    height: presentation.hitboxHeight
  };
}

export function isPointInsideHitbox(point: Point, hitbox: AttackHitbox): boolean {
  return (
    point.x >= hitbox.center.x - hitbox.width / 2 &&
    point.x <= hitbox.center.x + hitbox.width / 2 &&
    point.y >= hitbox.center.y - hitbox.height / 2 &&
    point.y <= hitbox.center.y + hitbox.height / 2
  );
}

export function getKnockbackVelocity(
  knockback: number,
  facing: FacingDirection,
  launches: boolean
): Point {
  const direction = facing === "right" ? 1 : -1;

  return {
    x: direction * knockback,
    y: launches ? -90 : 0
  };
}
