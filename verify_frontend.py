import os
import time
import json
from playwright.sync_api import sync_playwright

def run_cuj(page):
    print("Navigating to http://localhost:8080")
    page.goto("http://localhost:8080")
    page.wait_for_timeout(500)

    print("Seeding localStorage with mock API key and mock sessions...")
    mock_sessions = [
        {
            "id": "sess-mock-1",
            "name": "sessions/sess-mock-1",
            "title": "Refactor DiffViewer for Multi-Patch Support",
            "state": "COMPLETED",
            "source": "repos/owner/repo",
            "branch": "main",
            "createTime": "2026-08-25T12:00:00Z",
            "updateTime": "2026-08-25T12:05:00Z"
        }
    ]
    # Valid 160x100 cyan PNG base64 string for mock media artifact
    mock_png_base64 = "iVBORw0KGgoAAAANSUEUgAAAKAAAABkCAIAAACO1KzYAAABAklEQVR4nO3RUQkAIBTAwPdl/zQmMZApRBgHF2CwWfsQNt8LeMrgOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjDI4zOM7gOIPjLuykrbBr5q3SAAAAAElFTkSuQmCC"
    mock_activities = {
        "sess-mock-1": [
            {
                "id": "act-1",
                "createTime": "2026-08-25T12:01:00Z",
                "artifacts": [
                    {
                        "changeSet": {
                            "gitPatch": {
                                "unidiffPatch": "--- a/src/components/diffViewer.jsx\n+++ b/src/components/diffViewer.jsx\n@@ -1,3 +1,5 @@\n+// Patch 1 addition\n const x = 1;\n"
                            }
                        }
                    },
                    {
                        "media": {
                            "mimeType": "image/png",
                            "data": mock_png_base64
                        }
                    }
                ]
            },
            {
                "id": "act-2",
                "createTime": "2026-08-25T12:03:00Z",
                "artifacts": [
                    {
                        "changeSet": {
                            "gitPatch": {
                                "unidiffPatch": "--- a/src/utils/date.js\n+++ b/src/utils/date.js\n@@ -10,3 +10,5 @@\n+// Patch 2 addition\n export const fmtAgo = () => {};\n"
                            }
                        }
                    }
                ]
            }
        ]
    }

    mock_session_cache = {
        "sess-mock-1": {
            "activities": mock_activities["sess-mock-1"],
            "ts": 1756123200000
        }
    }

    page.evaluate(f"localStorage.setItem('jac_key', 'AIzaSyFakeKeyFormVerificationTesting123')")
    page.evaluate(f"localStorage.setItem('jac_sessions_list', JSON.stringify({json.dumps(mock_sessions)}))")
    page.evaluate(f"localStorage.setItem('jac_session_cache', JSON.stringify({json.dumps(mock_session_cache)}))")
    page.evaluate(f"localStorage.setItem('jac_act_map', JSON.stringify({json.dumps(mock_activities)}))")

    page.goto("http://localhost:8080")
    page.wait_for_timeout(1500)

    # Click on mock session in sidebar to open SessionDetail view
    session_card = page.get_by_text("Refactor DiffViewer for Multi-Patch Support")
    if session_card.is_visible():
        print("Clicking mock session card...")
        session_card.click()
        page.wait_for_timeout(1000)

        # Click MEDIA tab in session detail view
        media_tab = page.get_by_role("tab", name="MEDIA")
        if media_tab.is_visible():
            print("Clicking MEDIA tab...")
            media_tab.click()
            page.wait_for_timeout(800)

            media_btn = page.locator("button:has(img[alt^='artifact-'])").first
            if media_btn.is_visible():
                print("Clicking media artifact thumbnail to open lightbox...")
                media_btn.click()
                page.wait_for_timeout(800)

    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    print("Taking dashboard media artifact screenshot...")
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
