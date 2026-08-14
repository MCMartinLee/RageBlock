Status: ready-for-agent

# Combat Feel Prototype

## Problem Statement

The project needs a first playable proof that RageBlock can feel good as an original cartoon brawler. The current idea is clear enough to build, but the core risk is not story, menus, or polished art; it is whether moving, attacking, launching bully weirdos, surviving pressure, and clearing a schoolyard corner feels satisfying in the browser.

The prototype should prove the feel of the game without copying Dad n' Me's characters, Dad framing, exact premise, UI, level structure, animations, assets, or title.

## Solution

Build a Phaser 3 browser prototype for RageBlock focused on the Combat Feel Prototype. The player controls a kid with cartoon rage in a fixed schoolyard corner arena, moves with 2.5D brawler movement, fights bully weirdos with a simple combo and heavy launcher, builds a rage meter, breaks or bounces a few props, and clears the block after defeating 8 enemies.

The prototype should use programmer art silhouettes, readable effects, and strong feedback. It should not attempt final art, a full level, narrative progression, or production menus.

## User Stories

1. As a player, I want to open the prototype in a browser, so that I can immediately try the Combat Feel Prototype.
2. As a player, I want the game to start directly in the schoolyard corner, so that I can test combat without menu friction.
3. As a player, I want to move left and right, so that I can approach and retreat from bully weirdos.
4. As a player, I want to move up and down on the ground plane, so that combat has 2.5D brawler spacing.
5. As a player, I want movement to preserve a side-view brawler read, so that depth movement does not make the action confusing.
6. As a player, I want keyboard controls for movement, attacks, dash, and jump, so that the prototype is playable without setup.
7. As a player, I want WASD and arrow keys to both support movement, so that I can use my preferred keyboard layout.
8. As a player, I want a light attack, so that I can quickly hit nearby enemies.
9. As a player, I want a 3-hit light combo, so that repeated attacks have rhythm and escalation.
10. As a player, I want the last light combo hit to knock enemies back, so that a completed combo feels meaningful.
11. As a player, I want a heavy attack, so that I can choose a slower but stronger hit.
12. As a player, I want the heavy attack to launch or wall-bounce enemies, so that heavy hits feel chunky.
13. As a player, I want light and heavy attacks to have distinct timing, so that they feel like different choices.
14. As a player, I want attacks to connect only when enemies are in plausible range, so that positioning matters.
15. As a player, I want successful hits to cause hit pause, so that impact is readable.
16. As a player, I want successful hits to cause knockback, so that attacks visibly move enemies.
17. As a player, I want successful hits to create small screen shake, so that heavy hits have weight.
18. As a player, I want successful hits to create hit sparks, so that impact points are visible.
19. As a player, I want enemies to squash or stretch briefly when hit, so that reactions feel cartoonish.
20. As a player, I want damaged characters to flash briefly, so that invulnerability and damage states are readable.
21. As a player, I want a rage meter that fills when I land hits, so that offense builds toward a payoff.
22. As a player, I want a full rage meter to empower my next heavy attack, so that rage has a small mechanical effect.
23. As a player, I want the empowered heavy attack to launch enemies farther, so that spending rage feels obvious.
24. As a player, I want the rage meter to reset after the empowered heavy attack, so that the loop is clear.
25. As a player, I want bully weirdos to spawn into the schoolyard corner, so that there is pressure to fight.
26. As a player, I want bully weirdos to idle or taunt before engaging, so that they have personality.
27. As a player, I want bully weirdos to approach me, so that I am not fighting stationary targets.
28. As a player, I want bully weirdos to shove attack, so that enemies can threaten me.
29. As a player, I want bully weirdos to back off after attacking, so that the pressure has a readable rhythm.
30. As a player, I want one or two bully weirdos to use a short charge, so that enemy pressure has a little variety.
31. As a player, I want bully weirdos to have varied silhouettes, so that enemies are readable even with programmer art.
32. As a player, I want bully weirdos to be exaggerated and toy-like, so that the action stays in mischievous chaos rather than realistic violence.
33. As a player, I want the player to have health, so that enemy pressure matters.
34. As a player, I want to take damage from enemy attacks, so that mistakes have consequences.
35. As a player, I want the sandbox to be forgiving, so that early tuning focuses on feel rather than difficulty.
36. As a player, I want a restart option when I lose, so that I can quickly try again.
37. As a player, I want 2-3 destructible or bouncy props in the arena, so that toybox chaos appears early.
38. As a player, I want props such as cones, trash cans, or a loose ball/crate, so that the schoolyard corner feels physical.
39. As a player, I want props to bounce, break, or react when hit, so that attacks affect more than enemies.
40. As a player, I want a fixed arena camera, so that the entire schoolyard corner remains visible during prototype tuning.
41. As a player, I want the arena boundaries to be clear, so that I understand where fighting can happen.
42. As a player, I want the prototype to end after 8 bully weirdos are defeated, so that there is a concrete goal.
43. As a player, I want a Block Cleared result screen, so that I know the sandbox is complete.
44. As a player, I want the Block Cleared screen to show time, hits landed, and damage taken, so that I can compare runs.
45. As a developer, I want programmer art silhouettes, so that combat readability can be tuned before final art.
46. As a developer, I want the combat rules to be testable without booting the full Phaser scene, so that behavior can be changed safely.
47. As a developer, I want the Phaser scene to keep game objects organized by role, so that later prototype tickets can extend it.
48. As a developer, I want the browser prototype to run locally with a simple dev command, so that iteration stays fast.
49. As a developer, I want the implementation to avoid proprietary Dad n' Me assets or direct recreations, so that RageBlock remains original.
50. As a developer, I want the first prototype to avoid full-game systems, so that scope stays focused on combat feel.

