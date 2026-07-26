# Sentinel Security Journal 🛡️

## 2026-07-24 - Outbound Links Reverse Tabnabbing and Referer Information Leakage
**Vulnerability:** Outbound links with `target="_blank"` were using `rel="noopener"`, which lacks `noreferrer`. This could allow the destination website to receive the `Referer` header (containing details about the application URL, self-hosted endpoints, or workspace paths) and could potentially leak context information. In addition, the modern standard is to consistently use `rel="noopener noreferrer"` for external anchors to prevent reverse tabnabbing.
**Learning:** Modern web browsers require explicit security attributes for outbound links. Single-page client-side applications containing user API keys or workspace integrations must be especially careful not to leak the referrer URL when users click internal settings links, help documentation, or repository branches.
**Prevention:** Always include `rel="noopener noreferrer"` on all anchors pointing to external domains using `target="_blank"`.

## 2026-07-25 - Client-Side API Connection Pool Exhaustion & Denial of Service
**Vulnerability:** Outbound HTTP request functions (`apiCall`) lacked explicit timeouts. Under conditions where remote API endpoints or intermediate network routes hang indefinitely or respond very slowly, pending fetches could block client-side resources indefinitely. In polling-heavy SPAs, this causes promise accumulation, browser connection socket limit exhaustion (connection pool lockup), and client-side memory leakage, leading to UI lockups/Denial of Service.
**Learning:** Polling and synchronization tasks in client-side applications must be bounded by defensive timeouts. Relying on default browser connection timeouts is insufficient, as some requests may remain open for minutes or indefinitely, causing socket limits to be reached quickly.
**Prevention:** Always implement explicit, bounded request timeouts using `AbortController` in client-side fetch abstractions to ensure connections are freed under hanging or slow network states.
