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

All six chapters carry authored faction, palette, route, optional-room, typed hazard, reward, roster, and climax data. Main, side-room, and climax encounters use chapter-specific wave sizes, spawn compositions, prop layouts, silhouette accessories, crew color treatments, dedicated intact/broken signature set-piece art, and side-availability-aware objectives; the finale replaces its climax wave with the Block Captain. Six separately prepared moving hazards can damage enemies and launch props into further impacts. Playwright verifies every required route, the guarded optional-room flow, all six hazard renders, and environmental chain reactions.
