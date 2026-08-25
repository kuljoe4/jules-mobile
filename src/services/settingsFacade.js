function loadPollMs() { return SafeStorage.loadPollMs(); }
function savePollMs(ms) { SafeStorage.savePollMs(ms); }

function loadActPollMs() { return SafeStorage.loadActPollMs(); }
function saveActPollMs(ms) { SafeStorage.saveActPollMs(ms); }

function loadActivePollMs() { return SafeStorage.loadActivePollMs(); }
function saveActivePollMs(ms) { SafeStorage.saveActivePollMs(ms); }

function loadApiTimeout() { return SafeStorage.loadApiTimeout(); }
function saveApiTimeout(ms) { SafeStorage.saveApiTimeout(ms); }

// ─── Session list limits ──────────────────────────────────────────────────────
function loadCacheLimit() { return SafeStorage.loadCacheLimit(); }
function saveCacheLimit(v) { SafeStorage.saveCacheLimit(v); }

function loadActivityLimit() { return SafeStorage.loadActivityLimit(); }
function saveActivityLimit(v) { SafeStorage.saveActivityLimit(v); }

function loadLimit() { return SafeStorage.loadLimit(); }
function saveLimit(v) { SafeStorage.saveLimit(v); }


// ─── Plan limits (from jules.google/docs/usage-limits) ───────────────────────
const PLANS = [
  { id:"free",  label:"Free",  daily:15,  concurrent:3,  model:"Gemini 2.5 Pro" },
  { id:"pro",   label:"Pro",   daily:100, concurrent:15, model:"Gemini 3 Pro" },
  { id:"ultra", label:"Ultra", daily:300, concurrent:60, model:"Gemini 3 Pro (priority)" },
  { id:"custom",label:"Custom",daily:0,   concurrent:0,  model:"Custom Config" },
];
function loadPlan() { return SafeStorage.loadPlan(); }
function savePlan(id) { SafeStorage.savePlan(id); }

function loadCustomDaily() { return SafeStorage.loadCustomDaily(); }
function saveCustomDaily(v) { SafeStorage.saveCustomDaily(v); }
