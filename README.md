# 🚀 Jules Mobile Client

A high-performance, mobile-first, and desktop-enhanced web application for monitoring, reviewing, and controlling **Jules AI** autonomous coding agent sessions.

---

## 🌟 Why Jules Mobile Client?

While the official Google Jules web app provides a standard web dashboard for running agent sessions, **Jules Mobile Client** is purpose-built to give developers **unprecedented mobility, deep operational insights, and client-side optimization controls**.

Whether you need to approve an execution plan on your phone during a commute, detect file edit collisions across background sessions in real time, inspect network bandwidth consumption, or apply specialized system persona prompts on the fly, Jules Mobile Client extends Google Jules into a mobile-first PWA workstation.

---

## ✨ Features & What Makes Jules Mobile Client Special

The table below highlights how Jules Mobile Client compares with standard web interfaces, focusing on what is unique and differentiated in this app:

| Feature | Standard Web Interface | Jules Mobile Client (Special & Differentiated) |
| :--- | :--- | :--- |
| **PWA & Offline Startup** | Web app requiring active server | **Zero-Backend PWA**: Single static `index.html` bundle. Loads instantly, works offline, zero server cost. |
| **Mobile UI & Ergonomics** | Standard desktop-focused web view | **Mobile-First Layout**: Touch-friendly tab bar, one-handed navigation, screen reader accessibility, and keyboard search hotkeys (`/`). |
| **Session Collision Warnings** | Not available | **Conflict Radar**: Scans active background sessions in real time to detect overlapping file edits before task submission. |
| **Payload Optimization** | Full media payloads fetched | **Lean Payload Mode**: Inject per-repo directives to suppress visual media artifacts and cut payload sizes by up to 80%. |
| **Performance Analytics** | Basic activity list | **Payload Breakdown Modal**: Stacked visual byte charts, itemized patch metrics, and actionable optimization tips. |
| **Quota Visualizer** | Standard daily counter | **24-Hour Rolling Quota Timeline**: Sliding window timeline displaying exact slot recovery timers and PR counts. |
| **Role Prompts & Personas** | Generic task prompts | **Multi-Persona Manager**: Apply preset or custom role prompts (e.g., UX Specialist, Security Auditor) with color tagging. |
| **Design Auditing** | Single static theme | **Design System Lab**: Interactive side-by-side visual sandbox to audit traditional vs. simplified (Dot+Tint) UI treatments. |
| **Data Privacy** | Server-side user storage | **Local Browser Storage (`SafeStorage`)**: Credentials and session caches stay 100% in your browser. |

---

## 🧭 Complete UI/UX Flow Guides & Walkthroughs

Step-by-step guides for primary user workflows, detailing **how** to perform actions and **what is unique** about the Jules Mobile Client user experience.

---

### Flow 1: Initial Setup & API Key Configuration

```
[ Welcome Setup Screen ] ──> [ Paste Google API Key ] ──> [ Optional GitHub PAT ] ──> [ Client-Only Storage ]
```

#### Step-by-Step Guide:
1. **Launch the Application**: On your first visit, the **SETUP SCREEN** greets you.
2. **Enter Google Gemini / Jules API Key**: Paste your API key to authenticate requests directly from your browser.
3. **Configure GitHub Personal Access Token (PAT) (Optional)**: In **APP SETTINGS** → **API KEY**, enter a GitHub PAT (with `repo` scope).
   * *What's Special*: Public GitHub API calls are capped at 60 req/hr. Adding a PAT enables rate-limit-free PR tracking, branch inspection, and ahead/behind commit indicators directly within session cards.
4. **Save Credentials**: Keys are validated and saved to browser `localStorage`. No credentials are ever sent to intermediate servers.

---

### Flow 2: Creating a New Task with Conflict Radar & Personas

```
[ Click + NEW ] ──> [ Type Prompt ] ──> [ Select Repo & Branch ] ──> [ Conflict Radar Check ] ──> [ Select Personas ] ──> [ Confirm Task ]
```

#### Step-by-Step Guide:
1. **Open New Session Screen**: Tap **+ NEW** on the bottom navigation bar (mobile) or top bar (desktop).
2. **Enter Task Prompt**: Type your instructions in the prompt textarea.
   * *What's Special*: Tap the expand icon (↖↘) for a full-screen, focused writing view when drafting long instructions.
3. **Select Repository & Starting Branch**: Search repositories and branches using auto-completing dropdowns.
4. **Check Conflict Radar Warning**: Review the **Conflict Radar** panel at the bottom of the prompt form.
   * *What's Special*: Conflict Radar automatically cross-references all active sessions for file edit overlap. If another session is modifying the same target files, a yellow alert banner warns you before task submission to prevent Git merge conflicts.
