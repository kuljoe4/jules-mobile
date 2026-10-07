from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000")

    page.wait_for_timeout(2000)

    # inject mock API key
    page.evaluate("window.localStorage.setItem('jac_key', 'AIzaSyTestKey1234567890TestTestTest')")

    # add some mock sessions with open and merged pr
    page.evaluate("""
        const sessions = [
            { id: '1', title: 'Session 1', state: 'COMPLETED', outputs: [{githubPullRequest: 'https://github.com/mock/mock/pull/1'}] },
            { id: '2', title: 'Session 2', state: 'COMPLETED', outputs: [{githubPullRequest: 'https://github.com/mock/mock/pull/2'}] }
        ];
        const reg = { '1': Date.now(), '2': Date.now() };
        window.localStorage.setItem('jac_sessions_list', JSON.stringify(sessions));
        window.localStorage.setItem('jac_session_registry', JSON.stringify(reg));

        // mock activitiesMap to trigger PR tracking logic in the component
        // we can inject some mock activities that match PR regex

    """)
    page.goto("http://localhost:3000")
    page.wait_for_timeout(2000)

    # Check if OPEN PR is visible
    print("OPEN PR pill visible:", page.get_by_text("OPEN PR").is_visible())
    print("MERGED PR pill visible:", page.get_by_text("MERGED PR").is_visible())

    # click OPEN PR pill and take screenshot
    page.get_by_role("button", name="Filter by OPEN PR").click()
    page.wait_for_timeout(2000)
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir=".")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
