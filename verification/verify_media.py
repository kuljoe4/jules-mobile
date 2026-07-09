import os
import time
import json
from playwright.sync_api import sync_playwright, expect

def verify_media_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        current_dir = os.getcwd()
        page.goto(f"file://{current_dir}/dist/index.html")
        page.evaluate("localStorage.setItem('jac_key', 'AIza_fake_key')")

        page.route("**/v1alpha/sessions?*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps({"sessions": [{"id": "s1", "state": "IN_PROGRESS", "title": "Media Test", "createTime": "2023-10-27T10:00:00Z"}]})
        ))

        # Base64 for a small transparent pixel
        fake_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

        activities = {
            "activities": [{
                "id": "act1",
                "createTime": "2023-10-27T10:01:00Z",
                "progressUpdated": {"title": "Artifact"},
                "artifacts": [{
                    "media": {
                        "mimeType": "image/png",
                        "data": fake_image
                    }
                }]
            }]
        }

        page.route("**/v1alpha/sessions/s1/activities?*", lambda route: route.fulfill(status=200, body=json.dumps(activities)))
        page.route("**/v1alpha/sessions/s1?*", lambda route: route.fulfill(status=200, body=json.dumps({"id": "s1", "state": "IN_PROGRESS", "title": "Media Test", "createTime": "2023-10-27T10:00:00Z"})))

        page.goto(f"file://{current_dir}/dist/index.html")
        page.wait_for_selector("text=Media Test")
        page.click("text=Media Test")

        time.sleep(2)

        # Click "MEDIA" tab
        media_tab = page.get_by_role("button", name="MEDIA")
        media_tab.click()

        time.sleep(1)
        page.screenshot(path="verification/media_tab_fixed.png")

        # Click the media item
        page.click("text=PNG")
        time.sleep(1)
        page.screenshot(path="verification/media_modal_fixed.png")

        browser.close()

if __name__ == "__main__":
    verify_media_ux()
