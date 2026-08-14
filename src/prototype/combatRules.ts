export type AttackKind = "light" | "heavy";

export type AttackOutcome = {
  kind: AttackKind;
  comboStep: 1 | 2 | 3 | null;
  damage: number;
  knockback: number;
  launch: boolean;
  empowered: boolean;
  rageGain: number;
  nextComboStep: number;
};

export type PlayerState = {
  health: number;
  rage: number;
};

export type BullyWeirdoState = {
  health: number;
  defeated: boolean;
};

export type CombatRunState = {
  defeatedBullyWeirdos: number;
  rage: number;
};

const BLOCK_CLEAR_DEFEATS = 8;
const RAGE_METER_MAX = 100;

const LIGHT_COMBO: Array<Omit<AttackOutcome, "kind" | "empowered">> = [
  {
    comboStep: 1,
    damage: 4,
    knockback: 90,
    launch: false,
    rageGain: 18,
    nextComboStep: 1
  },
  {
    comboStep: 2,
    damage: 5,
    knockback: 110,
    launch: false,
    rageGain: 18,
    nextComboStep: 2
  },
  {
    comboStep: 3,
    damage: 7,
    knockback: 190,
    launch: false,
    rageGain: 24,
    nextComboStep: 0
  }
];

export function createPlayerState(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    health: 100,
    rage: 0,
    ...overrides
  };
}

export function createBullyWeirdoState(
  overrides: Partial<BullyWeirdoState> = {}
): BullyWeirdoState {
  return {
    health: 18,
    defeated: false,
    ...overrides
  };
}

export function createCombatRunState(
  overrides: Partial<CombatRunState> = {}
): CombatRunState {
  return {
    defeatedBullyWeirdos: 0,
    rage: 0,
    ...overrides
  };
}

export function getLightComboAttack(currentComboStep: number): AttackOutcome {
  const combo = LIGHT_COMBO[currentComboStep] ?? LIGHT_COMBO[0];

  return {
    kind: "light",
    empowered: false,
    ...combo
  };
}

export function spendRageOnHeavyAttack(player: PlayerState): {
  attack: AttackOutcome;
  player: PlayerState;
} {
  const empowered = player.rage >= RAGE_METER_MAX;

  return {
    attack: {
      kind: "heavy",
      comboStep: null,
      damage: empowered ? 16 : 10,
      knockback: empowered ? 360 : 240,
      launch: true,
      empowered,
      rageGain: 0,
      nextComboStep: 0
    },
    player: {
      ...player,
      rage: empowered ? 0 : player.rage
    }
  };
}

export function applyAttackToBullyWeirdo(
  run: CombatRunState,
  bully: BullyWeirdoState,
  attack: AttackOutcome
): { run: CombatRunState; bully: BullyWeirdoState } {
  if (bully.defeated) {
    return { run, bully };
  }

  const nextHealth = Math.max(0, bully.health - attack.damage);
  const defeatedNow = nextHealth === 0;

  return {
    bully: {
      health: nextHealth,
      defeated: defeatedNow
    },
    run: {
      defeatedBullyWeirdos: run.defeatedBullyWeirdos + (defeatedNow ? 1 : 0),
      rage: Math.min(RAGE_METER_MAX, run.rage + attack.rageGain)
    }
  };
}

export function isBlockCleared(run: CombatRunState): boolean {
  return run.defeatedBullyWeirdos >= BLOCK_CLEAR_DEFEATS;
}
