import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = 'file://' + path.join(path.dirname(__dirname), 'index.html');

test.describe('Quota Recovery Display', () => {
  test.beforeEach(async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Mock localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('jac_key', 'test-api-key');
      window.localStorage.setItem('jac_plan', 'free');
    });

    // Mock API
    const t_old = new Date(Date.now() - 23 * 3600000).toISOString();
    await page.route('**/sessions?**', async route => {
      const json = {
        sessions: [{
          id: 's1',
          title: 'Old Session',
          createTime: t_old,
          state: 'COMPLETED',
          updateTime: t_old
        }]
      };
      await route.fulfill({ json });
    });

    await page.goto(INDEX_PATH);
    // Wait for splash to hide
    await page.waitForSelector('#splash.hidden', { state: 'attached' });
  });

  test('shows recovery time in Settings', async ({ page }) => {
    await page.click('nav button:has-text("SETTINGS")');
    // Scroll to bottom where Quota section is
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    const recoveryText = page.locator('text=NEXT SLOT RECOVERY:');
    await expect(recoveryText).toBeVisible({ timeout: 10000 });

    // Check font size (should be 11px or more)
    const fontSize = await recoveryText.evaluate(el => window.getComputedStyle(el).fontSize);
    expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(11);
  });

  test('shows recovery time in Session List Header tooltip', async ({ page }) => {
    const quotaHeader = page.locator('div[title*="QUOTA USAGE"]');
    await expect(quotaHeader).toBeVisible();

    const title = await quotaHeader.getAttribute('title');
    expect(title).toContain('Next Recovery:');
  });
});
