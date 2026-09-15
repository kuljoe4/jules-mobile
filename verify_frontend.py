from playwright.sync_api import sync_playwright

mock_report = """# Comprehensive Quantitative Research Report: Strategy Design & Scanner Weight Optimization for an Asymmetric (1.8% TP / 2.7% SL) Trading Profile

---

## Executive Summary & Mathematical Foundation

A trade rule specifying a **Take Profit (TP) at +1.8%** and a **Stop Loss (SL) at -2.7%** yields an inverted Payoff / Risk-to-Reward Ratio ($R:R$):

$$R:R = \\frac{\\text{TP}}{\\text{SL}} = \\frac{1.8\\%}{2.7\\%} = \\frac{2}{3} \\approx 0.6667$$

For every $1.00 risked, the trade generates $0.667 in gross potential reward.
"""

def run_cuj(page):
    page.goto("http://localhost:8080")
    page.wait_for_timeout(1000)

    # Set mock sessions and API key in localStorage
    page.evaluate(f"""() => {{
        localStorage.setItem('jac_key', 'AIzaSyFakeKeyFormVerificationTesting123');
        const mockSessions = [
            {{
                id: 'sess-report-demo',
                name: 'sess-report-demo',
                title: 'Quantitative Research Report: Strategy Design & Scanner Weight Optimization',
                state: 'COMPLETED',
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString(),
                prompt: {repr(mock_report)},
                outputs: [
                    {{
                        sessionSummary: {{
                            summary: 'Quantitative Research Report formatted and rendered successfully.'
                        }}
                    }}
                ]
            }}
        ];
        localStorage.setItem('jac_sessions_cache', JSON.stringify(mockSessions));
    }}""")
    page.reload()
    page.wait_for_timeout(1500)

    # Click session item
    session_card = page.get_by_text("Quantitative Research Report")
    if session_card.is_visible():
        session_card.click()
        page.wait_for_timeout(1000)

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
