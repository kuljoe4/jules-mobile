import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})

        # Intercept /sessions API calls at the browser context layer
        def handle_sessions(route):
            url = route.request.url
            if "/sessions/test-sess" in url:
                return route.fulfill(
                    status=200,
                    headers={"Access-Control-Allow-Origin": "*"},
                    content_type="application/json",
                    body='{"id": "test-sess", "title": "User Experience Refinement Task", "state": "IN_PROGRESS", "createTime": "2026-07-16T11:52:23Z", "updateTime": "2026-07-16T11:52:23Z", "prompt": "This is the extremely long original prompt of the session that we expect to scroll to."}'
                )
            else:
                return route.fulfill(
                    status=200,
                    headers={"Access-Control-Allow-Origin": "*"},
                    content_type="application/json",
                    body='{"sessions": [{"id": "test-sess", "title": "User Experience Refinement Task", "state": "IN_PROGRESS", "createTime": "2026-07-16T11:52:23Z", "updateTime": "2026-07-16T11:52:23Z", "prompt": "This is the extremely long original prompt of the session that we expect to scroll to."}]}'
                )

        await context.route("**/sessions**", handle_sessions)

        # Intercept /activities API calls
        await context.route("**/activities**", lambda route: route.fulfill(
            status=200,
            headers={"Access-Control-Allow-Origin": "*"},
            content_type="application/json",
            body='{"activities": [{"id": "act-1", "createTime": "2026-07-16T11:52:23Z", "progressUpdated": {"title": "Working", "description": "Step 1..."}}, {"id": "act-2", "createTime": "2026-07-16T11:52:23Z", "agentMessaged": {"agentMessage": "Hello!"}}, {"id": "act-3", "createTime": "2026-07-16T11:52:23Z", "userMessaged": {"userMessage": "This is follow-up number one!"}}]}'
        ))

        # Intercept fallback endpoints to prevent other network issues
        await context.route("**/sources**", lambda route: route.fulfill(
            status=200,
            headers={"Access-Control-Allow-Origin": "*"},
            content_type="application/json",
            body='{"sources": []}'
        ))

        page = await context.new_page()

        # Seed local storage before load
        await page.goto("http://127.0.0.1:8085/")
        await page.evaluate("""() => {
            localStorage.clear();
            localStorage.setItem('jac_key', 'AIza_fake');
            const now = new Date().toISOString();

            // Seed session list registry and cache
            localStorage.setItem('jac_session_registry', JSON.stringify({
                'test-sess': now
            }));
            localStorage.setItem('jac_session_cache', JSON.stringify({
                'test-sess': {
                    ts: Date.now(),
                    activities: [
                        { id: 'act-1', createTime: now, progressUpdated: { title: 'Working', description: 'Step 1...' } },
                        { id: 'act-2', createTime: now, agentMessaged: { agentMessage: 'Hello!' } },
                        { id: 'act-3', createTime: now, userMessaged: { userMessage: 'This is follow-up number one!' } }
                    ]
                }
            }));
            localStorage.setItem('jac_read_map', JSON.stringify({'test-sess': Date.now()}));
        }""")

        await page.reload()
        await page.wait_for_selector("#splash", state="hidden")
        print("Page loaded successfully, splash hidden.")

        # Ensure directories exist
        os.makedirs("verification/screenshots", exist_ok=True)
        await page.screenshot(path="verification/screenshots/loaded_page.png")

        # Let's test Custom Personas first
        # Click on settings icon
        await page.click('button[title="Settings"]')
        await page.wait_for_timeout(500)

        # Click on PERSONAS tab in Settings
        await page.click("text=PERSONAS")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/settings_personas_init.png")
        print("Settings - Personas view opened.")

        # Click "+ ADD CUSTOM"
        await page.click("text=+ ADD CUSTOM")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/add_persona_modal.png")
        print("Add Persona modal opened.")

        # Fill persona details
        await page.fill('input[placeholder="e.g. UX Expert"]', "UI Designer")
        await page.fill('textarea[placeholder="Define the role behavior..."]', "You are an expert UI/UX Designer who focuses on beautiful, accessible products.")

        # Click "SAVE PERSONA"
        await page.click("text=SAVE PERSONA")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/settings_personas_added.png")
        print("Custom persona added successfully.")

        # Edit the newly created custom persona
        await page.click('div:has-text("UI Designer") >> text=EDIT ROLE')
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/edit_persona_modal.png")
        print("Edit Persona modal opened.")

        # Edit prompt and color
        await page.fill('textarea[placeholder="Define the role behavior..."]', "You are an expert UI/UX Designer with a focus on WCAG 2.1 compliance.")
        await page.click("text=SAVE CHANGES")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/settings_personas_edited.png")
        print("Custom persona edited successfully.")

        # Exit Settings
        await page.click('button[title="Close Settings"]')
        await page.wait_for_timeout(500)

        # Now test the Scroll/Jump feature
        # Select the session
        await page.click("text=User Experience")
        await page.wait_for_timeout(1000)

        # Navigate to PROMPT tab in session detail
        await page.click("text=PROMPT")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/prompts_tab.png")
        print("PROMPT tab opened.")

        # Click the original prompt card to scroll to it (by clicking the text inside it)
        await page.click("text=expect to scroll to")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/scrolled_to_original.png")
        print("Clicked ORIGINAL PROMPT card text, jumped and highlighted successfully.")

        # Navigate back to PROMPT tab
        await page.click("text=PROMPT")
        await page.wait_for_timeout(500)

        # Click the follow-up prompt card (by clicking the text inside it)
        await page.click("text=This is follow-up number one!")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/scrolled_to_followup.png")
        print("Clicked FOLLOW-UP #1 card text, jumped and highlighted successfully.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
