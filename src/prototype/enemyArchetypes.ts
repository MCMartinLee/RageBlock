export type EnemyArchetype = "bully" | "charger" | "thrower" | "heavy" | "boss";
export type EnemyArchetypeDefinition = {
  health: number;
  approachScale: number;
  telegraph: string;
  counter: string;
};

export const ENEMY_ARCHETYPES: Record<EnemyArchetype, EnemyArchetypeDefinition> = {
  bully: { health: 18, approachScale: 1, telegraph: "taunt", counter: "interrupt" },
  charger: { health: 18, approachScale: 1.15, telegraph: "charge", counter: "sidestep" },
  thrower: { health: 18, approachScale: 0.55, telegraph: "wind-up", counter: "close distance" },
  heavy: { health: 30, approachScale: 0.7, telegraph: "brace", counter: "launch" },
  boss: { health: 60, approachScale: 0.85, telegraph: "pressure / charge", counter: "read the lane" }
};

export type PlayerAnimationState = "idle" | "move" | "run" | "light" | "heavy" | "hurt" | "launch" | "land" | "defeated" | "victory" | "rage";
