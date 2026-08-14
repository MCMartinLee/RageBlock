# RageBlock Visual Bible

## Direction

RageBlock uses bold editorial cartooning with thick charcoal outlines, flat punchy color, expressive silhouettes, and fast readable deformation. The protagonist is identified by a teal jacket, yellow shoes, coral Rage Remote, dark messy hair, and yellow scribble eyes. Purple may appear as a UI accent but is not the character identity.

## Palette

- Teal: protagonist and invention language
- Yellow: rage, reward, shoes, impact
- Coral: danger, heavy attacks, boss accents
- Cyan: side routes, Zip mode, utility
- Charcoal: outlines and grounding neutrals
- Off-white: UI contrast and highlights

## Animation Contract

Every visible actor has continuous idle motion. Movement adds vertical bounce and lean. Attacks add anticipation and forward rotation. Hits use squash, flash, sparks, pause, and knockback. Props rotate and bounce. Chapter hazards sweep through the environment. The Hall Monitor lane-lock phase visibly narrows the playable lane.

## Production References

- `public/assets/art/rageblock-protagonist-key-art.png`: generated title composition.
- `public/assets/art/rageblock-hero-atlas.png`: eight-frame hero atlas for idle, run, attack, hurt, and victory states.
- `public/assets/art/rageblock-enemy-atlas.png`: two-state atlas for bully, charger, thrower, and Block Captain silhouettes.
- `public/assets/art/rageblock-prop-atlas.png`: intact and reacted cone, trash can, and ball states.
- `public/assets/art/backgrounds/`: six authored campaign environments.
- `docs/art/rageblock-enemy-roster-reference.png`: roster exploration reference.
- `docs/art/rageblock-environment-atlas-reference.png`: source environment composition before per-chapter crops.

All bitmap art was generated with the built-in image-generation workflow for this project. Phaser drives deterministic frame selection, facing, squash, hit reactions, motion, depth sorting, and effects. The checked-in preparation scripts remove generated checkerboard fields, split the environment atlas, and resize runtime art without relying on an external asset service.

## Generation Briefs

- Hero atlas: one original teal-hoodie hero in a strict 4-by-2 grid; idle, two run poses, jab, heavy wind-up, impact, hurt, and victory; full-body cel-shaded cartoon art with no text or scenery.
- Enemy atlas: four original neighborhood archetypes in a strict 4-by-2 grid; idle and attack rows; coral bully, lime charger, blue thrower, and plum Block Captain.
- Prop atlas: cone, trash can, and playground ball in a strict 3-by-2 grid; intact and reacted states.
- Environment atlas: six text-free 2.5D brawler arenas in a strict 3-by-2 grid; back lot, arcade, apartment courtyard, canal, community fair, and rooftop.

The runtime assets were prepared from those generated outputs using `scripts/prepare-sprite-atlas.ps1`, `scripts/split-environment-atlas.ps1`, and `scripts/resize-game-art.ps1`.
