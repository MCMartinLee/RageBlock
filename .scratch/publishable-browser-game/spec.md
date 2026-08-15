Status: ready-for-agent
Triage: ready-for-agent

## Problem Statement

RageBlock must become a complete browser game that players can understand and finish without developer instructions. The current build proves combat and campaign foundations, but still contains prototype-era presentation, partial route logic, reused programmer-art silhouettes, incomplete animation coverage, and incomplete full-campaign verification. The project needs a clear product contract that treats visual and interactive completeness as release requirements rather than optional polish.

## Solution

Build RageBlock as an original, browser-only, single-player cartoon brawler with a six-chapter campaign. The player is a mischievous kid recovering a confiscated homemade Rage Remote before sunset. Each chapter has an authored main route, optional side content, a faction identity, animated environments, a boss or climax, and a reward. The player chooses Crash, Zip, or Junkstorm Rage modes to change combat expression and replays chapters for score, ranks, modifiers, and cosmetic unlocks.

The finished game must be visually prepared and animated across the entire player-facing experience: title screen, backgrounds, characters, enemies, bosses, props, hazards, attacks, hit reactions, launches, landings, defeat, victory, rage activation, UI transitions, and chapter transitions. "Commercial-quality" is the quality bar, not a requirement to sell the game.

## User Stories

1. As a browser player, I want to start from a title screen, so that I understand where the game begins.
2. As a browser player, I want the premise communicated in the game, so that I never need developer instructions.
3. As a player, I want a complete six-chapter campaign, so that the game has a beginning, middle, and ending.
4. As a player, I want authored main routes, so that progression is clear.
5. As a player, I want optional side rooms, so that exploration rewards skill.
6. As a player, I want six distinct settings and factions, so that chapters do not feel reskinned.
7. As a player, I want Crash, Zip, and Junkstorm modes, so that I can choose a combat style.
8. As a player, I want Rage mode changes to be visible in animation and UI, so that their effects are understandable.
9. As a player, I want chain reactions between enemies, props, and hazards, so that positioning matters.
10. As a player, I want enemy silhouettes and behaviors to be distinct, so that threats are readable.
11. As a player, I want bosses to change arena rules, so that boss encounters are mechanically memorable.
12. As a player, I want boss attacks to telegraph clearly, so that difficulty feels fair.
13. As a player, I want attack anticipation, impact, hit reaction, launch, landing, and recovery animation, so that heavy hits feel physical.
14. As a player, I want animated backgrounds and objects, so that the world feels alive rather than like a test room.
15. As a player, I want animated idle, movement, rage, hurt, defeat, and victory states, so that the protagonist has personality.
16. As a player, I want a sticker-device HUD, so that health, Rage, mode, score, combo, objective, chapter, pause, and boss information are always clear.
17. As a player, I want keyboard and controller support, so that I can choose my desktop input method.
18. As a player, I want pause, restart, defeat, checkpoint, victory, and replay flows, so that the game never traps me in a broken state.
19. As a player, I want score, rank, rewards, modifiers, and cosmetic unlocks, so that replaying has purpose.
20. As a player, I want original art, characters, UI, levels, premise, animation, and audio, so that RageBlock stands on its own.
21. As a player, I want the browser build to work at supported desktop and narrow viewport sizes, so that the presentation remains usable.
22. As a developer, I want campaign rules behind a testable runtime seam, so that progression is reliable and maintainable.
23. As a developer, I want chapter content data-driven, so that authored content can grow without duplicating scene logic.
24. As a maintainer, I want automated full-flow browser coverage, so that releases do not regress the player journey.

## Implementation Decisions

- Treat the game-facing campaign runtime as the primary domain seam. It owns chapter, route, Rage mode, rewards, score, rank, modifiers, completion, defeat, and replay state.
- Keep Phaser scenes as orchestration and presentation adapters. Pure campaign, combat, route, input, archetype, boss-rule, and scoring modules remain testable independently.
- Represent all six chapters as authored data with setting, route nodes, optional rooms, faction roster, hazards, boss/climax, reward, palette, and animation/presentation requirements.
- Use the six chapters The Back Lot, Arcade Strip, Apartment Maze, Canal Walk, Community Fair, and Rooftop Relay.
- Make the main route completable without side content. Side rooms may reward score, components, modifiers, props, or cosmetics.
- Make Crash, Zip, and Junkstorm mutually exclusive chapter loadouts with readable gameplay and presentation differences.
- Replace prototype-only visual placeholders with prepared original assets before a chapter is considered complete. Prepared assets include backgrounds, characters, enemies, bosses, props, hazards, effects, and UI.
- Define animation coverage as a release contract: idle, move, run, light, heavy, hurt, launch, land, recovery, defeated, victory, rage activation, boss telegraph, background motion, prop reaction, and hazard motion.
- Use original Web Audio or authored audio assets for hit, hurt, break, clear, boss, UI, and ambient feedback.
- Support desktop keyboard and controller input through one normalized action interface. Mobile is out of scope.
- Use local browser persistence for campaign unlocks, scores, modes, cosmetics, and modifiers. No account or server dependency is required.
- Keep the hosted deployment static and browser-friendly, with a documented build and release process.

## Testing Decisions

- Test campaign state through external behavior: start, route progress, side room, chapter clear, boss clear, reward, rank, mode, defeat, restart, replay, and final completion.
- Test chapter data for six unique chapters with valid rosters, routes, rewards, hazards, bosses, and presentation requirements.
- Test normalized keyboard/controller actions through the same interface.
- Test archetypes, boss rules, combat reactions, and animation-state transitions through pure modules where possible.
- Use Playwright to verify title-to-combat entry, narrow viewport layout, pause, restart, route exits, defeat recovery, chapter progression, boss completion, final results, and replay.
- Run unit tests, typecheck, production build, and browser tests before release.
- Add visual smoke checks for nonblank canvas, HUD bounds, title screen, chapter transition, and final results.

## Out of Scope

- Mobile or touch-first release.
- Online multiplayer.
- Global leaderboards.
- Accounts, servers, monetization, ads, energy systems, or live service.
- Multiple playable characters.
- Voice acting or long cinematic scenes.
- Licensed or copied Dad n' Me assets, premise, UI, levels, animations, or characters.
- Procedural infinite content.

## Further Notes

RageBlock remains the working and publishable game name. The current local URL is a development host only; the release target is a stable hosted browser build. A prototype may be used internally to answer design questions, but no player-facing section is complete while it still reads as a prototype or requires developer explanation.
