# RageBlock

RageBlock is an original browser-based cartoon brawler about a kid with cartoon rage taking on three escalating neighborhood trouble spots: The Back Lot, Arcade Strip, and The Rooftop.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

The current playable build enters through a title screen and contains the combat foundation for the three-chapter campaign. The campaign data lives in `src/campaignDefinition.ts` so arena waves, enemy variants, bosses, and progression can be expanded without rewriting the scene.

## Prototype controls

- WASD or arrow keys: move
- J or left click: light combo
- K or right click: heavy launcher
- Space, Shift, or L: run
- R: restart after Block Cleared or Knocked Out

Attacks pressed during another attack are buffered and fire when the current hit finishes.

## Verify

```bash
npm test
npm run typecheck
npm run build
```
