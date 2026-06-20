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
        await page.wait_for_selector("#splash", state="hidden")

        # 1. Quota Timeline in Settings
        await page.click('button[title="Settings"]')
        await page.wait_for_selector("text=QUOTA USAGE")
        await page.screenshot(path="verification/screenshots/v2_quota_timeline.png")

        # 2. Session Detail Scroll Header
        await page.click('button:has(svg)').first # Back button

        # Start session
        await page.click('button[title="New Session"]')
        await page.fill('textarea', 'Test scroll header')
        await page.click('text=START SESSION')
        await page.wait_for_selector('text=CONFIRM SESSION')
        await page.click('text=START WITHOUT REPOSITORY')

        await page.wait_for_selector('text=CHAT')

        # Scroll down
        await page.evaluate("document.querySelector('div[style*=\"flex-direction: column\"][style*=\"height: 100%\"]').scrollTop = 500")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/v2_scrolled_down.png")

        # Scroll up
        await page.evaluate("window.dispatchEvent(new WheelEvent('wheel', {deltaY: -100}))")
        # Direct scroll might be better
        await page.evaluate("document.querySelector('div[style*=\"flex-direction: column\"][style*=\"height: 100%\"]').scrollTop = 400")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/v2_scrolled_up.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
