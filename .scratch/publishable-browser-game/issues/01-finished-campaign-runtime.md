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

Campaign progress is now loaded and saved through browser storage, mode selection happens on the title screen, defeat/restart/replay transitions preserve the intended progress, score and rewards are authoritative, and Crash, Zip, and Junkstorm apply distinct combat tuning.
