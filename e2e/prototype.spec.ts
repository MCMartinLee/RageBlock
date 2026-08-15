import { expect, test, type Page } from "@playwright/test";

type RageBlockState = ReturnType<NonNullable<Window["__RAGEBLOCK__"]>["getState"]>;

async function startGame(page: Page, modeKey?: "1" | "2" | "3") {
  await page.goto("/");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  expect(await page.evaluate(() => window.__RAGEBLOCK_TITLE_LAYOUT_OK__)).toBe(true);
  if (modeKey) await page.keyboard.press(modeKey);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
}

async function clearPhaseAndExit(page: Page, chapter: number, expectedPhase: "climax" | "next") {
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction(({ expected, phase }) => {
    const state = window.__RAGEBLOCK__!.getState();
    return phase === "climax" ? state.chapter === expected && state.phase === "climax" : state.runEnded || state.chapter > expected;
  }, { expected: chapter, phase: expectedPhase });
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
}

async function defeatBossWithRealCombat(page: Page) {
  for (let step = 0; step < 160; step += 1) {
    const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
    const boss = state.enemies.find((enemy) => enemy.isBoss);
    if (!boss) return;
    if (state.runEnded) throw new Error(`Player was defeated by the Block Captain with ${boss.health} boss health remaining`);
    if (await dodgeNearbyHazard(page, state)) continue;
    const dx = boss.x - state.player.x;
    const dy = boss.y - state.player.y;
    if (state.bossRule === "charge" && !state.bossTelegraphing) {
      const dodgeKey = Math.abs(dy) > 20 ? (dy > 0 ? "w" : "s") : state.player.y > 390 ? "w" : "s";
      await page.keyboard.down(" ");
      await tapMove(page, dodgeKey, 110);
      await page.keyboard.up(" ");
    } else if (dy < -42 || dy > 4) {
      await tapMove(page, dy < -42 ? "w" : "s", 65);
    } else if (Math.abs(dx) > 142) {
      await tapMove(page, dx > 0 ? "d" : "a", 65);
    } else if (Math.abs(dx) < 50) {
      const retreatKey = state.player.x > 820 ? "a" : state.player.x < 140 ? "d" : dx >= 0 ? "a" : "d";
      await tapMove(page, retreatKey, 45);
    } else {
      await tapMove(page, dx > 0 ? "d" : "a", 18);
      await page.keyboard.press("k");
      await page.waitForTimeout(330);
    }
  }
  const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  const boss = state.enemies.find((enemy) => enemy.isBoss);
  throw new Error(`Block Captain survived with ${boss?.health ?? 0} health; player ${state.health} at (${state.player.x}, ${state.player.y})`);
}

async function tapMove(page: Page, key: "w" | "a" | "s" | "d", duration = 55) {
  await page.keyboard.down(key);
  await page.waitForTimeout(duration);
  await page.keyboard.up(key);
}

async function dodgeNearbyHazard(page: Page, state: RageBlockState): Promise<boolean> {
  if (!state.hazardKind || state.hazardX === 0) return false;
  const dx = state.hazardX - state.player.x;
  const dy = state.hazardY - state.player.y;
  const avoidRadius = state.hazardKind === "sweeping-antenna" ? 190 : state.hazardKind === "parade-float" ? 125 : 92;
  if (Math.hypot(dx, dy) > avoidRadius) return false;

  const dodgeHorizontally = state.hazardKind === "flicker-sign" || state.hazardKind === "sweeping-antenna";
  const key = dodgeHorizontally
    ? state.player.x > 820 ? "a" : state.player.x < 140 ? "d" : dx >= 0 ? "a" : "d"
    : state.player.y > 455 ? "w" : state.player.y < 285 ? "s" : dy >= 0 ? "w" : "s";
  await page.keyboard.down(" ");
  await tapMove(page, key, 105);
  await page.keyboard.up(" ");
  return true;
}

