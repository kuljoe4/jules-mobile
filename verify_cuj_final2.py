from playwright.sync_api import sync_playwright
import os
import json

def run_cuj(page):
    # Mocking a failed session to view the empty state options
    mock_sessions = [
        {
            "id": "mock-failed-session-1",
            "title": "Failed Task Example",
            "state": "FAILED",
            "lastUpdate": 1704110400000,
            "activities": [
                {
                    "createTime": "2024-01-01T12:00:00.000Z",
                    "sessionFailed": {
                        "reason": "Jules was unable to complete the task."
                    }
                }
            ]
        }
    ]

    page.goto("http://localhost:3000/")
    page.wait_for_timeout(500)

    page.evaluate(f"window.localStorage.setItem('jac_key', 'mock_key');")
    page.evaluate(f"window.localStorage.setItem('jac_sessions_list', JSON.stringify({json.dumps(mock_sessions)}));")
    page.evaluate(f"window.localStorage.setItem('jac_selected_session', 'mock-failed-session-1');")
    page.evaluate(f"window.localStorage.setItem('jac_session_act_mock-failed-session-1', JSON.stringify({json.dumps(mock_sessions[0]['activities'])}));")

    page.goto("http://localhost:3000/")
    page.wait_for_timeout(1000)

    # In mobile view, might need to click the session
    try:
        page.get_by_text("Failed Task Example").click()
        page.wait_for_timeout(1000)
    except:
        pass

    # Let's take a screenshot before we wait for the buttons, so we can see what's actually rendered
    page.screenshot(path="verification_fallback_options_debug2.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
