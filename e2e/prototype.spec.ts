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
