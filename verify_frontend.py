from playwright.sync_api import sync_playwright

mock_report = """# Comprehensive Quantitative Research Report: Strategy Design & Scanner Weight Optimization for an Asymmetric (1.8% TP / 2.7% SL) Trading Profile

---

## Executive Summary & Mathematical Foundation

A trade rule specifying a **Take Profit (TP) at +1.8%** and a **Stop Loss (SL) at -2.7%** yields an inverted Payoff / Risk-to-Reward Ratio ($R:R$):

$$R:R = \\frac{\\text{TP}}{\\text{SL}} = \\frac{1.8\\%}{2.7\\%} = \\frac{2}{3} \\approx 0.6667$$

For every $1.00 risked, the trade generates $0.667 in gross potential reward. In quantitative finance, strategies with $R:R < 1.0$ belong to the **High-Probability Scalping / Mean-Reversion Class**. The primary performance engine for this class is **Win Rate ($W$)**, which must significantly exceed $60\\%$.

---

### 1. Mathematical & Friction-Adjusted Breakeven Analysis

#### Gross Breakeven Win Rate ($W_{BE}$)
$$E[\\text{Gross PnL}] = W \\cdot (+1.8\\%) - (1 - W) \\cdot (2.7\\%) = 0$$

$$1.8\\% W = 2.7\\% (1 - W) \\implies 4.5\\% W = 2.7\\% \\implies W_{BE} = \\frac{2.7}{4.5} = \\mathbf{60.00\\%}$$

#### Friction-Adjusted Breakeven Win Rate ($W_{net\\_BE}$)
In live futures trading, exchange taker fees (e.g. Binance VIP0 futures: 0.05% entry + 0.05% exit = 0.10% total) and average bid-ask spread / market impact (~0.04% roundtrip) reduce net payout and widen net loss:
* **Net TP**: $1.80\\% - 0.14\\% = \\mathbf{+1.66\\%}$
* **Net SL**: $-2.70\\% - 0.14\\% = \\mathbf{-2.84\\%}$

$$E[\\text{Net PnL}] = W \\cdot (+1.66\\%) - (1 - W) \\cdot (2.84\\%) = 0$$

$$4.50\\% W = 2.84\\% \\implies W_{net\\_BE} = \\frac{2.84}{4.50} \\approx \\mathbf{63.11\\%}$$

#### Target Win Rate for Commercial Profitability ($PF \\ge 1.30$)
To achieve a robust Profit Factor ($PF = \\frac{\\text{Gross Wins}}{\\text{Gross Losses}} \\ge 1.30$) and absorb regime shifts:

$$\\text{Target Win Rate } (W_{target}) \\approx \\mathbf{68.5\\% \\text{ to } 75.0\\%}$$

---

## Optimal Strategy Archetypes

Because $SL (2.7\\%) > TP (1.8\\%)$, **trend-following breakout strategies (which typically achieve 35%–45% win rates) are strictly disqualified**. Instead, the following three quantitative strategy archetypes excel:

### Archetype 1: Mean Reversion / Dip Buying in Established Macro Trends *(Recommended)*
* **Core Logic**: Crypto prices exhibit strong short-term mean-reverting dynamics on lower timeframes (3m/5m).
* **Target Win Rate**: **70% – 76%**
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
