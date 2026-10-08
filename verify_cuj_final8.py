from playwright.sync_api import sync_playwright
import os
import json

def run_cuj(page):
    # The detail variable sets the buttons up in TimelineEvent
    # But TimelineEvent is NOT rendering because "No activities yet" is showing.
    # Why is "No activities yet" showing?
    # Because ActivityFeed expects an `activities` prop which comes from `sessionDetail.jsx`.
    # sessionDetail.jsx loads it using the `useSessionPolling` hook.
    # The `useSessionPolling` hook loads from `apiCall("sessions/" + id)` OR local storage cache.
    # But to fetch from local storage cache, it actually does an API call first if there is a network.

    # We will mock the API response specifically to return the activities in the "activities" field.
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

    page.route("**/sessions/mock-failed-session-1*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps(mock_sessions[0])
    ))

    # Mocking the list endpoint so the card appears correctly
    page.route("**/sessions*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"sessions": mock_sessions})
    ))

    # Set mock key so the app thinks we're logged in and actually does the api calls instead of erroring with 401
    page.evaluate(f"window.localStorage.setItem('jac_key', 'mock_key');")

    page.goto("http://localhost:3000/")
    page.wait_for_timeout(1000)

    # Click the session card to open the detail view
    page.get_by_text("Failed Task Example").click()
    page.wait_for_timeout(2000)

    # Wait for the activities to load
    page.get_by_text("Jules was unable to complete the task.").wait_for(state="visible")

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
