export type SideCacheState = { health: number; opened: boolean };

export function createSideCacheState(): SideCacheState {
  return { health: 12, opened: false };
}

export function applyHitToSideCache(state: SideCacheState, damage: number): { state: SideCacheState; openedNow: boolean } {
  if (state.opened) return { state, openedNow: false };
  const health = Math.max(0, state.health - damage);
  const opened = health === 0;
  return { state: { health, opened }, openedNow: opened };
}
