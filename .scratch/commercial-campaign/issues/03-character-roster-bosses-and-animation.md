# 03 - Character Roster Bosses And Animation

**What to build:** Expand the brawler into a character-driven campaign with distinct enemy factions, bosses that change arena rules, and a complete readable animation-state language.

**Blocked by:** 01 - Campaign Runtime And Rage Remote Modes; 02 - Connected Routes And Environmental Combat

**Status:** in-progress

- [x] Five enemy archetypes have distinct silhouettes, pressure patterns, counters, and telegraphs.
- [x] Three bosses have visible health, two or more readable attacks, and arena-rule changes.
- [x] The protagonist supports idle, move, run, light, heavy, hurt, launch, land, defeated, victory, and rage activation states.
- [ ] Enemy and boss reactions communicate hit, stagger, launch, recovery, and defeat clearly.
- [ ] Boss completion advances the campaign and produces a meaningful reward.
- [x] Unit tests cover archetype behavior; browser smoke coverage remains for boss rule transitions.

## Progress

Archetype definitions now provide health, approach behavior, telegraphs, and counters, and the scene tracks the shared player animation-state vocabulary. Boss phases now cycle through pressure, charge, and lane-lock telegraphs. Full arena-rule effects, animation presentation, and browser boss coverage remain open.
