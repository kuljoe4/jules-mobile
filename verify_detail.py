import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await context.new_page()

        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)
        await page.evaluate("localStorage.setItem('jac_key', 'AIza_fake')")
        await page.reload()
        await page.wait_for_selector("#splash", state="hidden")

        await page.click("text=NEW")
        await page.fill("textarea", "Verifying the UI")
        await page.click("text=ASSIGN TO JULES")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/v_confirm_modal.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
