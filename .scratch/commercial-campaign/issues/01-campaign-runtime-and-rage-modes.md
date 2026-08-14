# 01 - Campaign Runtime And Rage Remote Modes

**What to build:** Give RageBlock a testable campaign state that tracks the six-chapter journey and lets the player choose a Rage Remote mode before each chapter.

**Blocked by:** None - can start immediately.

**Status:** ready-for-agent

- [ ] Campaign state tracks chapter, route progress, recovered components, score, rank, modifiers, and completion.
- [ ] Six chapters are represented as validated data with unique ids, objectives, rosters, rewards, and bosses.
- [ ] Crash, Zip, and Junkstorm modes apply readable gameplay modifiers.
- [ ] Restart and defeat restore the correct campaign state without stale Phaser state.
- [ ] Pure tests cover chapter progression, mode selection, scoring, rank, rewards, and modifiers.
