# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/screenshots.spec.js >> Jules Mobile Enhancements Screenshots >> capture enhancements
- Location: tests/screenshots.spec.js:59:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('div[style*="display: flex; padding-bottom:"] button:has-text("REVIEWS")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: ⚠️
    - generic [ref=e6]:
      - generic [ref=e7]: OPENED FROM FILE:// — PWA INSTALL UNAVAILABLE
      - generic [ref=e8]: "Chrome requires HTTP/HTTPS to install PWAs. Serve this file locally:"
      - generic [ref=e9]:
        - text: "# Python (any machine)"
        - text: python3 -m http.server 8080
        - text: "# Node / npx"
        - text: npx serve . -p 8080
        - text: "# Termux"
        - text: pkg install python && python3 -m http.server 8080
      - generic [ref=e10]:
        - text: Then open
        - generic [ref=e11]: http://localhost:8080/index.html
        - text: in Chrome.
    - button "×" [ref=e12] [cursor=pointer]
  - generic [ref=e14]:
    - generic [ref=e16]:
      - button [ref=e17] [cursor=pointer]:
        - img [ref=e18]
      - generic [ref=e21]: Verification Session
      - generic [ref=e22]:
        - button "Refresh activity" [ref=e23] [cursor=pointer]:
          - img [ref=e24]
        - generic "WORKING" [ref=e26]:
          - img [ref=e28]
    - generic:
      - generic: "ID: s1"
    - generic [ref=e30]:
      - button "CHAT" [ref=e31] [cursor=pointer]
      - button "PROMPT" [ref=e32] [cursor=pointer]
      - button "DIFF" [ref=e33] [cursor=pointer]
    - generic [ref=e34]:
      - generic [ref=e35]:
        - img [ref=e38]
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]: Code Review
            - generic [ref=e44]: 08:18 PM
          - generic [ref=e45]:
            - generic [ref=e47]: REVIEW
            - generic [ref=e51]: High-density review content with 11px font verification.
      - generic [ref=e52]:
        - generic [ref=e53]: J
        - generic [ref=e54]:
          - generic [ref=e60]: Ready for submission.
          - generic [ref=e61]:
            - generic [ref=e62]: JULES
            - generic [ref=e63]: ·
            - generic [ref=e64]: 21c
            - generic [ref=e65]: ·
            - generic [ref=e66]: 08:18 PM
            - generic [ref=e67]: ·
            - button "COPY" [ref=e68] [cursor=pointer]:
              - img [ref=e69]
              - text: COPY
    - generic [ref=e71]:
      - generic [ref=e72]:
        - textbox "Message Jules or give new instructions…" [ref=e73]
        - button "Expand" [ref=e75] [cursor=pointer]:
          - img [ref=e76]
        - button [disabled] [ref=e78]:
          - img [ref=e79]
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]: ↵ SEND · SHIFT+↵ NEWLINE
          - generic [ref=e84]: 0c
        - generic [ref=e85]:
          - generic "Total activities loaded" [ref=e86]: 2 ITEMS
          - generic "Estimated activity data size" [ref=e88]: 277B
    - button "Scroll to top" [ref=e89] [cursor=pointer]:
      - img [ref=e90]
  - navigation [ref=e92]:
    - button "SESSIONS" [ref=e93] [cursor=pointer]:
      - img [ref=e95]
      - generic [ref=e97]: SESSIONS
    - button "ARCHIVE" [ref=e98] [cursor=pointer]:
      - img [ref=e100]
      - generic [ref=e102]: ARCHIVE
    - button "NEW" [ref=e103] [cursor=pointer]:
      - img [ref=e105]
      - generic [ref=e107]: NEW
    - button "SETTINGS" [ref=e108] [cursor=pointer]:
      - img [ref=e110]
      - generic [ref=e112]: SETTINGS
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import path from 'path';
  3  | import { fileURLToPath } from 'url';
  4  |
  5  | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  6  | const INDEX_PATH = 'file://' + path.join(path.dirname(__dirname), 'index.html');
  7  |
  8  | test.describe('Jules Mobile Enhancements Screenshots', () => {
  9  |   test.beforeEach(async ({ page }) => {
  10 |     await page.setViewportSize({ width: 390, height: 844 });
  11 |
  12 |     await page.addInitScript(() => {
  13 |       window.localStorage.setItem('jac_key', 'test-api-key');
  14 |       window.localStorage.setItem('jac_plan', 'free');
  15 |       // Set registry for recovery display
  16 |       const t_old = new Date(Date.now() - 23 * 3600000).toISOString();
  17 |       const registry = { 's1': new Date(t_old).getTime() };
  18 |       window.localStorage.setItem('jac_session_registry', JSON.stringify(registry));
  19 |     });
  20 |
  21 |     const t_old = new Date(Date.now() - 23 * 3600000).toISOString();
  22 |     await page.route('**/sessions?**', async route => {
  23 |       await route.fulfill({
  24 |         json: {
  25 |           sessions: [{
  26 |             id: 's1',
  27 |             title: 'Verification Session',
  28 |             createTime: t_old,
  29 |             state: 'IN_PROGRESS',
  30 |             updateTime: t_old
  31 |           }]
  32 |         }
  33 |       });
  34 |     });
  35 |
  36 |     await page.route('**/sessions/s1/activities?**', async route => {
  37 |       await route.fulfill({
  38 |         json: {
  39 |           activities: [
  40 |             {
  41 |               id: 'a1',
  42 |               createTime: t_old,
  43 |               progressUpdated: { title: 'Code Review', description: 'High-density review content with 11px font verification.' }
  44 |             },
  45 |             {
  46 |               id: 'a2',
  47 |               createTime: t_old,
  48 |               agentMessaged: { agentMessage: 'Ready for submission.' }
  49 |             }
  50 |           ]
  51 |         }
  52 |       });
  53 |     });
  54 |
  55 |     await page.goto(INDEX_PATH);
  56 |     await page.waitForSelector('#splash.hidden', { state: 'attached' });
  57 |   });
  58 |
  59 |   test('capture enhancements', async ({ page }) => {
  60 |     // 1. Settings
  61 |     await page.click('nav button:has-text("SETTINGS")');
  62 |     await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  63 |     await page.screenshot({ path: '/home/jules/verification/settings_quota.png' });
  64 |
  65 |     // 2. Chat with Filters
  66 |     await page.click('nav button:has-text("SESSIONS")');
  67 |     await page.click('text=Verification Session');
  68 |     await page.waitForTimeout(500);
  69 |     await page.screenshot({ path: '/home/jules/verification/chat_filters.png' });
  70 |
  71 |     // 3. Reviews Tab
> 72 |     await page.click('div[style*="display: flex; padding-bottom:"] button:has-text("REVIEWS")');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  73 |     await page.screenshot({ path: '/home/jules/verification/reviews_tab.png' });
  74 |   });
  75 | });
  76 |
```