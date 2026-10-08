from playwright.sync_api import sync_playwright
import os
import json

def run_cuj(page):
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

    page.route("**/sessions/mock-failed-session-1*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"activities": mock_sessions[0]['activities']})
    ))

    page.goto("http://localhost:3000/")
    page.wait_for_timeout(1000)

    try:
        page.get_by_text("Failed Task Example").click()
        page.wait_for_timeout(2000)
    except:
        pass

    try:
        page.get_by_role("button", name="ALL").click()
        page.wait_for_timeout(1000)
    except:
        pass

    page.screenshot(path="verification_fallback_options_final.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
