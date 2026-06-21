import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 1200})
        page = await context.new_page()

        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)

        # Inject sessions created ~24h ago to trigger resets NOW
        await page.evaluate("""() => {
            localStorage.setItem('jac_key', 'AIza_fake');
            const now = Date.now();
            const reg = {};
            // Inject sessions around 24h ago
            // One every 2 minutes for 10 minutes, centered at 24h ago
            for (let i = 0; i < 10; i++) {
                const ts = now - (24 * 60 * 60 * 1000) - (5 * 60 * 1000) + (i * 2 * 60 * 1000);
                reg['s' + i] = new Date(ts).toISOString();
            }
            localStorage.setItem('jac_session_registry', JSON.stringify(reg));
        }""")

        await page.reload()
        await page.wait_for_selector("#splash", state="hidden")

        await page.click("text=SETTINGS")
        await page.wait_for_timeout(1000)

        quota_label = page.locator("text=DAILY USAGE")
        await quota_label.scroll_into_view_if_needed()
        await page.wait_for_timeout(2000)

        await page.screenshot(path="verification/screenshots/stagger_verify_active.png")
        print("Captured stagger_verify_active.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
