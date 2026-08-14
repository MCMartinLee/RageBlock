# 01 - Fix Prototype Playtest Blockers

**What to build:** Fix the current obvious playtest blockers before expanding the game: player silhouette alignment, reliable run input, and restart restoring movement/enemy behavior.

**Blocked by:** None - can start immediately.

**Status:** resolved

- [x] The player no longer has a misaligned black shape above the head.
- [x] Space, Shift, and L produce an obvious run/fast-move state while held.
- [x] Controls still work after pressing R to restart.
- [x] Enemy movement still works after pressing R to restart.
- [x] Restart clears old tweens, timers, hit pause, overlays, and input state.
- [x] The fix is verified in-browser, not only by automated tests.

## Answer

Added a Phaser `init` reset path, captured movement/action keys, reset time scale and input on restart, replaced the black hair triangle with an aligned small hair shape, added visible run-state feedback, and added a Playwright browser smoke test covering run speed and movement after restart.
