import type { AttackOutcome } from "./combatRules";

export type FacingDirection = "left" | "right";

export type AttackPresentation = {
  color: number;
  durationMs: number;
  hitboxOffsetX: number;
  hitboxWidth: number;
  hitboxHeight: number;
  label: string;
};

export function getAttackPresentation(
  attack: AttackOutcome,
  facing: FacingDirection
): AttackPresentation {
  const direction = facing === "right" ? 1 : -1;
  const isHeavy = attack.kind === "heavy";
  const isFinisher = attack.comboStep === 3;
  const hitboxWidth = isHeavy ? 112 : isFinisher ? 94 : 72;

  return {
    color: isHeavy ? 0xff5f4d : isFinisher ? 0xf0c15c : 0x8de0ff,
    durationMs: isHeavy ? 310 : 150,
    hitboxOffsetX: direction * (42 + hitboxWidth / 2),
    hitboxWidth,
    hitboxHeight: isHeavy ? 72 : 52,
    label: isHeavy ? "HEAVY LAUNCH" : `LIGHT ${attack.comboStep}`
  };
}
