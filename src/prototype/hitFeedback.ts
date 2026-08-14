import type { AttackOutcome } from "./combatRules";

export type HitFeedback = {
  hitPauseMs: number;
  shakeDurationMs: number;
  shakeIntensity: number;
  sparkCount: number;
  flashMs: number;
  squashScale: {
    x: number;
    y: number;
  };
};

export function getHitFeedback(attack: AttackOutcome): HitFeedback {
  if (attack.kind === "heavy") {
    return {
      hitPauseMs: attack.empowered ? 95 : 70,
      shakeDurationMs: attack.empowered ? 150 : 105,
      shakeIntensity: attack.empowered ? 0.006 : 0.004,
      sparkCount: attack.empowered ? 9 : 6,
      flashMs: 130,
      squashScale: {
        x: 1.28,
        y: 0.78
      }
    };
  }

  const isFinisher = attack.comboStep === 3;

  return {
    hitPauseMs: isFinisher ? 52 : 34,
    shakeDurationMs: isFinisher ? 70 : 0,
    shakeIntensity: isFinisher ? 0.0025 : 0,
    sparkCount: isFinisher ? 5 : 3,
    flashMs: 95,
    squashScale: {
      x: isFinisher ? 1.18 : 1.1,
      y: isFinisher ? 0.84 : 0.9
    }
  };
}
