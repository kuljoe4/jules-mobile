import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = 'file://' + path.join(path.dirname(__dirname), 'index.html');

test.describe('Jules Mobile Enhancements Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      window.localStorage.setItem('jac_key', 'test-api-key');
      window.localStorage.setItem('jac_plan', 'free');
      // Set registry for recovery display
      const t_old = new Date(Date.now() - 23 * 3600000).toISOString();
      const registry = { 's1': new Date(t_old).getTime() };
      window.localStorage.setItem('jac_session_registry', JSON.stringify(registry));
    });

    const t_old = new Date(Date.now() - 23 * 3600000).toISOString();
    await page.route('**/sessions?**', async route => {
      await route.fulfill({
        json: {
          sessions: [{
            id: 's1',
            title: 'Verification Session',
            createTime: t_old,
            state: 'IN_PROGRESS',
            updateTime: t_old
          }]
        }
      });
    });

    await page.route('**/sessions/s1/activities?**', async route => {
      await route.fulfill({
        json: {
          activities: [
            {
              id: 'a1',
              createTime: t_old,
              progressUpdated: { title: 'Code Review', description: 'High-density review content with 11px font verification.' }
            },
            {
              id: 'a2',
              createTime: t_old,
              agentMessaged: { agentMessage: 'Ready for submission.' }
            }
          ]
        }
      });
    });

    await page.goto(INDEX_PATH);
    await page.waitForSelector('#splash.hidden', { state: 'attached' });
  });

  test('capture enhancements', async ({ page }) => {
    // 1. Settings
    await page.click('nav button:has-text("SETTINGS")');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.screenshot({ path: '/home/jules/verification/settings_quota.png' });

    // 2. Chat with Filters
    await page.click('nav button:has-text("SESSIONS")');
    await page.click('text=Verification Session');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/home/jules/verification/chat_filters.png' });

    // 3. Reviews Tab
    await page.click('div[style*="display: flex; padding-bottom:"] button:has-text("REVIEWS")');
    await page.screenshot({ path: '/home/jules/verification/reviews_tab.png' });
  });
});