## Implementation Decisions

- Build the Combat Feel Prototype as a Phaser 3 browser game.
- Start the game directly in a fixed schoolyard corner arena, without a production menu flow.
- Use keyboard-first controls: WASD or arrow keys for movement, J or left click for light attack, K or right click for heavy attack, L or Shift for dash, and Space for jump.
- Use 2.5D brawler movement on a ground plane rather than strict lanes.
- Use a 3-hit light combo where the final hit produces a stronger knockback finisher.
- Use a slower heavy attack that launches enemies or produces a wall-bounce style reaction.
- Make cartoon rage mechanically meaningful but small: landing hits fills a rage meter, and a full meter empowers the next heavy attack into a larger launch.
- Use bully weirdos as the first enemy archetype.
- Implement simple pressure AI for bully weirdos: idle or taunt, approach, shove attack, then back off.
- Add a small amount of enemy variety by allowing one or two bully weirdos to perform a short charge.
- Give the player health and a fast restart path.
- End the sandbox after 8 bully weirdos are defeated.
- Show a Block Cleared result with time, hits landed, and damage taken.
- Include 2-3 simple props, such as cones, trash cans, and a loose ball or crate, that bounce, break, or react to hits.
- Prioritize hit feedback: hit pause, knockback, restrained screen shake, squash/stretch, hit sparks, and brief invulnerability flash.
- Use programmer art silhouettes and readable placeholder effects. Do not spend prototype time on final art.
- Keep the prototype original: do not copy Dad n' Me's character design, Dad framing, exact premise, UI, level structure, animations, assets, or title.

## Testing Decisions

- Test external behavior rather than implementation details. A good test should describe what the player or developer can observe: movement changes position, attacks damage enemies, rage empowers a heavy hit, and defeating 8 enemies produces Block Cleared.
- Use the highest practical seam for acceptance: the browser prototype should boot into the Combat Feel Prototype and support the full sandbox loop.
- Add a pure combat rules seam for fast tests around combo progression, attack outcomes, rage meter fill/spend, damage, defeat count, and Block Cleared conditions.
- Add scene-level checks for Phaser behavior where visual or object orchestration matters: player spawn, bully weirdo spawn, attack feedback triggers, restart behavior, and result screen display.
- Because the repo is currently greenfield, there is no existing test prior art to reuse. Establish lightweight test conventions with the first implementation tickets.

## Out of Scope

- Final title selection beyond the working project name RageBlock.
- Final character art, final enemy art, animation polish, music, and full sound design.
- A scrolling campaign level.
- Boss fights.
- Multiple player characters.
- Save data, unlocks, upgrades, or progression.
- Mobile controls.
- Online play.
- Production menus.
- A full story.
- Recreating Dad n' Me's characters, premise, UI, level structure, animations, assets, or title.

## Further Notes

The most important evaluation question is whether the combat has heavy hits and toybox chaos. The prototype should be judged by feel: movement readability, attack timing, enemy reactions, and how satisfying it is to clear the block.

The current repo uses local markdown issues. Follow-up tickets for this effort should live under `.scratch/combat-feel-prototype/issues/`.
