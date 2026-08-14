# 02 - Connected Routes And Environmental Combat

**What to build:** Turn the campaign data into playable chapter routes with a main path, optional side rooms, visible exits, environmental hazards, and chain-reaction combat.

**Blocked by:** 01 - Campaign Runtime And Rage Remote Modes

**Status:** in-progress

- [x] Chapters contain route progress state with clear boundaries and visible exits.
- [x] Main-route completion opens an exit and advances the campaign without resetting the run.
- [x] Optional side rooms provide score, prop, challenge, or unlock rewards.
- [ ] Chapter hazards and destructible props create readable chain reactions.
- [x] Chapter objectives and route state are visible in the HUD.
- [ ] Browser coverage verifies entering, clearing, and exiting a route.

## Progress

Campaign route-node and side-room state are implemented and the Phaser HUD now consumes campaign chapter data. Full connected-room navigation, hazard-driven chain reactions, and browser route coverage remain open.
