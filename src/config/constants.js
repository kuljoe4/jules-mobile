// ─── Constants ────────────────────────────────────────────────────────────────
const BASE          = "https://jules.googleapis.com/v1alpha";
const ACTIVE_STATES = new Set(["QUEUED","PLANNING","AWAITING_PLAN_APPROVAL","AWAITING_USER_FEEDBACK","IN_PROGRESS"]);
const MSG_TYPES     = new Set(["userMessaged","agentMessaged"]);
const EMPTY_ARR     = [];
