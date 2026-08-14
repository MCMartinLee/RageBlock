Status: ready-for-agent
Triage: ready-for-agent

## Problem Statement

RageBlock now has a working three-stage brawler MVP, but it does not yet provide the larger original identity, campaign progression, character variety, presentation quality, or replay value needed for a commercial-scale game. The next version needs to grow the combat foundation into a coherent six-chapter browser campaign without losing the mischievous cartoon chaos and readable heavy hits that define the project.

## Solution

Build a six-chapter RageBlock campaign about a kid recovering a confiscated homemade Rage Remote before sunset. Each neighborhood chapter is a short connected route with a main path, optional side rooms, a distinct enemy faction, environmental hazards, and a chapter boss. The player selects one of three Rage Remote modes before each chapter: Crash for stronger knockback, Zip for movement and recovery speed, or Junkstorm for prop-based attacks.

The commercial presentation uses bold editorial cartooning: strong silhouettes, expressive faces, limited punchy colors, hand-drawn impact marks, distinctive faction costumes, and readable combat animation. The UI uses a sticker-covered handheld-device language with chunky health and Rage Remote meters, chapter stamps, score badges, and clear iconography.

## User Stories

1. As a player, I want a clear premise, so that each chapter has a reason to exist.
2. As a player, I want to recover Rage Remote components, so that campaign progress feels motivated.
3. As a player, I want six distinct neighborhood chapters, so that the game feels larger than a single arena.
4. As a player, I want a short main route, so that a first campaign run remains approachable.
5. As a player, I want optional side rooms, so that exploration can reward skilled play.
6. As a player, I want chapter-specific enemies, so that each location feels mechanically different.
7. As a player, I want Crash, Zip, and Junkstorm modes, so that I can choose a combat style.
8. As a player, I want Rage mode effects to be readable, so that I understand why my attacks changed.
9. As a player, I want chain reactions to build Rage, so that environmental creativity is rewarded.
10. As a player, I want bosses to change arena rules, so that bosses are more than health bars.
11. As a player, I want boss attacks to telegraph clearly, so that difficulty feels fair.
12. As a player, I want expressive idle and victory behavior, so that the kid feels like a character.
13. As a player, I want enemy silhouettes to be distinct at a glance, so that I can prioritize threats.
14. As a player, I want strong anticipation and recovery animation, so that attacks feel physical.
15. As a player, I want a readable handheld-device HUD, so that health, Rage, score, and chapter state are easy to scan.
16. As a player, I want chapter scores and rank results, so that replaying has a goal.
17. As a player, I want challenge modifiers, so that completed chapters remain interesting.
18. As a player, I want unlockable rage effects and costume colors, so that replay has visible rewards.
19. As a desktop player, I want keyboard and controller support, so that I can use my preferred input.
20. As a player, I want reliable restart and checkpoint behavior, so that failure is low-friction.
21. As a player, I want original characters, art, UI, levels, premise, and animation, so that RageBlock stands on its own.
22. As a developer, I want campaign rules separated from Phaser rendering, so that progression can be tested without a browser scene.
23. As a developer, I want chapter content data-driven, so that new factions and routes do not require rewriting combat flow.
24. As a developer, I want a polished first chapter before producing all final assets, so that art investment follows proven gameplay.

## Implementation Decisions

- Add one campaign runtime seam that owns chapter index, route state, Rage Remote mode, component collection, score, rank, modifiers, boss completion, and ending state.
- Keep combat rules, hit detection, pressure AI, and presentation helpers as the primary existing seams consumed by the campaign runtime.
- Represent chapter content as data: title, setting, route nodes, enemy roster, hazards, optional rooms, boss, reward, and palette.
- Support six chapters: The Back Lot, Arcade Strip, Apartment Maze, Canal Walk, Community Fair, and Rooftop Relay.
- Use a short connected route with optional side rooms and visible exits. Main route completion advances the chapter; side rooms provide score, props, or unlock rewards.
- Make Crash, Zip, and Junkstorm mutually exclusive chapter loadouts. Crash modifies knockback, Zip modifies movement and recovery, and Junkstorm enables nearby prop launches.
- Build bosses around arena-rule changes: moving hazards, decoys, lane locks, or other readable state changes.
- Keep one playable protagonist. Use expression, posture, rage eyes, costume colors, and animation states for personality rather than dialogue-heavy scenes.
- Establish animation states for idle, move, run, light, heavy, hurt, launch, land, defeated, victory, and rage activation. Prioritize anticipation, impact, hit reaction, and recovery.
- Use a sticker/handheld-device HUD with health, Rage Remote mode, Rage meter, chapter stamp, score, combo, objective, pause, and boss health.
- Add keyboard and gamepad input through a normalized input layer; preserve the current keyboard controls.
- Add lightweight original bitmap or sprite assets only after the first chapter’s silhouettes, camera, combat spacing, and animation timing are approved.
- Use original sound and music placeholders during implementation, then replace them with a cohesive commercial audio pass.

## Testing Decisions

- Test campaign state transitions as pure external behavior: chapter start, side-room completion, chapter clear, boss clear, restart, defeat, mode selection, score, rank, and modifier application.
- Test mode effects through public campaign/combat behavior rather than private scene fields.
- Test chapter data for six valid chapters, unique identifiers, enemy roster coverage, bosses, rewards, and route exits.
- Test boss rule changes as state transitions with readable telegraph data.
- Extend Playwright coverage from title screen to one complete chapter, restart after defeat, controller-independent keyboard play, pause/resume, and final results.
- Keep existing unit-test patterns for combat, pressure, attack presentation, hit detection, and player controller behavior.
- Add a production-build check after each presentation or asset integration pass.

## Out of Scope

- Online multiplayer.
- Multiple playable characters.
- Real-money purchases, ads, energy timers, or live-service systems.
- Licensed or copied Dad n' Me assets, premise, UI, levels, animations, or characters.
- Full voice acting or cinematic dialogue scenes.
- Mobile-first touch controls before desktop/controller combat is stable.
- Procedural infinite levels.

## Further Notes

RageBlock remains the working title and repository name. The MVP remains the combat foundation. Commercial art should be produced chapter-by-chapter, beginning with a fully polished first chapter rather than creating a large asset library before the route and combat loop are locked.
