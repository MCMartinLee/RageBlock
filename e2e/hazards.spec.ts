import { expect, test } from "@playwright/test";

const HAZARDS = ["rolling-tire", "flicker-sign", "laundry-cart", "runaway-scooter", "parade-float", "sweeping-antenna"] as const;

for (const [chapter, hazard] of HAZARDS.entries()) {
  test(`chapter ${chapter + 1} renders its authored ${hazard} hazard`, async ({ page }, testInfo) => {
    await page.addInitScript(({ chapterIndex }) => {
      localStorage.setItem("rageblock-campaign-v1", JSON.stringify({
        chapterIndex,
        unlockedChapters: Array.from({ length: chapterIndex + 1 }, (_, index) => index),
        completed: false
      }));
      localStorage.setItem("rageblock-start-chapter", String(chapterIndex));
    }, { chapterIndex: chapter });
    await page.goto("/");
    await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
    await page.keyboard.press("Enter");
    await page.waitForFunction((expected) => window.__RAGEBLOCK__?.getState().hazardKind === expected, hazard);
    await page.waitForTimeout(1100);
    const state = await page.evaluate(() => window.__RAGEBLOCK__!.getState());
    expect(state.hazardKind).toBe(hazard);
    expect(state.hudBoundsOk).toBe(true);
    const shot = await page.screenshot({ path: testInfo.outputPath(`${hazard}.png`) });
    expect(shot.byteLength).toBeGreaterThan(20_000);
  });
}
