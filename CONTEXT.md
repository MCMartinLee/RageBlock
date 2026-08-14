# RageBlock

RageBlock is an original, browser-only, single-player cartoon brawler intended to reach the quality bar of a commercial game. “Commercial” describes finish quality and player readiness, not a requirement to sell the game.

## Product Boundary

RageBlock must be a complete playable game, not a prototype, sandbox, tech demo, or developer-facing test. A player must be able to open the hosted browser build, understand the premise and controls without developer instructions, complete the campaign, replay chapters, and experience a visually and audibly coherent product.

The release target is desktop browser play with keyboard and controller support. Mobile, online multiplayer, global leaderboards, accounts, monetization, and multiple playable characters are outside the first publishable game.

## Language

**Real playable game**:
A finished player experience with a beginning, campaign progression, authored encounters, clear failure and victory states, replay value, complete presentation, and no placeholder-only content required to understand or finish the game.
_Avoid_: prototype, sandbox, developer instructions, unfinished route, test room

**Commercial-quality bar**:
The quality target for presentation and usability. It requires original prepared art, animation for characters, enemies, props, hazards, and backgrounds, readable UI, sound, reliable input, stable browser performance, and a complete player flow. It does not imply a paid release.
_Avoid_: programmer-art-only, graybox-only, feature-complete-but-unpresented

**Cartoon brawler**:
A side-scrolling action game built around exaggerated close-range combat, enemy waves, environmental reactions, and readable hit feedback.
_Avoid_: Dad n' Me clone, remake

**Kid with cartoon rage**:
The protagonist fantasy: a mischievous kid whose frustration turns ordinary neighborhood conflict into expressive slapstick chaos.
_Avoid_: copied character framing, purple identity, realistic victimization

**RageBlock**:
The working and publishable game name. The repository and game identity use RageBlock unless a later naming decision replaces it.

**Rage Remote**:
The homemade invention driving the premise. The protagonist crosses the neighborhood to recover its confiscated components before sunset.

**Rage mode**:
A chapter loadout that changes how the player expresses anger. Crash improves knockback, Zip improves movement and recovery, and Junkstorm enables prop-based attacks.

**Rage eyes**:
The protagonist’s heightened visual state when anger builds. They are an animated character expression, not merely a HUD effect.

**Neighborhood weirdos**:
Original exaggerated opponents and factions. They are characterized opponents in a playful fictional world, not realistic civilians or victims.

**Mischievous chaos**:
The intended tone: playful troublemaking with bite, where combat is rowdy, funny, and expressive rather than cruel, grim, or graphic.

**Heavy hits**:
The combat identity: attacks communicate force through anticipation, impact animation, hit pause, knockback, hit reaction, recovery, restrained camera response, and environmental consequences.

**2.5D brawler movement**:
Ground-plane movement where characters move horizontally and through depth in a side-view composition while preserving readable spacing.
_Avoid_: strict lanes, unreadable depth stacking

**Rage meter**:
A combat resource filled through successful attacks and chain reactions. It changes available power and must have clear visual and animation feedback.

**Chain reaction**:
A player-created sequence in which an attack launches an enemy, prop, hazard, or another enemy into a further interaction. Chain reactions reward positioning and environmental awareness.

**Campaign chapter**:
One authored neighborhood setting with a main route, optional side content, enemy faction, environmental rules, objective, reward, and boss or climax.

**Main route**:
The reliable path through a chapter that a first-time player can follow without developer guidance.

**Side room**:
Optional chapter content offering score, rewards, challenge, props, or alternate encounters without blocking the main campaign indefinitely.

**Boss rule**:
A readable arena or encounter rule that changes how a boss fight is played, such as moving hazards, decoys, or lane locks. A boss rule is more than extra health.

**Animation-complete presentation**:
The minimum visual standard for release: background motion, environmental object motion, prop reactions, character states, enemy states, boss telegraphs, attack anticipation, hit reactions, launches, landings, defeat, victory, and rage activation are all intentionally animated.

**Sticker-device HUD**:
The UI language: chunky handheld-device panels, chapter stamps, expressive icons, health and Rage Remote meters, score, combo, objective, pause, and boss information. It must remain readable at supported browser sizes.

**Publishable browser build**:
A hosted desktop-browser build that starts from a title screen and can be completed, replayed, and understood without developer instructions. It includes original prepared presentation, stable input, responsive framing, tested restart and pause behavior, and release documentation.

**Prototype**:
A retired milestone name for the early combat experiment. The current product goal is the complete publishable game; prototype work is accepted only as an internal development method and must not remain the player-facing experience.

**Programmer art**:
Temporary development material used only while a behavior, camera, or timing decision is being proven. It is not acceptable as the final presentation for a completed chapter or release build.

## Core Premise

The kid’s homemade Rage Remote has been confiscated and broken into components by neighborhood authorities and weird local factions. Before sunset, the kid crosses six escalating locations to recover the components, confront the people controlling each block, and reclaim the invention. The story is communicated through the world, character animation, short readable moments, and the escalating rules of each chapter rather than developer-facing explanation.

## Campaign Shape

The publishable campaign contains six chapters: The Back Lot, Arcade Strip, Apartment Maze, Canal Walk, Community Fair, and Rooftop Relay. Each chapter has a main route, optional side rooms, a distinct faction mix, animated environmental identity, a meaningful reward, and a climax. The campaign is designed for a focused first run and replay through scores, ranks, rage modes, modifiers, and cosmetic unlocks.

## Quality Gate

RageBlock is not complete when the rules merely work. It is complete when the full browser experience is playable from title screen to ending, all required characters, enemies, props, hazards, and backgrounds are visually prepared and animated, the UI communicates without developer instruction, audio supports the action, the campaign can be replayed, and automated checks protect the release flow.
