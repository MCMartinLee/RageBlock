import type { Point } from "./arenaDefinition";
import type { AttackOutcome } from "./combatRules";
import type { FacingDirection } from "./attackPresentation";
import { getKnockbackVelocity } from "./hitDetection";

export type PropKind = "cone" | "trash-can" | "ball" | "tire-stack" | "arcade-sign" | "laundry-cart" | "scooter-rack" | "prize-crate" | "relay-box";

export type PropPresentation = {
  texture: "rageblock-props" | "rageblock-signature-props";
  frame: number;
  size: number;
  spriteY: number;
  shadowWidth: number;
};

const PROP_PRESENTATIONS: Record<PropKind, PropPresentation> = {
  cone: { texture: "rageblock-props", frame: 0, size: 76, spriteY: -32, shadowWidth: 58 },
  "trash-can": { texture: "rageblock-props", frame: 1, size: 82, spriteY: -32, shadowWidth: 58 },
  ball: { texture: "rageblock-props", frame: 2, size: 64, spriteY: -22, shadowWidth: 44 },
  "tire-stack": { texture: "rageblock-signature-props", frame: 0, size: 72, spriteY: -28, shadowWidth: 62 },
  "arcade-sign": { texture: "rageblock-signature-props", frame: 1, size: 82, spriteY: -38, shadowWidth: 64 },
  "laundry-cart": { texture: "rageblock-signature-props", frame: 2, size: 88, spriteY: -35, shadowWidth: 70 },
  "scooter-rack": { texture: "rageblock-signature-props", frame: 3, size: 84, spriteY: -32, shadowWidth: 70 },
  "prize-crate": { texture: "rageblock-signature-props", frame: 4, size: 90, spriteY: -38, shadowWidth: 72 },
  "relay-box": { texture: "rageblock-signature-props", frame: 5, size: 84, spriteY: -38, shadowWidth: 66 }
};

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

export function getPropPresentation(kind: PropKind): PropPresentation {
  return { ...PROP_PRESENTATIONS[kind] };
}

export function getPropFrame(kind: PropKind, reacted = false): number {
  const presentation = PROP_PRESENTATIONS[kind];
  if (!reacted) return presentation.frame;
  return presentation.frame + (presentation.texture === "rageblock-props" ? 3 : 6);
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
