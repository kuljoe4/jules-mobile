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

        # 1. Check Quota Timeline in Settings
        await page.click('button[title="Settings"]')
        await page.wait_for_selector("text=QUOTA USAGE")
        await page.screenshot(path="verification/screenshots/v_quota_timeline.png")
        print("Captured v_quota_timeline.png")

        # 2. Check Countdown in Session Detail
        # Go back to main
        await page.click('button[title="Close Settings"]')

        # Start a repoless session
        await page.click('button[title="New Session"]')
        await page.fill('textarea', 'Verifying refresh countdown')
        await page.click('text=START SESSION')
        await page.wait_for_selector('text=CONFIRM SESSION')
        await page.click('text=START WITHOUT REPOSITORY')

        # Wait for CHAT tab
        await page.wait_for_selector('text=CHAT')
        await page.wait_for_timeout(2000) # Let it settle
        await page.screenshot(path="verification/screenshots/v_session_countdown.png")
        print("Captured v_session_countdown.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
