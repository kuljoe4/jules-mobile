import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844}) # iPhone 13
        page = await context.new_page()

        # Load the production build
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

        # Wait for splash to disappear
        await page.wait_for_selector("#splash", state="hidden")

        # Click Settings button in bottom nav
        await page.click("text=SETTINGS")

        # Wait for Quota Section
        await page.wait_for_selector("text=QUOTA USAGE")

        # Give it a second to render markers
        await page.wait_for_timeout(1000)

        # Take screenshot of the timeline
        await page.screenshot(path="verification/screenshots/quota_timeline_final.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
