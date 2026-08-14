import type { Point } from "./arenaDefinition";
import type { AttackOutcome } from "./combatRules";
import type { FacingDirection } from "./attackPresentation";
import { getKnockbackVelocity } from "./hitDetection";

export type PropKind = "cone" | "trash-can" | "ball";

export type PropState = {
  kind: PropKind;
  broken: boolean;
  hitCount: number;
};

export type PropReaction = {
  state: PropState;
  velocity: Point;
  breaksNow: boolean;
};

export function createPropState(kind: PropKind): PropState {
  return {
    kind,
    broken: false,
    hitCount: 0
  };
}

export function applyAttackToProp(
  prop: PropState,
  attack: AttackOutcome,
  facing: FacingDirection
): PropReaction {
  if (prop.broken) {
    return {
      state: prop,
      velocity: { x: 0, y: 0 },
      breaksNow: false
    };
  }

  const hitCount = prop.hitCount + 1;
  const breaksNow = prop.kind !== "ball" && (attack.kind === "heavy" || hitCount >= 2);
  const baseVelocity = getKnockbackVelocity(attack.knockback * 0.8, facing, attack.launch);

  return {
    state: {
      ...prop,
      hitCount,
      broken: breaksNow
    },
    velocity: prop.kind === "ball" ? { ...baseVelocity, y: -170 } : baseVelocity,
    breaksNow
  };
}
