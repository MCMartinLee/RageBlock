# 04 - Make Player Attacks Work In Scene

**What to build:** The player can perform the 3-hit light combo and heavy launcher in the Phaser scene, with plausible hit ranges and visible attack states.

**Blocked by:** 02 - Build Schoolyard Corner Movement Sandbox; 03 - Add Core Combat Rules And Tests

**Status:** resolved

- [x] Pressing J or left click performs a light attack.
- [x] Repeated light attacks advance through a 3-hit combo.
- [x] The final light combo hit has a stronger knockback intent than the earlier hits.
- [x] Pressing K or right click performs a slower heavy attack.
- [x] The heavy attack has a launcher or wall-bounce intent.
- [x] Light and heavy attacks have distinct timing and visible attack states.
- [x] Attack hit ranges are readable and tied to the player's facing direction.

## Answer

Implemented scene-level player attacks for light combo and heavy launcher inputs. Added a Phaser-free attack presentation seam that makes combo finishers and heavy attacks visibly distinct and facing-aware.
