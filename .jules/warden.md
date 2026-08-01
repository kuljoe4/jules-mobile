# Warden Refactoring Journal 🛡️

This journal tracks critical refactoring learnings, extraction challenges, and design decisions.

## Refactoring Philosophy
- A module or class should have one reason to change.
- Untangle, do not rewrite.
- Small, reviewable diffs beat heroic ones.

## 2026-07-28 - SessionDetail Polling & Refresh Logic Extraction
**Learning:** In a single-file application with extremely large components (e.g. `SessionDetail` spanning 1,843 lines), state-and-effect orchestration like polling intervals, countdown timers, and coordinate-refresh processes can easily get tangled with rendering and domain business action logic. Extracting this pure state-and-effect lifecycle into a dedicated custom hook (`useSessionPolling`) isolates timing and interval concerns, making it easier to unit test, debug, and reason about without altering the surrounding UI rendering or API interface boundaries.
**Action:** Extract polling and sync behavior out of complex React components into custom hooks to promote the Single Responsibility Principle (SRP) and keep components focused strictly on layout and user interactions.

## 2026-07-28 - JulesClient Quota Tracker Logic Extraction
**Learning:** Overwhelming components like `JulesClient` often accumulate background orchestration, metadata state tracking, and local calculations like rolling 24-hour quota windows. These background computations are completely separate concerns from viewport routing, UI settings, and API authentication. Extracting these background tracking state variables and calculators into a unified hook (`useQuotaTracker`) clarifies component responsibilities, encapsulates complex side-effects (such as daily pruning & syncing to local storage), and isolates performance-critical calculations.
**Action:** Identify and isolate background tracking calculations and registry mutations from component coordinate trees into custom hook modules to maximize SRP compliance and enhance code readability.

## 2026-07-30 - Reference Leaks During Hook Extraction
**Learning:** When extracting a complex component's state management into a custom hook, any local variables (such as `draft`) used within conditional rendering blocks or side-effects must be returned by the custom hook and destructured in the host component, even if they aren't explicitly modified by state setters. Failure to return them results in unexpected runtime `ReferenceError` crashes on specific views/transitions.
**Action:** Systematically audit all JSX rendering paths, conditional fragments, and effects in the host component to ensure every variable referenced is either a prop, a component-level helper, or successfully destructured from the custom hook.

## 2026-07-31 - Centralized Safe Storage Encapsulation
**Learning:** In a large single-file application (~8,500+ lines), raw and repetitive calls to browser APIs (like `localStorage.getItem` and `localStorage.setItem`) scattered across numerous custom hooks, views, and initial state initializers introduce a major "God Mode" violation, mixing layout/action concerns with storage persistence, serialization, and try-catch boilerplate. Centralizing all raw keys, fallbacks, and serialization logic into a dedicated, safe `SafeStorage` helper service at the top of the file cleanly encapsulates browser API dependencies. Retaining original functions as delegating wrappers ensures backward compatibility and prevents refactoring side-effects across complex state contexts.
**Action:** Unify scattered browser storage API dependencies and raw key constants into a single-purpose, error-resilient storage service class or object, exposing descriptive getters/setters while delegating legacy wrappers to preserve the existing public API surface.
