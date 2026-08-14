import { expect, test, type Page } from "@playwright/test";

async function startGame(page: Page, modeKey?: "1" | "2" | "3") {
  await page.goto("/");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  if (modeKey) await page.keyboard.press(modeKey);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
}

async function clearWaveAndExit(page: Page, chapter: number) {
  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction((expected) => {
    const state = window.__RAGEBLOCK__!.getState();
    return expected === 5 ? state.runEnded : state.chapter > expected;
  }, chapter);
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
});

test("title and combat HUD remain usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startGame(page);
  await expect(page.locator("canvas")).toBeVisible();
  const bounds = await page.locator("canvas").boundingBox();
  expect(bounds?.width).toBeLessThanOrEqual(390);
  await page.keyboard.press("p");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().paused);
  const pausedAt = await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x);
  await page.keyboard.down("d");
  await page.waitForTimeout(180);
  await page.keyboard.up("d");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().player.x)).toBeCloseTo(pausedAt, 1);
  await page.keyboard.press("p");
  await page.waitForFunction(() => !window.__RAGEBLOCK__!.getState().paused);
});

test("campaign advances through every route, victory, replay, and title", async ({ page }) => {
  await startGame(page, "2");
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().mode)).toBe("zip");

  for (let chapter = 0; chapter < 6; chapter += 1) {
    await clearWaveAndExit(page, chapter);
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

test("checkpoint, selected mode, defeat, and retry survive browser reloads", async ({ page }) => {
  await startGame(page, "3");
  await clearWaveAndExit(page, 0);
  await page.reload();
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => window.__RAGEBLOCK__?.getState().chapter === 1);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().mode)).toBe("junkstorm");

  await page.evaluate(() => window.__RAGEBLOCK__!.defeatPlayer());
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().runEnded);
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().completed)).toBe(false);
  await page.keyboard.press("r");
  await page.waitForFunction(() => {
    const state = window.__RAGEBLOCK__!.getState();
    return !state.runEnded && state.chapter === 1;
  });
});
