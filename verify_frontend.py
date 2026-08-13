import os
import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to http://localhost:8080")
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    print("Setting mock API key in localStorage...")
    page.evaluate("localStorage.setItem('jac_key', 'AIzaSyFakeKeyFormVerificationTesting123')")
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1500)

    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    print("Taking dashboard screenshot...")
    page.screenshot(path="/home/jules/verification/screenshots/dashboard.png")
    page.wait_for_timeout(500)

    print("Opening settings...")
    settings_btn = page.locator("button[aria-label='Settings']")
    if settings_btn.is_visible():
        settings_btn.click()
        page.wait_for_timeout(1000)

        # Let's test and capture the DESIGN LAB tab!
        design_tab = page.locator("button:has-text('DESIGN LAB')")
        if design_tab.is_visible():
            design_tab.click()
            page.wait_for_timeout(1000)

            print("Taking Design Lab Side-by-Side screenshot...")
            page.screenshot(path="/home/jules/verification/screenshots/design_side_by_side.png")
            page.wait_for_timeout(500)

            # Scroll down to show timeline pairs breakdown!
            page.evaluate("""
                const el = Array.from(document.querySelectorAll('div')).find(d => d.style.overflowY === 'auto' || d.style.overflow === 'auto');
                if (el) el.scrollTop = 500;
            """)
            page.wait_for_timeout(1000)

            print("Taking Design Lab Timeline Pairs screenshot...")
            page.screenshot(path="/home/jules/verification/screenshots/design_timeline_pairs.png")
            page.wait_for_timeout(500)

            # Switch back to top scroll
            page.evaluate("""
                const el = Array.from(document.querySelectorAll('div')).find(d => d.style.overflowY === 'auto' || d.style.overflow === 'auto');
                if (el) el.scrollTop = 0;
            """)
            page.wait_for_timeout(500)

            current_pill = page.locator("button:has-text('CURRENT STYLE')")
            if current_pill.is_visible():
                current_pill.click()
                page.wait_for_timeout(500)
                print("Taking Design Lab Current treatment screenshot...")
                page.screenshot(path="/home/jules/verification/screenshots/design_current.png")
                page.wait_for_timeout(500)

            simplified_pill = page.locator("button:has-text('SIMPLIFIED (DOT+TINT)')")
            if simplified_pill.is_visible():
                simplified_pill.click()
                page.wait_for_timeout(500)
                print("Taking Design Lab Simplified treatment screenshot...")
                page.screenshot(path="/home/jules/verification/screenshots/design_simplified.png")
                page.wait_for_timeout(500)

        api_tab = page.locator("button:has-text('API KEY')")
        if api_tab.is_visible():
            api_tab.click()
            page.wait_for_timeout(1000)

            # Scroll down Settings view safely to show GITHUB PAT card fully!
            page.evaluate("""
                const el = Array.from(document.querySelectorAll('div')).find(d => d.style.overflowY === 'auto' || d.style.overflow === 'auto');
                if (el) el.scrollTop = 400;
            """)
            page.wait_for_timeout(1000)

            print("Taking API settings screenshot...")
            page.screenshot(path="/home/jules/verification/screenshots/api_settings.png")
            page.wait_for_timeout(500)

        network_tab = page.locator("button:has-text('NETWORK')")
        if network_tab.is_visible():
            network_tab.click()
            page.wait_for_timeout(1000)

            # Scroll down to show Bucket Breakdown!
            page.evaluate("""
                const el = Array.from(document.querySelectorAll('div')).find(d => d.style.overflowY === 'auto' || d.style.overflow === 'auto');
                if (el) el.scrollTop = 400;
            """)
            page.wait_for_timeout(1000)

            print("Taking Network and Storage screenshot...")
            page.screenshot(path="/home/jules/verification/screenshots/network_settings.png")
            page.wait_for_timeout(500)

    print("Visual verification complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
