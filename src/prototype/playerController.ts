export type PlayerMotionState = "idle" | "move" | "run";
export type PlayerAction = "light" | "heavy";

export function getPlayerMotionState(moving: boolean, running: boolean): PlayerMotionState {
  if (!moving) return "idle";
  return running ? "run" : "move";
}

export function bufferAttack(current: PlayerAction | undefined, next: PlayerAction): PlayerAction {
  return current ?? next;
}

export function consumeBufferedAttack(current: PlayerAction | undefined): PlayerAction | undefined {
  return current;
}
