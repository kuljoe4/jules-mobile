import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()
        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)
        await page.wait_for_selector("#splash", state="hidden")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification/screenshots/debug_main.png")

        # Print all button titles
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            title = await btn.get_attribute('title')
            text = await btn.inner_text()
            print(f"Button: title='{title}', text='{text}'")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
