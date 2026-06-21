import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 390, 'height': 844})
        page = await context.new_page()

        file_path = "file://" + os.path.abspath("dist/index.html")
        await page.goto(file_path)
        await page.evaluate("""() => {
            localStorage.setItem('jac_key', 'AIza_fake');
            const now = new Date().toISOString();
            const session = {
                id: 'test-sess',
                title: 'User Experience Refinement Task',
                state: 'IN_PROGRESS',
                createTime: now,
                updateTime: now
            };
            // Seed cache so it shows up
            localStorage.setItem('jac_session_cache', JSON.stringify({
                'test-sess': {
                    ts: Date.now(),
                    activities: [
                        { id: '1', createTime: now, progressUpdated: { title: 'Working', description: 'Step 1...' } },
                        { id: '2', createTime: now, agentMessaged: { agentMessage: 'Hello!' } },
                        { id: '3', createTime: now, userMessaged: { userMessage: 'Hi!' } }
                    ]
                }
            }));
            localStorage.setItem('jac_read_map', JSON.stringify({'test-sess': Date.now()}));
        }""")

        await page.reload()
        await page.wait_for_selector("#splash", state="hidden")

        # Select the session
        await page.click("text=User Experience")
        await page.wait_for_timeout(1000)

        # 1. Screenshot of the detail header with 3-dots menu
        await page.screenshot(path="verification/screenshots/final_header_menu.png")
        print("Captured final_header_menu.png")

        # Click menu
        await page.click('button:has(svg path[d*="M12 5h.01"])') # The 'more' icon
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/screenshots/final_menu_open.png")
        print("Captured final_menu_open.png")

        # Close menu
        await page.mouse.click(10, 10)
        await page.wait_for_timeout(500)

        # 2. Scroll down to hide composer, then scroll up to see minimal composer
        # First ensure we have enough content to scroll
        await page.evaluate("""() => {
            const list = [];
            for(let i=0; i<30; i++) {
                list.push({ id: 'a'+i, createTime: new Date().toISOString(), progressUpdated: { title: 'Log '+i, description: '...' } });
            }
            const cache = JSON.parse(localStorage.getItem('jac_session_cache'));
            cache['test-sess'].activities = [...list, ...cache['test-sess'].activities];
            localStorage.setItem('jac_session_cache', JSON.stringify(cache));
        }""")
        await page.reload()
        await page.wait_for_selector("text=CHAT")

        # Scroll to bottom
        await page.evaluate("document.querySelector('div[ref=contentRef]')?.scrollTo(0, 10000)") # wait, ref is not a selector
        # Use a more reliable way to find the scrollable container
        await page.evaluate("""() => {
            const els = document.querySelectorAll('div');
            for (const el of els) {
                if (el.style.overflowY === 'auto' && el.innerText.includes('CHAT')) {
                    el.scrollTo(0, 10000);
                    break;
                }
            }
        }""")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/final_scrolled_bottom.png")

        # Scroll up slightly
        await page.evaluate("""() => {
            const els = document.querySelectorAll('div');
            for (const el of els) {
                if (el.style.overflowY === 'auto' && el.innerText.includes('CHAT')) {
                    el.scrollTo(0, el.scrollTop - 500);
                    break;
                }
            }
        }""")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification/screenshots/final_scrolled_up_minimal.png")
        print("Captured final_scrolled_up_minimal.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
