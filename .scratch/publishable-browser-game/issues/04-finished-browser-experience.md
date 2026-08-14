# 04 - Finished Browser Experience

**What to build:** Make the complete player-facing browser experience coherent, readable, and self-explanatory from title screen through replay.

**Blocked by:** 03 - Complete Character And Animation Presentation

**Status:** resolved

- [x] Title, premise, controls, HUD, chapter stamps, score, combo, Rage mode, objective, pause, boss health, results, and replay UI are complete.
- [x] Keyboard and controller actions use the same normalized input interface.
- [x] Original hit, hurt, break, clear, boss, UI, and ambient audio support the full flow.
- [x] Responsive desktop and narrow viewport layouts keep all important information readable.
- [x] A new player can complete the campaign without developer instructions.
- [x] Browser visual smoke tests cover title, combat, transition, pause, results, and replay states.

## Answer

The finished browser flow now runs from an illustrated title and mode select through a compact campaign HUD, chapter stamps, readable telegraphs, pause, defeat, victory, checkpoint retry, full replay, and title return. Keyboard and standard gamepad inputs share one action model; procedural audio covers combat and UI states; and Playwright verifies the complete flow, narrow scaling, real combat, and saved progress.
