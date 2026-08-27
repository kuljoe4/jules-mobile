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

    page.evaluate(f"localStorage.setItem('jac_key', 'AIzaSyFakeKeyFormVerificationTesting123')")
    page.evaluate(f"localStorage.setItem('jac_session_cache', JSON.stringify({json.dumps(mock_sessions)}))")
    page.evaluate(f"localStorage.setItem('jac_act_map', JSON.stringify({json.dumps(mock_activities)}))")

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
