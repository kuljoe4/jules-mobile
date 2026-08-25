export const T = {
  bg: "#050608", surface: "#0b0e14", surfaceHi: "#11161d",
  border: "#1a222e", borderHi: "#242d3d",
  brand: "#06b6d4",
  brandLight: "#22d3ee",
  brandDark: "#0891b2",
  brandDim: "rgba(6, 182, 212, 0.12)",
  indigo: "#a5b4fc", indigoLight: "#c7d2fe", indigoDim: "rgba(165,180,252,0.15)",
  amber: "#fcd34d", amberLight: "#fde68a", amberDim: "rgba(252,211,77,0.15)",
  red: "#fb7185", redLight: "#fda4af", redDim: "rgba(251,113,133,0.15)",
  blue: "#60a5fa", blueDim: "rgba(96,165,250,0.15)",
  purple: "#d8b4fe", purpleLight: "#e9d5ff", purpleDim: "rgba(216,180,254,0.15)",
  text: "#ffffff", textHi: "#f8fafc", textDim: "#e2e8f0",
  muted: "#cbd5e1", dim: "#94a3b8", line: "#111827",
  userBubble: "rgba(99,102,241,0.08)", agentBubble: "rgba(6, 182, 212, 0.06)",
};

export const STATUS_META = {
  QUEUED: { label: "QUEUED", color: T.dim, bg: "rgba(148,163,184,0.1)", pulse: false, icon: "database" },
  PLANNING: { label: "PLANNING", color: T.purpleLight, bg: T.purpleDim, pulse: true, icon: "plan" },
  AWAITING_PLAN_APPROVAL: { label: "APPROVE", color: T.indigoLight, bg: T.indigoDim, pulse: true, icon: "approve" },
  AWAITING_USER_FEEDBACK: { label: "INPUT", color: T.amberLight, bg: T.amberDim, pulse: true, icon: "tasks" },
  IN_PROGRESS: { label: "WORKING", color: "#34d399", bg: "rgba(52,211,153,0.15)", pulse: true, icon: "refresh" },
  PAUSED: { label: "PAUSED", color: T.dim, bg: "rgba(148,163,184,0.1)", pulse: false, icon: "pause" },
  COMPLETED: { label: "DONE", color: T.brandLight, bg: T.brandDim, pulse: false, icon: "check" },
  FAILED: { label: "FAILED", color: T.redLight, bg: T.redDim, pulse: false, icon: "x" },
  HAS_DRAFT: { label: "HAS DRAFT", color: T.amberLight, bg: T.amberDim, pulse: false, icon: "layers" },
};
