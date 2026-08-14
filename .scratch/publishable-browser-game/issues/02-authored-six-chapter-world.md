# 02 - Authored Six-Chapter World

**What to build:** Deliver six genuinely distinct playable chapters with main routes, optional side rooms, faction identity, animated environments, hazards, props, and chain-reaction combat.

**Blocked by:** 01 - Finished Campaign Runtime

**Status:** resolved

- [x] Every chapter has a clear main route, optional side content, objective, boundaries, exits, and climax.
- [x] Chapters have distinct backgrounds, props, hazards, palettes, environmental motion, and encounter compositions.
- [x] Main route and side-room completion drive the campaign runtime without scene-reset shortcuts.
- [x] Enemies, props, and hazards can create readable chain reactions.
- [x] A player can understand and complete each chapter without developer instructions.
- [x] Browser tests cover entering, clearing, exiting, and replaying chapter routes.

## Answer

All six chapters now carry authored palette, route, side-room, hazard, reward, and climax data. The Phaser world redraws and animates per chapter, optional side rooms are physically discoverable, moving props can chain-hit enemies, and Playwright verifies the complete six-exit campaign route.
