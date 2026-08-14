# 07 - Add Heavy Hit Feedback

**What to build:** Hits produce hit pause, knockback, restrained screen shake, hit sparks, squash/stretch, and brief invulnerability flash.

**Blocked by:** 06 - Connect Hits, Damage, Rage, And Defeats

**Status:** resolved

- [x] Successful hits create a brief hit pause.
- [x] Successful hits apply visible knockback.
- [x] Heavy hits and empowered heavy hits create restrained screen shake.
- [x] Successful hits create readable hit sparks at the impact point.
- [x] Hit bully weirdos briefly squash or stretch.
- [x] Damaged characters flash briefly to show hit or invulnerability state.
- [x] Feedback makes heavy hits feel weighty without making the prototype hard to read.

## Answer

Implemented hit feedback for successful attacks: brief hit pause, restrained shake on heavier hits, readable sparks, squash/stretch reactions, and flash overlays for damaged characters. Added a pure hit feedback seam with tests for intensity and restraint.
