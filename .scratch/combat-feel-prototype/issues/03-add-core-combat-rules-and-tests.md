# 03 - Add Core Combat Rules And Tests

**What to build:** A pure gameplay rules layer for combo progression, damage, rage fill/spend, defeat count, and Block Cleared conditions, covered by fast tests.

**Blocked by:** 01 - Scaffold Browser Prototype

**Status:** resolved

- [x] The combat rules can be tested without booting the Phaser scene.
- [x] Tests cover 3-hit light combo progression and combo reset behavior.
- [x] Tests cover heavy attack outcomes separately from light attacks.
- [x] Tests cover damage and defeat counting.
- [x] Tests cover rage meter fill from landed hits.
- [x] Tests cover spending a full rage meter to empower one heavy attack.
- [x] Tests cover Block Cleared becoming true after 8 bully weirdos are defeated.

## Answer

Implemented a Phaser-free combat rules module covering light combo progression, heavy attack outcomes, damage, rage fill and spend, defeat counting, and the Block Cleared condition. Added fast Vitest coverage at the pure rules seam.
