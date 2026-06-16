import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = 'file://' + path.join(path.dirname(__dirname), 'index.html');

test.use({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

test('Capture Final UI Enhancements', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('jac_key', 'test-key');
    localStorage.setItem('jac_repo_stats', JSON.stringify({
      'owner/repo1': 5,
      'owner/repo2': 2
    }));
  });

  const t_now = new Date().toISOString();

  await page.route('**/sources?**', async route => {
    await route.fulfill({
      json: {
        sources: [
          { name: 'owner/repo1', githubRepo: { owner: 'owner', repo: 'repo1', branches: [{displayName: 'main'}] } },
          { name: 'owner/repo2', githubRepo: { owner: 'owner', repo: 'repo2', branches: [{displayName: 'develop'}] } }
        ]
      }
    });
  });

  await page.route('**/sessions?**', async route => {
    await route.fulfill({
      json: {
        sessions: [{
          id: 's1',
          title: 'Verification Session',
          createTime: t_now,
          state: 'AWAITING_USER_FEEDBACK',
          updateTime: t_now,
          repository: 'owner/repo1',
          branch: 'main'
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
            createTime: t_now,
            agentMessaged: { agentMessage: 'How should I proceed?' }
          }
        ]
      }
    });
  });

  await page.goto(INDEX_PATH);
  await page.waitForSelector('#splash.hidden', { state: 'attached' });

  // 1. New Session Form
  console.log('Capturing New Session Form...');
  await page.click('button:has-text("NEW")');
  await page.fill('textarea[placeholder*="Describe the coding task"]', 'Implement a new authentication flow with OAuth2 support.');
  await page.screenshot({ path: 'test-results/final_new_session.png' });

  // 2. Confirmation Modal
  console.log('Capturing Confirmation Modal...');
  await page.click('button:has-text("ASSIGN TO JULES")');
  await page.waitForSelector('text=CONFIRM SESSION');
  await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; }' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/final_confirm_modal_summary.png' });

  await page.click('input[placeholder="Search repositories..."]', { force: true });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/final_confirm_modal_picker.png' });

  await page.mouse.click(10, 10);
  await page.click('button:has-text("CANCEL")');

  // 3. Followup Composer
  console.log('Capturing Followup Composer...');
  await page.click('button:has-text("SESSIONS")');
  await page.waitForSelector('text=Verification Session', { timeout: 10000 });
  await page.click('text=Verification Session');

  // Wait for detail view
  await page.waitForSelector('text=How should I proceed?', { timeout: 10000 });

  const followupTextarea = page.locator('textarea[placeholder*="Message Jules"]');
  await followupTextarea.waitFor({ state: 'visible' });
  await followupTextarea.fill('Please focus on security first. Ensure all tokens are encrypted.');

  // Toggle a persona in followup
  await page.click('text=UI/UX');

  await page.screenshot({ path: 'test-results/final_followup_composer.png' });
});
