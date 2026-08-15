# 01 - Finished Campaign Runtime

**What to build:** Make the campaign runtime the authoritative player journey from chapter start through rewards, replay, defeat, and final completion.

**Blocked by:** None - can start immediately.

**Status:** resolved

- [x] Six chapters, route nodes, side rooms, rewards, Rage modes, score, ranks, modifiers, and completion are authoritative runtime state.
- [x] Restart, defeat, checkpoint, pause, victory, and replay restore or preserve the correct state.
- [x] Crash, Zip, and Junkstorm affect real gameplay and presentation, not only labels.
- [x] Local browser persistence stores campaign unlocks, scores, modes, cosmetics, and modifiers.
- [x] Pure tests cover the complete campaign state machine.

## Answer

Campaign progress is loaded and saved through browser storage with migration for older saves. Chapter and cosmetic unlocks, selected chapter replay, climax checkpoints, idempotent side rewards, defeat/restart/full-replay transitions, score, rank, and rewards are authoritative. Starting chapter one from a completed title save creates a fresh advancing mastery campaign while preserving unlocks. Replays unlock persistent chapter-mastery modifiers and color sets. Crash, Zip, Junkstorm, and earned mastery apply distinct movement, attack-recovery, knockback, and prop tuning. One pause-aware gameplay clock drives movement, attacks, AI, reactions, projectiles, cooldowns, boss rules, and run time.
