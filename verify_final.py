import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # 1. Orientation Lock (Tablet Portrait)
        context_port = await browser.new_context(viewport={'width': 1024, 'height': 1366})
        page_port = await context_port.new_page()
        file_path = "file://" + os.path.abspath("dist/index.html")
        await page_port.goto(file_path)
        await page_port.wait_for_timeout(2000)
        await page_port.screenshot(path="verification/screenshots/final_portrait_lock.png")
        print("Captured final_portrait_lock.png")

        # 2. Refresh Countdown in Session (Desktop for ease of interaction)
        context_desk = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page_desk = await context_desk.new_page()
        await page_desk.goto(file_path)
        await page_desk.wait_for_selector("#splash", state="hidden")

        # We need a session to see the countdown. Let's start one repoless.
        await page_desk.click('button[title="New Session"]')
        await page_desk.fill('textarea', 'Test auto-refresh')
        await page_desk.click('text=START SESSION')
        await page_desk.wait_for_selector('text=CONFIRM SESSION')
        await page_desk.click('text=START WITHOUT REPOSITORY')

        # Wait for session detail to load
        await page_desk.wait_for_selector('text=CHAT')

        # Take screenshot of the countdown area
        await page_desk.screenshot(path="verification/screenshots/final_countdown.png")
        print("Captured final_countdown.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
