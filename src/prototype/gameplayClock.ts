export type GameplayClockState = { paused: boolean; hitPaused: boolean };

export function advanceGameplayClock(time: number, frameDelta: number, state: GameplayClockState): { time: number; delta: number } {
  const scale = state.paused ? 0 : state.hitPaused ? 0.05 : 1;
  const delta = Math.max(0, frameDelta) * scale;
  return { time: time + delta, delta };
}