async function defeatWaveWithRealCombat(page: Page) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
    if (state.runEnded) throw new Error(`Player was defeated in chapter ${state.chapter + 1} ${state.phase} at ${state.health} health; player (${state.player.x}, ${state.player.y}); enemies ${JSON.stringify(state.enemies)}`);
    if (state.exitOpen) return;
    if (state.enemies.length === 0) {
      await page.waitForTimeout(80);
      continue;
    }
    if (await dodgeNearbyHazard(page, state)) continue;

    const enemy = state.enemies.reduce((nearest, candidate) => {
      const nearestDistance = Math.hypot(nearest.x - state.player.x, nearest.y - state.player.y);
      const candidateDistance = Math.hypot(candidate.x - state.player.x, candidate.y - state.player.y);
      return candidateDistance < nearestDistance ? candidate : nearest;
    });
    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;

    if (dy < -42) await tapMove(page, "w");
    else if (dy > 4) await tapMove(page, "s");
    else if (Math.abs(dx) > 142) await tapMove(page, dx > 0 ? "d" : "a", 70);
    else if (Math.abs(dx) < 46) {
      const retreatKey = state.player.x > 820 ? "a" : state.player.x < 140 ? "d" : dx >= 0 ? "a" : "d";
      await tapMove(page, retreatKey, 45);
    }
    else {
      await tapMove(page, dx > 0 ? "d" : "a", 18);
      await page.keyboard.press("k");
      await page.waitForTimeout(335);
    }
  }
  const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  throw new Error(`Real combat timed out in chapter ${state.chapter + 1} ${state.phase}; player ${state.health} at (${state.player.x}, ${state.player.y}); enemies ${JSON.stringify(state.enemies)}`);
}

async function takeRightExit(page: Page, chapter: number, phase: "climax" | "next") {
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction(({ currentChapter, expectedPhase }) => {
    const state = window.__RAGEBLOCK__!.getState();
    return expectedPhase === "climax"
      ? state.chapter === currentChapter && state.phase === "climax"
      : state.runEnded || state.chapter > currentChapter;
  }, { currentChapter: chapter, expectedPhase: phase }, { timeout: 20_000 });
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
}

test("restart restores movement and Space run changes player speed", async ({ page }) => {
  await startGame(page);

  const start = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  const walked = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);

  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
  const ran = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);

  await page.keyboard.press("r");
  await page.waitForTimeout(250);
  const restarted = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  const movedAfterRestart = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);

  expect(walked).toBeGreaterThan(start);
  expect(ran - walked).toBeGreaterThan(walked - start);
  expect(restarted).toBeCloseTo(start, 0);
  expect(movedAfterRestart).toBeGreaterThan(restarted);
});

test("real movement and combo attacks defeat an active enemy", async ({ page }) => {
  await startGame(page);

  for (let step = 0; step < 100; step += 1) {
    const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
    if (state.defeated > 0) break;
    const enemy = state.enemies[0];
    if (!enemy) {
      await page.waitForTimeout(80);
      continue;
    }

    const dx = enemy.x - state.player.x;
    const dy = enemy.y - state.player.y;
    if (Math.abs(dy) > 24) {
      await page.keyboard.down(dy > 0 ? "s" : "w");
      await page.waitForTimeout(70);
      await page.keyboard.up(dy > 0 ? "s" : "w");
    } else if (Math.abs(dx) > 112 || dx < 38) {
      await page.keyboard.down(dx > 0 ? "d" : "a");
      await page.waitForTimeout(70);
      await page.keyboard.up(dx > 0 ? "d" : "a");
    } else {
      await page.keyboard.press("j");
      await page.waitForTimeout(180);
    }
  }

  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().defeated)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hitAudioEvents)).toBeGreaterThan(0);
});

test("optional side room requires combat and does not advance the main route", async ({ page }, testInfo) => {
  await startGame(page);
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.keyboard.down(" ");
  await page.keyboard.down("a");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().phase === "side");
  await page.keyboard.up("a");
  await page.keyboard.up(" ");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().sideCacheHealth)).toBe(12);
  await page.waitForTimeout(1300);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudBoundsOk)).toBe(true);
  const sideRoomShot = await page.screenshot({ path: testInfo.outputPath("side-room.png") });
  expect(sideRoomShot.byteLength).toBeGreaterThan(20_000);
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.keyboard.down("d");
  await page.waitForTimeout(40);
  await page.keyboard.up("d");
  await page.keyboard.press("k");
  await page.waitForTimeout(340);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().sideRewarded)).toBe(false);
  await page.keyboard.press("k");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().sideRewarded);
  const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(state.score).toBe(250);
  expect(state.routeNode).toBe(0);
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().phase === "climax");
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().routeNode)).toBe(1);
});

