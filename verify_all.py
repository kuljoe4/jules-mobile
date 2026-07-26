import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1. Verify Quota Timeline in Settings (Mobile)
        context = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await context.new_page()
        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)

        # Inject fake API key and some session data to trigger quota
        await page.evaluate("""() => {
            localStorage.setItem('jac_key', 'AIza_fake_key');
            const now = new Date().toISOString();
            const reg = {
                'sess1': now,
                'sess2': new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                'sess3': new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                'sess4': new Date(Date.now() - 1000 * 60 * 60 * 2.1).toISOString()
            };
            localStorage.setItem('jac_session_registry', JSON.stringify(reg));
        }""")

        await page.reload()
        await page.wait_for_selector("#splash", state="hidden")

        # Click Settings button in bottom nav
        await page.click("text=SETTINGS")
        await page.wait_for_selector("text=DAILY USAGE")
        await page.screenshot(path="verification/screenshots/final_quota_timeline.png")
        print("Captured final_quota_timeline.png")

        # 2. Verify New Session Repo Highlight
        # Click SESSIONS in bottom nav to go back to list
        await page.click("nav >> text=SESSIONS")

        # On mobile, we click the bottom nav tab NEW
        await page.click("nav >> text=NEW")
        await page.fill('textarea', 'Test task')
        await page.click('text=ASSIGN TO JULES →')
        await page.wait_for_selector('text=CONFIRM SESSION')

        # Take screenshot of the pulsed input
        await page.screenshot(path="verification/screenshots/final_modal_highlight.png")
        print("Captured final_modal_highlight.png")

        # Focus input and check if pulse stops (visually)
        await page.focus('input[placeholder="Search repositories..."]')
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/final_modal_interacted.png")
        print("Captured final_modal_interacted.png")

        # 3. Verify Orientation Lock (Tablet Landscape)
        context_tablet = await browser.new_context(viewport={'width': 1024, 'height': 768})
        page_tablet = await context_tablet.new_page()
        await page_tablet.goto(file_path)
        await page_tablet.wait_for_selector("#splash", state="hidden")
        await page_tablet.wait_for_timeout(1000) # Wait for CSS to settle
        await page_tablet.screenshot(path="verification/screenshots/final_tablet_lock.png")
        print("Captured final_tablet_lock.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
