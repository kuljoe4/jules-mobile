# Sentinel Security Journal 🛡️

## 2026-07-24 - Outbound Links Reverse Tabnabbing and Referer Information Leakage
**Vulnerability:** Outbound links with `target="_blank"` were using `rel="noopener"`, which lacks `noreferrer`. This could allow the destination website to receive the `Referer` header (containing details about the application URL, self-hosted endpoints, or workspace paths) and could potentially leak context information. In addition, the modern standard is to consistently use `rel="noopener noreferrer"` for external anchors to prevent reverse tabnabbing.
**Learning:** Modern web browsers require explicit security attributes for outbound links. Single-page client-side applications containing user API keys or workspace integrations must be especially careful not to leak the referrer URL when users click internal settings links, help documentation, or repository branches.
**Prevention:** Always include `rel="noopener noreferrer"` on all anchors pointing to external domains using `target="_blank"`.