test("authored ranged enemies execute their browser combat special", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("rageblock-campaign-v1", JSON.stringify({ chapterIndex: 1, unlockedChapters: [0, 1], completed: false }));
    localStorage.setItem("rageblock-start-chapter", "1");
  });
  await startGame(page);
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().enemySpecialsFired > 0, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().enemySpecialsFired)).toBeGreaterThan(0);
});

test("chapter hazards launch props or enemies into chain reactions", async ({ page }) => {
  await startGame(page);
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().hazardChainHits > 0, undefined, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hazardChainHits)).toBeGreaterThan(0);
});

test("the persistent objective changes from combat to route navigation", async ({ page }) => {
  await startGame(page);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudObjectiveText)).not.toContain("Choose");
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().exitOpen);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudObjectiveText)).toContain("Choose");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudBoundsOk)).toBe(true);
});

test("signature set pieces switch to dedicated broken artwork", async ({ page }) => {
  await startGame(page);
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  while (await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x < 675)) await tapMove(page, "d", 70);
  while (await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.y < 450)) await tapMove(page, "s", 55);
  await page.keyboard.press("k");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().props.some((prop) => prop.kind === "tire-stack" && prop.broken));
  const tireStack = await page.evaluate(() => window.__RAGEBLOCK__!.getState().props.find((prop) => prop.kind === "tire-stack"));
  expect(tireStack?.frame).toBe(6);
});

test("a completed title save can start a fresh advancing campaign", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("rageblock-campaign-v1", JSON.stringify({
      chapterIndex: 5,
      routeNode: 0,
      recoveredRewards: ["crash-core", "zip-core", "sticker-pack", "junkstorm-core", "rage-eyes", "sunset-freedom"],
      score: 12000,
      defeats: 0,
      completed: true,
      mode: "zip",
      modifiers: ["speed-up", "recovery-up"],
      unlockedModes: ["crash", "zip", "junkstorm"],
      unlockedChapters: [0, 1, 2, 3, 4, 5],
      cosmetics: ["classic", "sunset-remote"],
      bestScore: 12000
    }));
    localStorage.setItem("rageblock-start-chapter", "0");
  });
  await startGame(page);
  const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(state.chapter).toBe(0);
  expect(state.completed).toBe(false);
  expect(state.replay).toBe(false);
});

test("title and combat HUD remain usable on a narrow desktop viewport", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 720 });
  await startGame(page);
  await expect(page.locator("canvas")).toBeVisible();
  const contextMenuCanceled = await page.locator("canvas").evaluate((canvas) => !canvas.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })));
  expect(contextMenuCanceled).toBe(true);
  const bounds = await page.locator("canvas").boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(720);
  await page.keyboard.down("a");
  await page.waitForTimeout(40);
  await page.keyboard.up("a");
  await page.keyboard.press("p");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().paused);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudBoundsOk)).toBe(true);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hudObjectiveText)).toContain("OBJECTIVE");
  const pausedAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);
  const hazardAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().hazardX);
  const gameplayTimeAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().gameplayTime);
  const enemiesAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().enemies.length);
  const cacheAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().sideCacheHealth);
  await page.mouse.click(360, 360);
  await page.keyboard.down("d");
  await page.waitForTimeout(750);
  await page.keyboard.up("d");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x)).toBeCloseTo(pausedAt, 1);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().hazardX)).toBeCloseTo(hazardAt, 1);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().gameplayTime)).toBeCloseTo(gameplayTimeAt, 1);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().enemies.length)).toBe(enemiesAt);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().sideCacheHealth)).toBe(cacheAt);
  await page.keyboard.press("p");
  await page.waitForFunction(() => !window.__RAGEBLOCK__!.getState().paused);
});

test("campaign advances through every route, victory, replay, and title", async ({ page }) => {
  await startGame(page, "2");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().mode)).toBe("zip");

  for (let chapter = 0; chapter < 6; chapter += 1) {
    await clearPhaseAndExit(page, chapter, "climax");
    await clearPhaseAndExit(page, chapter, "next");
  }

  const ending = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(ending.completed).toBe(true);
  expect(ending.runEnded).toBe(true);

  await page.keyboard.press("r");
  await page.waitForFunction(() => {
    const state = window.__RAGEBLOCK__!.getState();
    return !state.completed && !state.runEnded && state.chapter === 0;
  });
  await page.keyboard.press("t");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  expect(await page.evaluate(() => window.localStorage.getItem("rageblock-mode"))).toBe("zip");
});

