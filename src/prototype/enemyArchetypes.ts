export type EnemyArchetype = "bully" | "charger" | "thrower" | "heavy" | "boss";
export type EnemyArchetypeDefinition = {
  health: number;
  approachScale: number;
  damage: number;
  telegraph: string;
  counter: string;
};

export const ENEMY_ARCHETYPES: Record<EnemyArchetype, EnemyArchetypeDefinition> = {
  bully: { health: 18, approachScale: 1, damage: 4, telegraph: "taunt", counter: "interrupt" },
  charger: { health: 18, approachScale: 1.15, damage: 6, telegraph: "charge", counter: "sidestep" },
  thrower: { health: 18, approachScale: 0.55, damage: 3, telegraph: "wind-up", counter: "close distance" },
  heavy: { health: 30, approachScale: 0.7, damage: 8, telegraph: "brace", counter: "launch" },
  boss: { health: 60, approachScale: 0.85, damage: 7, telegraph: "pressure / charge", counter: "read the lane" }
};

export type PlayerAnimationState = "idle" | "move" | "run" | "light" | "heavy" | "hurt" | "launch" | "land" | "recovery" | "defeated" | "victory" | "rage";
