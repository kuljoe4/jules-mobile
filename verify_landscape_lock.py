import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Simulate an iPad Pro in Portrait (834x1194 or 1024x1366)
        context = await browser.new_context(viewport={'width': 834, 'height': 1194})
        page = await context.new_page()

        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)

        # Wait for splash to disappear or just wait a bit
        await page.wait_for_timeout(2000)

        # Take screenshot to see the overlay
        await page.screenshot(path="verification/screenshots/tablet_portrait_lock.png")
        print("Captured tablet_portrait_lock.png")

        # Now simulate Landscape
        await page.set_viewport_size({'width': 1194, 'height': 834})
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/tablet_landscape_ready.png")
        print("Captured tablet_landscape_ready.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
