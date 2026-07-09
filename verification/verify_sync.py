import os
import time
import json
from playwright.sync_api import sync_playwright, expect

def verify_sync_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a mobile-like viewport
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # 1. Setup API Key and Mock Session
        # Navigate once to set up the domain context for localStorage
        current_dir = os.getcwd()
        page.goto(f"file://{current_dir}/dist/index.html")
        page.evaluate("localStorage.setItem('jac_key', 'AIza_fake_key')")

        # 2. Mock API responses
        page.route("**/v1alpha/sessions?*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"sessions": [{"id": "s1", "state": "IN_PROGRESS", "title": "Test Syncing UX", "createTime": "2023-10-27T10:00:00Z"}]})
        ))

        activities_page1 = {
            "activities": [{"id": f"act{i}", "createTime": f"2023-10-27T10:0{i}:00Z", "progressUpdated": {"title": f"Activity {i}", "description": "Some description"}} for i in range(5)],
            "nextPageToken": "p2"
        }
        activities_page2 = {
            "activities": [{"id": f"act{i+5}", "createTime": f"2023-10-27T10:0{i+5}:00Z", "progressUpdated": {"title": f"Activity {i+5}", "description": "Another description"}} for i in range(5)]
        }

        def handle_activities(route):
            url = route.request.url
            if "pageToken=p2" in url:
                route.fulfill(status=200, body=json.dumps(activities_page2))
            else:
                # Add delay to see the "FETCHING" state
                time.sleep(1)
                route.fulfill(status=200, body=json.dumps(activities_page1))

        page.route("**/v1alpha/sessions/s1/activities?*", handle_activities)
        page.route("**/v1alpha/sessions/s1?*", lambda route: route.fulfill(
            status=200,
            body=json.dumps({"id": "s1", "state": "IN_PROGRESS", "title": "Test Syncing UX", "createTime": "2023-10-27T10:00:00Z"})
        ))

        # Reload to apply key and catch routes
        page.goto(f"file://{current_dir}/dist/index.html")

        # Click the session
        page.wait_for_selector("text=Test Syncing UX")
        page.click("text=Test Syncing UX")

        # Capture screenshot while it's likely "FETCHING"
        time.sleep(1.5)
        page.screenshot(path="verification/sync_progress.png")

        # Wait for sync to complete
        time.sleep(4)
        page.screenshot(path="verification/sync_done.png")

        browser.close()

if __name__ == "__main__":
    verify_sync_ux()