test("the complete required campaign is beatable using only player controls", async ({ page }) => {
  test.setTimeout(240_000);
  await startGame(page, "2");

  for (let chapter = 0; chapter < 6; chapter += 1) {
    await defeatWaveWithRealCombat(page);
    await takeRightExit(page, chapter, "climax");
    if (chapter === 5) await defeatBossWithRealCombat(page);
    else await defeatWaveWithRealCombat(page);
    await takeRightExit(page, chapter, "next");
  }

  const ending = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(ending.completed).toBe(true);
  expect(ending.runEnded).toBe(true);
  expect(ending.score).toBeGreaterThanOrEqual(10_000);
});

test("checkpoint, selected mode, defeat, and retry survive browser reloads", async ({ page }) => {
  await startGame(page, "3");
  await clearPhaseAndExit(page, 0, "climax");
  await clearPhaseAndExit(page, 0, "next");
  await page.reload();
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__RAGEBLOCK__?.getState().chapter === 1);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().mode)).toBe("junkstorm");

  await clearPhaseAndExit(page, 1, "climax");
  await page.evaluate(() => window.__RAGEBLOCK__!.defeatPlayer());
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().runEnded);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().completed)).toBe(false);
  await page.keyboard.press("r");
  await page.waitForFunction(() => {
    const state = window.__RAGEBLOCK__!.getState();
    return !state.runEnded && state.chapter === 1 && state.phase === "climax";
  });
});

test("an unlocked older chapter can be replayed without losing the active checkpoint", async ({ page }) => {
  await startGame(page);
  await clearPhaseAndExit(page, 0, "climax");
  await clearPhaseAndExit(page, 0, "next");
  await clearPhaseAndExit(page, 1, "climax");
  await clearPhaseAndExit(page, 1, "next");
  await page.keyboard.press("t");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  await page.keyboard.press("q");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__RAGEBLOCK__?.getState().replay === true);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().chapter)).toBe(1);
  await clearPhaseAndExit(page, 1, "climax");
  await clearPhaseAndExit(page, 1, "next");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().runEnded)).toBe(true);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().resultRewardText)).toBe("Zip Core");
  await page.keyboard.press("t");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  expect(await page.evaluate(() => window.__RAGEBLOCK_TITLE_LAYOUT_OK__)).toBe(true);
  const savedReplay = await page.evaluate(() => JSON.parse(window.localStorage.getItem("rageblock-campaign-v1")!));
  expect(savedReplay.chapterIndex).toBe(2);
  expect(savedReplay.modifiers).toContain("arcade-mastery");
  expect(savedReplay.cosmetics).toContain("token-crew-colors");
  await page.keyboard.press("e");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__RAGEBLOCK__?.getState().chapter === 2);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().replay)).toBe(false);
});

test("the final boss is defeated through real combat and completes the campaign", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    localStorage.setItem("rageblock-campaign-v1", JSON.stringify({
      chapterIndex: 5,
      routeNode: 0,
      recoveredRewards: ["crash-core", "zip-core", "sticker-pack", "junkstorm-core", "rage-eyes"],
      score: 9000,
      defeats: 40,
      completed: false,
      mode: "crash",
      modifiers: ["knockback-up"],
      unlockedModes: ["crash", "zip", "junkstorm"],
      unlockedChapters: [0, 1, 2, 3, 4, 5],
      cosmetics: ["classic"],
      bestScore: 9000
    }));
    localStorage.setItem("rageblock-start-chapter", "5");
  });
  await startGame(page);
  await clearPhaseAndExit(page, 5, "climax");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().enemies.some((enemy) => enemy.isBoss));
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().bossTelegraphing)).toBe(true);
  await page.waitForFunction(() => !window.__RAGEBLOCK__!.getState().bossTelegraphing);
  await page.waitForTimeout(1300);
  const bossShot = await page.screenshot({ path: testInfo.outputPath("boss-arena.png") });
  expect(bossShot.byteLength).toBeGreaterThan(20_000);
  await defeatBossWithRealCombat(page);
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().runEnded);
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
  const ending = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(ending.completed).toBe(true);
  expect(ending.runEnded).toBe(true);
  expect(ending.hudScoreText).toBe(`Score ${ending.score}`);
  expect(ending.hudActionText).toBe("CAMPAIGN CLEAR");
  const victoryShot = await page.screenshot({ path: testInfo.outputPath("victory.png") });
  expect(victoryShot.byteLength).toBeGreaterThan(20_000);
});
