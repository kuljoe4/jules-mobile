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

    print("Taking dashboard screenshot...")
    page.screenshot(path="/home/jules/verification/screenshots/dashboard.png")
    page.wait_for_timeout(300)

    print("Visual verification complete!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