5. **Attach Multi-Personas**: Tap persona pills (e.g., **UX Specialist**, **Refactoring Ninja**, **Security Auditor**).
   * *What's Special*: Custom system prompts are dynamically injected into Jules's context to guide coding behavior.
6. **Toggle Options**:
   * **LEAN PAYLOAD**: Instructs Jules to skip screenshot/video recording to save bandwidth.
   * **AUTO PR**: Automatically opens a GitHub PR upon task completion.
   * **APPROVE PLAN**: Requests a manual plan approval step before Jules executes code edits.
7. **Submit Task**: Click **ASSIGN TO JULES →** to review the confirmation modal and launch the session.

---

### Flow 3: Monitoring Execution & Plan Approval

```
[ Session Card ] ──> [ Activity Feed ] ──> [ Plan Step Checklist ] ──> [ Approve / Feedback ]
```

#### Step-by-Step Guide:
1. **Select an Active Session**: Tap a session card with an **IN_PROGRESS** or **PLANNING** status badge.
2. **Review Real-Time Feed**: Watch activity items stream live with smart delta polling that boosts polling frequency during active steps.
3. **Review Execution Plan**: When a session reaches `AWAITING_PLAN_APPROVAL`:
   * A prominent plan banner displays proposed execution steps, affected files, and risk levels.
4. **Approve or Request Modifications**:
   * Click **APPROVE PLAN ✓** to authorize immediate code execution.
   * Click **REQUEST CHANGES ✎** to type specific feedback for Jules to adjust its strategy.

---

### Flow 4: Reviewing Code Diffs & Payload Breakdown

```
[ Timeline Patch ] ──> [ Syntax Diff Viewer ] ──> [ Copy Debug Log ] ──> [ Open Payload Breakdown Modal ]
```

#### Step-by-Step Guide:
1. **Locate Code Edits**: Expand any code patch item in the session timeline.
2. **Inspect Diff Viewer**: View syntax-highlighted additions (green) and deletions (red) along with per-file byte indicators (`+1.4 KB`).
3. **Copy Debug Report**: Click **COPY DEBUG LOG** in the diff header to copy structured patch metrics to your clipboard.
4. **Inspect Payload Breakdown**: Click the session stats badge in the header/footer (e.g., `12 ITEMS · 142.5 KB`).
   * *What's Special*: Opens the **Payload Breakdown Modal**, showing stacked visual charts dividing data into Media, Diffs, Messages, and Overhead, along with tailored recommendations to optimize network usage.

---

### Flow 5: Managing Quota & Custom System Personas

```
[ App Settings ] ──> [ Quota Visualizer ] ──> [ Personas Management ] ──> [ Design System Lab ]
```

#### Step-by-Step Guide:
1. **Open Settings**: Tap **SETTINGS** on the navigation bar.
2. **Monitor Quota Timeline**: In **GENERAL**, view your 24-hour rolling usage window, active PR counts, and exact slot recovery countdown timers.
3. **Manage Personas**: In **PERSONAS**, tap **+ ADD CUSTOM** to create custom role prompts with tailored label names, theme colors, and system prompts.
4. **Explore Design Lab**: In **DESIGN LAB**, switch comparison modes (Side-by-Side, Current, Simplified) to audit UI treatments across card states, chat bubbles, progress indicators, and completion pills.

---

## 🛠️ Tech Stack & Local Commands

* **Frontend**: React 18 (Classic Runtime, pre-compiled static bundle)
* **Bundler Pipeline**: Custom Babel transpiler (`build.js`) outputting to `dist/index.html`
* **Package Manager**: `pnpm`

### Commands

```bash
# Install dependencies
pnpm install

# Start local dev server (http://localhost:8080)
pnpm run dev

# Rebuild on source changes during development
pnpm run watch

# Run utility unit test suite
pnpm test

# Build production bundle (dist/index.html)
pnpm run build
```

---

## 🔒 Security & Privacy

* **Zero Backend Overhead**: Direct browser-to-API communication with zero intermediary tracking servers.
* **Sanitized Payloads**: Strict input validation and sanitization (`safeUrl`, `safeMediaBase64`, `safeMediaMimeType`, `isValidGitBranchName`) protect against XSS and MIME injection.
* **Content Security Policy**: Hardened inline script, style, and connect-src CSP rules.

---

## 📄 License

MIT License. Built for developers seeking mobile control over AI coding agents.
