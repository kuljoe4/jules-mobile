from playwright.sync_api import sync_playwright

mock_activities = [
    {
        "id": "act-1",
        "createTime": "2026-03-31T10:00:00Z",
        "userMessaged": {"userMessage": "Please analyze the quantitative trading report and extract key formulas."}
    },
    {
        "id": "act-2",
        "createTime": "2026-03-31T10:01:00Z",
        "agentMessaged": {"agentMessage": "I have reviewed the report and extracted the mathematical breakeven formulas and $R:R$ ratios."}
    },
    {
        "id": "act-3",
        "createTime": "2026-03-31T10:02:00Z",
        "artifacts": [
            {
                "media": {
                    "mimeType": "image/png",
                    "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                }
            }
        ]
    }
]

mock_sessions = [
    {
        "id": "sess-report-demo",
        "name": "sess-report-demo",
        "title": "Quantitative Research Report: Strategy Design & Scanner Weight Optimization",
        "state": "COMPLETED",
        "createTime": "2026-03-31T10:00:00Z",
        "updateTime": "2026-03-31T10:02:00Z",
        "prompt": "Please analyze the quantitative trading report and extract key formulas.",
        "outputs": [
            {
                "sessionSummary": {
                    "summary": "Quantitative Research Report formatted and rendered successfully."
                }
            }
        ]
    }
]

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(500)

    # Inject mock data into localStorage using correct SafeStorage keys
    page.evaluate(f"""([sessions, activities]) => {{
        localStorage.setItem('jac_key', 'AIzaSyFakeKeyForTesting12345');
        localStorage.setItem('jac_sessions_list', JSON.stringify(sessions));
        const cache = {{}};
        cache['sess-report-demo'] = {{ activities: activities, ts: Date.now() }};
        localStorage.setItem('jac_session_cache', JSON.stringify(cache));
    }}""", [mock_sessions, mock_activities])

    page.reload()
    page.wait_for_timeout(1000)

    # Click session item if visible
    session_card = page.get_by_text("Quantitative Research Report")
    if session_card.is_visible():
        session_card.click()
        page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
