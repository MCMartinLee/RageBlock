export type Point = {
  x: number;
  y: number;
};

export type ArenaBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const ARENA_BOUNDS: ArenaBounds = {
  left: 72,
  right: 888,
  top: 250,
  bottom: 488
};

export const PLAYER_SPAWN: Point = {
  x: 240,
  y: 390
};

export const RESERVED_CONTROLS = {
  lightAttack: ["J", "Left click"],
  heavyAttack: ["K", "Right click"],
  dash: ["L", "Shift"],
  jump: ["Space"]
} as const;

export function clampToArena(position: Point): Point {
  return {
    x: Math.min(Math.max(position.x, ARENA_BOUNDS.left), ARENA_BOUNDS.right),
    y: Math.min(Math.max(position.y, ARENA_BOUNDS.top), ARENA_BOUNDS.bottom)
  };
}
