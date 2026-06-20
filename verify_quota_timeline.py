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

        # Wait for splash to disappear
        await page.wait_for_selector("#splash", state="hidden")

        # Click Settings button
        await page.get_by_role("button", name="Settings", exact=True).click()

        # Wait for Quota Section
        await page.wait_for_selector("text=QUOTA USAGE")

        # Take screenshot of the timeline
        await page.screenshot(path="verification/screenshots/quota_timeline_final.png", full_page=True)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
