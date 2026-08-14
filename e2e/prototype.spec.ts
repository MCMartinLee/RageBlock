import { expect, test } from "@playwright/test";

test("restart restores movement and Space run changes player speed", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));

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

test("title and combat HUD remain usable on a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
  await page.keyboard.press("p");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
});

test("campaign advances through route exits to the ending", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
  expect(await page.evaluate(() => window.__RAGEBLOCK__!.getState().mode)).toBe("zip");

  for (let chapter = 0; chapter < 6; chapter += 1) {
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

  const ending = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
  expect(ending.completed).toBe(true);
  expect(ending.runEnded).toBe(true);
});
