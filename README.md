# RageBlock

RageBlock is an original, desktop-browser, single-player cartoon brawler. A kid with a stolen Rage Remote crosses six neighborhood blocks, knocks exaggerated troublemakers into scenery, raids optional side rooms, and faces the Block Captain at sunset.

**Play the release:** https://mcmartinlee.github.io/RageBlock/

## How To Play

- `WASD` or arrow keys: move
- `J` or left click: light combo
- `K` or right click: heavy launcher
- `Space`, `Shift`, or `L`: run
- `P`: pause or resume
- `R`: restart, retry a checkpoint, or replay after victory
- `T`: return to the title
- `Q` / `E` on the title screen: choose an unlocked chapter

A standard gamepad is supported: left stick moves, `A` attacks or starts, `B` launches, right trigger runs, Menu pauses, `Y` restarts, and View returns to the title. On the title screen, the bumpers choose a Rage mode and the D-pad chooses an unlocked chapter.

Choose Crash, Zip, or Junkstorm mode on the title screen. Each chapter has its own crew silhouette treatment, encounter composition, signature breakable set piece, moving hazard, main route, optional side room with a guarded combat cache, and climax. Defeating enemies restores a little health, and authored encounter boundaries provide a full refresh. Replaying cleared chapters unlocks mastery modifiers and crew color sets, including during a fresh campaign replay after victory. Campaign checkpoints, chapter unlocks, cosmetics, best score, rewards, mastery, and the selected mode persist in local browser storage.

## Run Locally

Requires Node.js 22 or newer.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Verify

```bash
npm run verify
npm run build
```

The release suite covers a hazard-aware control-only title-to-ending campaign clear, all twelve required campaign phases, optional side rooms, environmental chain reactions, checkpoint persistence, pause-clock integrity, defeat and retry, fresh post-victory campaigns, mastery replay and reward naming, a warned real-input boss clear, victory, title return, six hazard renders, narrow desktop layout geometry, visual states, startup payload, and frame cadence.

## Release Maintenance

Every push to `main` runs [the Pages workflow](.github/workflows/deploy-pages.yml). It installs dependencies, runs unit, type, browser, visual, and performance checks, creates a Vite build with the `/RageBlock/` base path, and deploys `dist` to GitHub Pages. A failed verification prevents deployment.

Campaign content is defined in `src/campaignDefinition.ts`. Runtime progression and persistence live in `src/campaignRuntime.ts` and `src/campaignPersistence.ts`. Art direction and the reproducible asset-preparation pipeline are documented in `docs/art/visual-bible.md` and `scripts/`.
