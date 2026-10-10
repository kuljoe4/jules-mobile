// ─── Constants ────────────────────────────────────────────────────────────────
const BASE          = "https://jules.googleapis.com/v1alpha";
const ACTIVE_STATES = new Set(["QUEUED","PLANNING","AWAITING_PLAN_APPROVAL","AWAITING_USER_FEEDBACK","IN_PROGRESS"]);
const MSG_TYPES     = new Set(["userMessaged","agentMessaged"]);
export const EMPTY_ARR = [];
export const EMPTY_OBJ = {};
export const DEFAULT_LEAN_DIRECTIVE = "[System Directive: Do not capture or attach visual media artifacts (screenshots or videos) unless specifically requested for visual bug verification. Format follow up options as a numbered list.]";

export const DEFAULT_SPLIT_DIRECTIVE = "[SYSTEM DIRECTIVE: Analyze the scope of this request. If the required changes are large, structure your plan into clear phases. Ensure that any step requiring more than 50 lines of code changes is split into multiple smaller steps (i.e. each step must be < 50 lines of estimated changes). Tag step titles with `[Parallel]` ONLY if they can run concurrently without race conditions (e.g., they modify completely isolated files and do not share dependencies). If steps edit the same files, modify lockfiles/dependencies, alter shared imports/exports, change state shapes/schemas, or if one step relies on code/logic created in a previous step, you MUST tag them as `[Sequential: Step X]` to prevent merge conflicts and semantic regressions.]";
