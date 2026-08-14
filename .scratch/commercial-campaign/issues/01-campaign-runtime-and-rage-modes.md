# 01 - Campaign Runtime And Rage Remote Modes

**What to build:** Give RageBlock a testable campaign state that tracks the six-chapter journey and lets the player choose a Rage Remote mode before each chapter.

**Blocked by:** None - can start immediately.

**Status:** in-progress

- [x] Campaign state tracks chapter, route progress, recovered components, score, rank, modifiers, and completion.
- [x] Six chapters are represented as validated data with unique ids, objectives, rosters, rewards, and bosses.
- [x] Crash, Zip, and Junkstorm modes apply readable gameplay modifiers.
- [ ] Restart and defeat restore the correct campaign state without stale Phaser state.
- [x] Pure tests cover chapter progression, mode selection, scoring, rank, rewards, and modifiers.

## Review Notes

The pure campaign runtime is implemented and tested. Phaser scene integration, including restart/defeat wiring and mode selection UI, remains part of the connected-route implementation.
