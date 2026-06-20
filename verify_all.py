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
        await page.wait_for_selector("#splash", state="hidden")

        # Click Settings button by title
        await page.click('button[title="Settings"]')
        await page.wait_for_selector("text=QUOTA USAGE")
        await page.screenshot(path="verification/screenshots/final_quota_timeline.png")
        print("Captured final_quota_timeline.png")

        # 2. Verify New Session Repo Highlight
        await page.click('button[title="Close Settings"]') # Close settings if desktop, or just go back
        # Since it's mobile, we need to click the back button in settings
        back_btn = page.locator('button:has(svg)').first # The back arrow
        await back_btn.click()

        await page.click('button[title="New Session"]')
        await page.fill('textarea', 'Test task')
        await page.click('text=START SESSION')
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
