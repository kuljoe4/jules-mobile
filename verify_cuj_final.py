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
    # Setting an active session overrides the 401 fetch behavior
    page.evaluate(f"window.localStorage.setItem('jac_selected_session', 'mock-failed-session-1');")
    # Adding activities so it renders the timeline
    page.evaluate(f"window.localStorage.setItem('jac_session_act_mock-failed-session-1', JSON.stringify({json.dumps(mock_sessions[0]['activities'])}));")

    page.goto("http://localhost:3000/")
    page.wait_for_timeout(1000)

    # Verify the fallback buttons exist
    page.get_by_role("button", name="Send follow-up: Retry task").wait_for(state="visible")
    page.get_by_role("button", name="Send follow-up: Explain why it failed").wait_for(state="visible")

    # Take screenshot at the key moment
    page.screenshot(path="verification_fallback_options.png")
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
