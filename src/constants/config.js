export const POLL_OPTIONS = [
  { label: "OFF", ms: 0 },
  { label: "10s", ms: 10000 },
  { label: "30s", ms: 30000 },
  { label: "1m", ms: 60000 },
  { label: "2m", ms: 120000 },
  { label: "5m", ms: 300000 },
  { label: "10m", ms: 600000 },
];
export const DEFAULT_POLL_MS = 30000;

export const LIMIT_OPTIONS = [
  { label: "10", val: 10 },
  { label: "20", val: 20 },
  { label: "50", val: 50 },
  { label: "100", val: 100 },
  { label: "250", val: 250 },
];
export const DEFAULT_LIMIT = 50;
export const DEFAULT_CACHE_LIMIT = 5;

export const ACTIVITY_LIMIT_OPTIONS = [
  { label: "50", val: 50 },
  { label: "100", val: 100 },
  { label: "200", val: 200 },
  { label: "500", val: 500 },
];
export const DEFAULT_ACTIVITY_LIMIT = 100;

export const PLANS = [
  { id: "free", label: "Free", daily: 15, concurrent: 3, model: "Gemini 2.5 Pro" },
  { id: "pro", label: "Pro", daily: 100, concurrent: 15, model: "Gemini 3 Pro" },
  { id: "ultra", label: "Ultra", daily: 300, concurrent: 60, model: "Gemini 3 Pro (priority)" },
  { id: "custom", label: "Custom", daily: 0, concurrent: 0, model: "Custom Config" },
];

export const BASE = "https://jules.googleapis.com/v1alpha";
export const ACTIVE_STATES = new Set(["QUEUED", "PLANNING", "AWAITING_PLAN_APPROVAL", "AWAITING_USER_FEEDBACK", "IN_PROGRESS"]);
export const MSG_TYPES = new Set(["userMessaged", "agentMessaged"]);
export const EMPTY_ARR = [];

export const PRESET_COLORS = [
  "#ff66cc", "#ffbc00", "#00eaff", "#ff4444", "#5fb2ff",
  "#bf99ff", "#ffffff", "#4da6ff", "#ff8844", "#a5b4fc"
];

export const COLOR_NAMES = {
  "#ff66cc": "Pink",
  "#ffbc00": "Amber",
  "#00eaff": "Cyan",
  "#ff4444": "Red",
  "#5fb2ff": "Sky Blue",
  "#bf99ff": "Lavender",
  "#ffffff": "White",
  "#4da6ff": "Soft Blue",
  "#ff8844": "Orange",
  "#a5b4fc": "Indigo"
};

export const PATHS = {
  back: "M19 12H5m7-7l-7 7 7 7",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  plus: "M12 4v16m8-8H4",
  tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  wifi: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  code: "M9 9l-6 3 6 3M15 9l6 3-6 3M13 4l-2 16",
  terminal: "M4 17l6-6-6-6M12 19h8",
  plan: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 12h6M9 16h4",
  approve: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  branch: "M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4m4-5l5 5 5-5m-5 5V3",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  layout_toggle: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.657-5.657l1.414-1.414m-14.142 14.142l1.414-1.414m0-14.142l-1.414-1.414m14.142 14.142l-1.414-1.414",
  git_pull: "M18 18a3 3 0 100-6 3 3 0 000 6zM6 18a3 3 0 100-6 3 3 0 000 6zM6 6a3 3 0 100-6 3 3 0 000 6zM6 9v6M13 6h3a2 2 0 012 2v7",
  git_merge: "M18 18a3 3 0 100-6 3 3 0 000 6zM6 6a3 3 0 100-6 3 3 0 000 6zM6 21V9a9 9 0 009 9",
  copy: "M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  chevron_down: "M6 9l6 6 6-6",
  chevron_up: "M18 15l-6-6-6 6",
  chevron_right: "M9 18l6-6-6-6",
  database: "M3 5V19C3 20.66 6.13 22 10 22C13.87 22 17 20.66 17 19V5M3 5C3 6.66 6.13 8 10 8C13.87 8 17 6.66 17 5M3 5C3 3.34 6.13 2 10 2C13.87 2 17 3.34 17 5M17 12C17 13.66 13.87 15 10 15C6.13 15 3 13.66 3 12",
  layers: "M12 2L2 7L12 12L22 7L12 2ZM2 17L12 22L22 17M2 12L12 17L22 12",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  archive: "M21 8v13H3V8M1 3h22v5H1V3m10 8h2",
  unarchive: "M21 8v13H3V8M1 3h22v5H1V3m7 11l4-4 4 4m-4-4v10",
  more: "M12 5h.01M12 12h.01M12 19h.01",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H4a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V4a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H20a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  reply: "M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z",
  eye_closed: "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22",
};

export const COLLAPSE_THRESHOLD = 8;
export const COLLAPSE_SHOW = 5;

export const FILTERS = ["ALL", "QUEUED", "PLANNING", "AWAITING_PLAN_APPROVAL", "IN_PROGRESS", "COMPLETED", "FAILED", "HAS_DRAFT"];
export const FILTER_LABELS = { AWAITING_PLAN_APPROVAL: "APPROVE", ALL: "ALL", HAS_DRAFT: "HAS DRAFT" };
