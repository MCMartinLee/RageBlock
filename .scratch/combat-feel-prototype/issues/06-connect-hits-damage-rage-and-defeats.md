# 06 - Connect Hits, Damage, Rage, And Defeats

**What to build:** Player attacks damage and defeat bully weirdos, enemy attacks damage the player, rage empowers one heavy hit, and defeated enemies count toward clearing the block.

**Blocked by:** 04 - Make Player Attacks Work In Scene; 05 - Add Bully Weirdos With Simple Pressure AI

**Status:** resolved

- [x] Player attacks only damage bully weirdos inside plausible hit range.
- [x] Light combo hits damage bully weirdos and the final hit knocks them back more strongly.
- [x] Heavy attacks launch or wall-bounce bully weirdos.
- [x] Landing hits fills the rage meter.
- [x] A full rage meter empowers the next heavy attack.
- [x] The empowered heavy attack launches bully weirdos farther and spends the rage meter.
- [x] Defeated bully weirdos are removed or clearly marked defeated.
- [x] The prototype tracks total bully weirdos defeated toward the count of 8.
- [x] Enemy attacks increase the player's damage taken stats and reduce player health.

## Answer

Connected scene attacks to bully weirdo damage, knockback, launch reactions, defeat marking, rage gain and spend, defeat counting, and damage-taken stats. Added a Phaser-free hit detection seam for attack ranges and knockback direction.
