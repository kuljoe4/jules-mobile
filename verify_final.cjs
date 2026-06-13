const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 }
  });
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Enter key if needed (simulated)
  await page.evaluate(() => localStorage.setItem('jac_key', 'test_key'));
  await page.reload();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'final_desktop.png' });

  // Check settings
  await page.click('button[title="Settings"], button:has-text("SETTINGS")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'final_settings.png' });

  await browser.close();
  console.log('Verification screenshots saved.');
})();
