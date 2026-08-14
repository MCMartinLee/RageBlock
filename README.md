# RageBlock

RageBlock is an original browser-based cartoon brawler prototype focused on heavy hits, 2.5D movement, bully weirdos, and toybox chaos.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

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
