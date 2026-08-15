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

The browser flow runs from an animated illustrated title with Rage mode, mastery, fresh-campaign and unlocked-chapter selection through a compact campaign HUD with a persistent exit-aware objective, route stamps, side-room feedback, boss telegraphs, pause, animated results, defeat, checkpoint retry, correctly named chapter replay rewards, victory, full replay, and title return. Keyboard, protected mouse controls, and standard gamepad inputs share one tested action model, including title navigation; procedural audio separates swings from confirmed impacts and covers combat and UI states. Unit and Playwright coverage verify normalized mappings, narrow desktop scaling, real combat, persistence, replay rewards, geometry bounds, context-menu suppression, and all player-facing overlays.
