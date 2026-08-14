import { expect, test } from "@playwright/test";

test("title and combat canvases are visibly rendered", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  const titleShot = await page.screenshot({ path: testInfo.outputPath("title.png") });
  expect(titleShot.byteLength).toBeGreaterThan(100_000);

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  expect(bounds?.width).toBeGreaterThan(600);
  expect(bounds?.height).toBeGreaterThan(300);
  await page.waitForTimeout(1300);
  const combatShot = await page.screenshot({ path: testInfo.outputPath("combat.png") });
  expect(combatShot.byteLength).toBeGreaterThan(20_000);

  await page.keyboard.press("p");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().paused);
  const pauseShot = await page.screenshot({ path: testInfo.outputPath("pause.png") });
  expect(pauseShot.byteLength).toBeGreaterThan(20_000);
  await page.keyboard.press("p");

  await page.evaluate(() => window.__RAGEBLOCK__!.clearWave());
  await page.keyboard.down(" ");
  await page.keyboard.down("d");
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().chapter === 1);
  await page.keyboard.up("d");
  await page.keyboard.up(" ");
  const transitionShot = await page.screenshot({ path: testInfo.outputPath("transition.png") });
  expect(transitionShot.byteLength).toBeGreaterThan(20_000);

  await page.waitForTimeout(1300);
  await page.evaluate(() => window.__RAGEBLOCK__!.defeatPlayer());
  await page.waitForFunction(() => window.__RAGEBLOCK__!.getState().runEnded);
  const resultShot = await page.screenshot({ path: testInfo.outputPath("result.png") });
  expect(resultShot.byteLength).toBeGreaterThan(20_000);
  await page.keyboard.press("r");
  await page.waitForFunction(() => !window.__RAGEBLOCK__!.getState().runEnded);
  await page.waitForTimeout(1300);
  const replayShot = await page.screenshot({ path: testInfo.outputPath("replay.png") });
  expect(replayShot.byteLength).toBeGreaterThan(20_000);
});
