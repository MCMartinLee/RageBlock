Status: ready-for-agent

# RageBlock Full Game MVP

## Problem Statement

RageBlock has a Combat Feel Prototype, but the real goal is a complete playable cartoon brawler, not an endless prototype loop. The project needs a full-game MVP plan that turns the current sandbox into a short but finished browser game with a beginning, middle, end, replayable combat, readable controls, and a shareable build.

The current prototype also has playtest blockers that must be treated as QA issues: the player silhouette still reads wrong, run input is not reliably felt, and restart can leave the scene in a broken non-moving state.

## Solution

Build RageBlock as a small finished browser brawler with a tight scope:

- title/start flow
- three short schoolyard/neighborhood arenas
- a small enemy roster
- one boss encounter
- polished player controller
- working restart/checkpoint flow
- simple scoring/results
- programmer-art-plus visual pass
- basic SFX/music placeholders
- deployable web build

This MVP should feel like a complete mini-game, not a content-rich commercial release.

## Definition Of Done

- The game starts from a title screen and can be completed in one sitting.
- The player can move, run, attack, take damage, lose, restart, and win reliably.
- The combat loop has clear hit feedback, enemy reactions, and prop chaos.
- There are at least 3 connected arenas with enemy waves.
- There are at least 3 enemy archetypes plus 1 boss.
- The final boss defeat leads to an ending/results screen.
- Controls are visible and accurate.
- Known prototype blockers are fixed.
- The game builds cleanly with tests passing.
- A web build is deployable or ready to upload.

## Out Of Scope

- Online multiplayer.
- Save files.
- Multiple playable characters.
- Large campaign.
- Final commercial art.
- Licensed or copied Dad n' Me assets, characters, UI, levels, premise, or animations.
