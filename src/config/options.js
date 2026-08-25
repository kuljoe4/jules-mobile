// ─── Options & Configurations ────────────────────────────────────────────────
// Configurable poll intervals (ms). 0 = manual-only.
const POLL_OPTIONS = [
  { label:"OFF",  ms:0      },
  { label:"10s",  ms:10000  },
  { label:"30s",  ms:30000  },
  { label:"1m",   ms:60000  },
  { label:"2m",   ms:120000 },
  { label:"5m",   ms:300000 },
  { label:"10m",  ms:600000 },
];
const DEFAULT_POLL_MS = 30000;

// Session list limits
const LIMIT_OPTIONS = [
  { label:"10",  val:10  },
  { label:"20",  val:20  },
  { label:"50",  val:50  },
  { label:"100", val:100 },
  { label:"250", val:250 },
];
const DEFAULT_LIMIT = 50;

const DEFAULT_CACHE_LIMIT = 5;

const ACTIVITY_LIMIT_OPTIONS = [
  { label:"50",  val:50  },
  { label:"100", val:100 },
  { label:"200", val:200 },
  { label:"500", val:500 },
];
const DEFAULT_ACTIVITY_LIMIT = 100;
