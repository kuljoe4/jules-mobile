import asyncio
from playwright.async_api import async_playwright
import os
import json

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            permissions=['clipboard-read', 'clipboard-write']
        )
        page = await context.new_page()

        # Print console logs
        page.on("console", lambda msg: print(f"CONSOLE: [{msg.type}] {msg.text}"))

        # Intercept API calls to mock sessions & activities
        async def handle_route(route):
            url = route.request.url
            print(f"Intercepted URL: {url}")
            if "/activities" in url:
                # Mock activities response containing a git patch
                patch_str = (
                    "--- a/src/components/DiffViewer.js\n"
                    "+++ b/src/components/DiffViewer.js\n"
                    "@@ -5,8 +5,10 @@\n"
                    " const DiffViewer = () => {\n"
                    "-  return <div>Old Diff Viewer</div>;\n"
                    "+  return <div>New Diff Viewer with COPY PATH and COPY DIFF!</div>;\n"
                )
                activities_response = {
                    "activities": [
                        {
                            "id": "activity_patch",
                            "createTime": "2025-01-01T01:00:00Z",
                            "progressUpdated": {
                                "title": "Applied patch changes",
                                "description": "Successfully modified DiffViewer.js with enhanced copy capabilities."
                            }
                        },
                        {
                            "id": "activity_completed",
                            "createTime": "2025-01-01T01:05:00Z",
                            "sessionCompleted": {
                                "outputs": []
                            }
                        },
                        {
                            "id": "activity_diff",
                            "createTime": "2025-01-01T00:30:00Z",
                            "artifacts": [
                                {
                                    "changeSet": {
                                        "gitPatch": {
                                            "unidiffPatch": patch_str
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(activities_response)
                )
            elif "/sessions?" in url or url.endswith("/sessions"):
                # Mock sessions list
                sessions_response = {
                    "sessions": [
                        {
                            "id": "session_diff_test",
                            "state": "COMPLETED",
                            "createTime": "2025-01-01T00:00:00Z",
                            "updateTime": "2025-01-01T01:00:00Z",
                            "title": "Verify Diff Copy Feature",
                            "prompt": "Create a unified diff viewer copy feature.",
                            "sourceContext": {
                                "source": "sources/github/jules-mobile",
                                "githubRepoContext": {
                                    "startingBranch": "main"
                                }
                            }
                        }
                    ],
                    "nextPageToken": None
                }
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(sessions_response)
                )
            elif "/sessions/session_diff_test" in url:
                # Mock session detail
                session_response = {
                    "id": "session_diff_test",
                    "state": "COMPLETED",
                    "createTime": "2025-01-01T00:00:00Z",
                    "updateTime": "2025-01-01T01:00:00Z",
                    "title": "Verify Diff Copy Feature",
                    "prompt": "Create a unified diff viewer copy feature.",
                    "sourceContext": {
                        "source": "sources/github/jules-mobile",
                        "githubRepoContext": {
                            "startingBranch": "main"
                        }
                    }
                }
                await route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(session_response)
                )
            else:
                await route.continue_()

        # Register the intercept routes
        await page.route("**/sessions**", handle_route)

        # Go to dist index.html
        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)

        # Set fake api key to bypass setupscreen
        await page.evaluate("localStorage.setItem('jac_key', 'AIza_fake_api_key_for_testing')")
        await page.reload()

        # Wait for splash screen to disappear
        await page.wait_for_selector("#splash", state="hidden")
        print("Page loaded successfully!")

        # Take screenshot of session list
        await page.screenshot(path="verification/screenshots/diff_test_session_list.png")
        print("Captured diff_test_session_list.png")

        # Click on the test session
        await page.click("text=Verify Diff Copy Feature")

        # Wait 3.5 seconds to let activities completely load, synchronize, and settle (syncPhase -> IDLE)
        await page.wait_for_timeout(3500)

        # Get HTML content of the page for debugging
        html = await page.content()
        with open("verification/screenshots/dom.html", "w") as f:
            f.write(html)
        print("Dumped DOM to verification/screenshots/dom.html")

        # Let's locate the buttons and log their details
        buttons = await page.locator("button").all()
        for b in buttons:
            txt = await b.inner_text()
            if "DIFF" in txt:
                print(f"Found button with DIFF text: '{txt}'")

        # Click on the DIFF tab using precise text match
        print("Clicking the DIFF tab...")
        diff_tab = page.locator('button:text-is("DIFF")')
        await diff_tab.click()
        await page.wait_for_timeout(1000)

        # Capture initial screenshot of the DIFF tab (collapsed)
        await page.screenshot(path="verification/screenshots/diff_tab_collapsed.png")
        print("Captured diff_tab_collapsed.png")

        # Click EXPAND to show the file contents and verify expand
        await page.click('button:has-text("EXPAND")')
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/diff_tab_expanded.png")

        # Verify COPY PATH and COPY DIFF buttons exist
        path_btn = page.locator('button:has-text("COPY PATH")')
        diff_btn = page.locator('button:has-text("COPY DIFF")')

        # Verify they are visible
        assert await path_btn.is_visible(), "COPY PATH button is not visible"
        assert await diff_btn.is_visible(), "COPY DIFF button is not visible"
        print("COPY PATH and COPY DIFF buttons are visible!")

        # Click COPY PATH
        await path_btn.click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/diff_path_copied.png")
        print("Captured diff_path_copied.png")

        # Click COPY DIFF
        await diff_btn.click()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/diff_content_copied.png")
        print("Captured diff_content_copied.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
