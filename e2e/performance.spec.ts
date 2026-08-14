import { expect, test } from "@playwright/test";

test("startup payload and frame cadence stay inside the release budget", async ({ page }) => {
  const startedAt = Date.now();
  await page.goto("/");
  await page.waitForFunction(() => window.__RAGEBLOCK_TITLE_READY__ === true);
  expect(Date.now() - startedAt).toBeLessThan(10_000);

  const artBytes = await page.evaluate(() => performance
    .getEntriesByType("resource")
    .filter((entry) => entry.name.includes("/assets/art/"))
    .reduce((total, entry) => total + ((entry as PerformanceResourceTiming).transferSize || (entry as PerformanceResourceTiming).encodedBodySize), 0));
  expect(artBytes).toBeLessThan(5_000_000);

  await page.keyboard.press("Enter");
  await page.waitForFunction(() => Boolean(window.__RAGEBLOCK__));
  const averageFrameMs = await page.evaluate(() => new Promise<number>((resolve) => {
    const samples: number[] = [];
    let previous = performance.now();
    const sample = (now: number) => {
      samples.push(now - previous);
      previous = now;
      if (samples.length < 60) requestAnimationFrame(sample);
      else resolve(samples.slice(1).reduce((sum, value) => sum + value, 0) / (samples.length - 1));
    };
    requestAnimationFrame(sample);
  }));
  expect(averageFrameMs).toBeLessThan(process.env.CI ? 200 : 40);
});
