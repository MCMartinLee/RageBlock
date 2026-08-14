import { expect, test } from "@playwright/test";

test("title and combat canvases are visibly rendered", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  const titleShot = await page.screenshot();
  expect(titleShot.byteLength).toBeGreaterThan(100_000);

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  expect(bounds?.width).toBeGreaterThan(600);
  expect(bounds?.height).toBeGreaterThan(300);
  const combatShot = await page.screenshot();
  expect(combatShot.byteLength).toBeGreaterThan(20_000);
});
