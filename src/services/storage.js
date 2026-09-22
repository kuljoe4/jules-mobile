import { DEFAULT_LEAN_DIRECTIVE } from "../config/constants.js";
import { DEFAULT_PERSONAS } from "../config/personas.js";
import { isValidGithubRepoName, isValidGithubToken, isValidGoogleApiKey, isValidSessionId, isValidStorageKey, sanitizeObjectKeys } from "../utils/validation.js";

// ─── Safe Storage Service ────────────────────────────────────────────────────
const SafeStorage = {
  // ─── KEYS ──────────────────────────────────────────────────────────────────
  KEYS: {
    NOTIFY: "jac_notifications",
    POLL: "jac_poll_ms",
    ACT_POLL: "jac_act_poll_ms",
    ACTIVE_POLL: "jac_active_poll_ms",
    LIMIT: "jac_limit",
    CACHE_LIMIT: "jac_cache_limit",
    ACTIVITY_LIMIT: "jac_activity_limit",
    PLAN: "jac_plan",
    CUSTOM_DAILY: "jac_custom_daily",
    PERSONA_PROMPTS: "jac_persona_prompts",
    CUSTOM_PERSONAS: "jac_custom_personas",
    NET_STATS: "jac_net_stats",
    NS_DRAFT: "jac_ns_draft",
    REPO_STATS: "jac_repo_stats",
    LAST_SOURCE: "jac_last_source",
    LAST_BRANCHES: "jac_last_branches",
    ACT_MAP: "jac_act_map",
    ACT_STATS: "jac_act_stats",
    SESSION_CACHE: "jac_session_cache",
    DRAFTS_BOX: "jac_drafts_box",
    SESSION_REGISTRY: "jac_session_registry",
    ARCHIVED: "jac_archived",
    IGNORED: "jac_ignored",
    READ_MAP: "jac_read_map",
    API_KEY: "jac_key",
    API_TIMEOUT: "jac_api_timeout",
    GITHUB_TOKEN: "jac_github_token",
    LEAN_MODE_REPOS: "jac_lean_mode_repos",
    LEAN_DIRECTIVE: "jac_lean_directive",
    SESSIONS_LIST: "jac_sessions_list",
    REPO_FILTER: "jac_repo_filter",
  },

  // ─── CORE GENERIC HELPERS ──────────────────────────────────────────────────
  getItem(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? v : fallback;
    } catch {
      return fallback;
    }
  },

  setItem(key, val) {
    try {
      localStorage.setItem(key, val);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      const parsed = JSON.parse(v);
      if (fallback !== null) {
        if (Array.isArray(fallback)) {
          if (!Array.isArray(parsed)) return fallback;
          return parsed.map(item => (typeof item === "object" && item !== null && !Array.isArray(item)) ? sanitizeObjectKeys(item) : item);
        } else if (typeof fallback === 'object') {
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
          return sanitizeObjectKeys(parsed);
        } else if (typeof parsed !== typeof fallback) {
          return fallback;
        }
      }
      if (Array.isArray(parsed)) {
        return parsed.map(item => (typeof item === "object" && item !== null && !Array.isArray(item)) ? sanitizeObjectKeys(item) : item);
      }
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? sanitizeObjectKeys(parsed) : parsed;
    } catch {
      return fallback;
    }
  },

  setJSON(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch {
      return false;
    }
  },

  // ─── SPECIFIC GETTERS / SETTERS ────────────────────────────────────────────
  loadNotify() {
    return this.getItem(this.KEYS.NOTIFY) === "1";
  },
  saveNotify(v) {
    this.setItem(this.KEYS.NOTIFY, v ? "1" : "0");
  },

  loadPollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : DEFAULT_POLL_MS;
    } catch {
      return DEFAULT_POLL_MS;
    }
  },
  savePollMs(ms) {
    this.setItem(this.KEYS.POLL, ms);
  },

  loadActPollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACT_POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : DEFAULT_POLL_MS;
    } catch {
      return DEFAULT_POLL_MS;
    }
  },
  saveActPollMs(ms) {
    this.setItem(this.KEYS.ACT_POLL, ms);
  },

  loadActivePollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACTIVE_POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : 10000;
    } catch {
      return 10000;
    }
  },
  saveActivePollMs(ms) {
    this.setItem(this.KEYS.ACTIVE_POLL, ms);
  },

  loadApiTimeout() {
    try {
      const v = parseInt(this.getItem(this.KEYS.API_TIMEOUT));
      return [15000, 30000, 60000, 120000].includes(v) ? v : 30000;
    } catch {
      return 30000;
    }
  },
  saveApiTimeout(ms) {
    this.setItem(this.KEYS.API_TIMEOUT, ms);
  },

  loadCacheLimit() {
    try {
      const fallback = typeof DEFAULT_CACHE_LIMIT !== "undefined" ? DEFAULT_CACHE_LIMIT : 5;
      const v = parseInt(this.getItem(this.KEYS.CACHE_LIMIT), 10);
      return [0, 3, 5, 10, 20].includes(v) ? v : fallback;
    } catch {
      return 5;
    }
  },
  saveCacheLimit(v) {
    if ([0, 3, 5, 10, 20].includes(v)) {
      this.setItem(this.KEYS.CACHE_LIMIT, v);
      return true;
    }
    return false;
  },

  loadActivityLimit() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACTIVITY_LIMIT));
      return ACTIVITY_LIMIT_OPTIONS.some(o => o.val === v) ? v : DEFAULT_ACTIVITY_LIMIT;
    } catch {
      return DEFAULT_ACTIVITY_LIMIT;
    }
  },
  saveActivityLimit(v) {
    this.setItem(this.KEYS.ACTIVITY_LIMIT, v);
  },

  loadLimit() {
    try {
      const v = parseInt(this.getItem(this.KEYS.LIMIT));
      return LIMIT_OPTIONS.some(o => o.val === v) ? v : DEFAULT_LIMIT;
    } catch {
      return DEFAULT_LIMIT;
    }
  },
  saveLimit(v) {
    this.setItem(this.KEYS.LIMIT, v);
  },

  loadPlan() {
    const v = this.getItem(this.KEYS.PLAN, "free");
    return ["free", "pro", "ultra", "custom"].includes(v) ? v : "free";
  },
  savePlan(id) {
    if (["free", "pro", "ultra", "custom"].includes(id)) {
      this.setItem(this.KEYS.PLAN, id);
      return true;
    }
    return false;
  },

  loadCustomDaily() {
    try {
      const v = parseInt(this.getItem(this.KEYS.CUSTOM_DAILY), 10);
      return Number.isInteger(v) && v > 0 && v <= 10000 ? v : 50;
    } catch {
      return 50;
    }
  },
  saveCustomDaily(v) {
    const num = parseInt(v, 10);
    if (Number.isInteger(num) && num > 0 && num <= 10000) {
      this.setItem(this.KEYS.CUSTOM_DAILY, num);
      return true;
    }
    return false;
  },

  // Security: Sanitizes persona system prompts and custom focus role parameters against control character prompt injection
  // and LocalStorage state tampering by enforcing string types, stripping non-printable ASCII control characters
  // while preserving multiline formatting (\n, \r, \t), and bounding max character lengths.
  loadPersonas() {
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const mergedDefaults = DEFAULT_PERSONAS.map(p => {
        const raw = saved[p.id];
        const cleanPrompt = typeof raw === "string" ? raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 5000) : p.prompt;
        return {
          ...p,
          prompt: cleanPrompt || p.prompt
        };
      });
      const cleanCustom = custom.map(c => {
        const cleanObj = sanitizeObjectKeys(c);
        return {
          ...cleanObj,
          label: typeof cleanObj.label === "string" ? cleanObj.label.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 100) : "",
          role: typeof cleanObj.role === "string" ? cleanObj.role.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 100) : "",
          prompt: typeof cleanObj.prompt === "string" ? cleanObj.prompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 5000) : "",
          color: typeof cleanObj.color === "string" ? cleanObj.color.replace(/[\x00-\x1F\x7F\s]/g, "").slice(0, 30) : "",
          isCustom: true
        };
      });
      return [...mergedDefaults, ...cleanCustom];
    } catch {
      return DEFAULT_PERSONAS;
    }
  },
  // Security: Validates persona prompt key and sanitizes prompt text against Prototype Pollution, control character injection, and payload bloat.
  savePersonaPrompt(id, prompt) {
    if (!isValidStorageKey(id) || typeof prompt !== "string") return false;
    const cleanPrompt = prompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 5000);
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      saved[id] = cleanPrompt;
      return this.setJSON(this.KEYS.PERSONA_PROMPTS, saved);
    } catch {
      return false;
    }
  },
  // Security: Sanitizes custom persona fields against Prototype Pollution, control character prompt injection, and payload bloat.
  saveCustomPersona(persona) {
    if (!persona || typeof persona !== 'object' || !isValidStorageKey(persona.id)) return false;
    try {
      const cleanObj = sanitizeObjectKeys(persona);
      const cleanPersona = {
        ...cleanObj,
        id: cleanObj.id,
        label: typeof cleanObj.label === "string" ? cleanObj.label.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 100) : "",
        role: typeof cleanObj.role === "string" ? cleanObj.role.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 100) : "",
        prompt: typeof cleanObj.prompt === "string" ? cleanObj.prompt.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, 5000) : "",
        color: typeof cleanObj.color === "string" ? cleanObj.color.replace(/[\x00-\x1F\x7F\s]/g, "").slice(0, 30) : ""
      };
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const index = custom.findIndex(p => p.id === cleanPersona.id);
      if (index >= 0) {
        custom[index] = { ...custom[index], ...cleanPersona };
      } else {
        custom.push(cleanPersona);
      }
      return this.setJSON(this.KEYS.CUSTOM_PERSONAS, custom);
    } catch {
      return false;
    }
  },
  deleteCustomPersona(id) {
    if (!isValidStorageKey(id)) return false;
    try {
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const filtered = custom.filter(p => p.id !== id);
      return this.setJSON(this.KEYS.CUSTOM_PERSONAS, filtered);
    } catch {
      return false;
    }
  },
  resetPersonas() {
    this.removeItem(this.KEYS.PERSONA_PROMPTS);
    this.removeItem(this.KEYS.CUSTOM_PERSONAS);
    return DEFAULT_PERSONAS;
  },

  loadNetStats() {
    return this.getJSON(this.KEYS.NET_STATS, { overall: { in: 0, out: 0 }, daily: {} });
  },
  saveNetStats(stats) {
    this.setJSON(this.KEYS.NET_STATS, stats);
  },

  loadDraft() {
    return this.getJSON(this.KEYS.NS_DRAFT);
  },
  // Security: Validates and sanitizes draft object keys against Prototype Pollution and property shadowing.
  saveDraft(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) {
      this.removeItem(this.KEYS.NS_DRAFT);
      return false;
    }
    const cleanDraft = sanitizeObjectKeys(d);
    return this.setJSON(this.KEYS.NS_DRAFT, cleanDraft);
  },
  clearDraft() {
    this.removeItem(this.KEYS.NS_DRAFT);
  },

  loadRepoStats() {
    return this.getJSON(this.KEYS.REPO_STATS, {});
  },
  saveRepoStats(stats) {
    return this.setJSON(this.KEYS.REPO_STATS, stats);
  },
  // Security: Validates repository stat key against Prototype Pollution and built-in property shadowing.
  incRepoStat(name) {
    if (!isValidStorageKey(name)) return false;
    try {
      const stats = this.loadRepoStats();
      stats[name] = (typeof stats[name] === "number" ? stats[name] : 0) + 1;
      return this.saveRepoStats(stats);
    } catch {
      return false;
    }
  },

  loadLastSource() {
    return this.getItem(this.KEYS.LAST_SOURCE, "");
  },
  // Security: Validates last source name string against control characters / null-byte injection.
  saveLastSource(name) {
    const str = typeof name === "string" ? name : "";
    if (/[\x00-\x1F\x7F]/.test(str)) return false;
    return this.setItem(this.KEYS.LAST_SOURCE, str);
  },

  loadLeanModeRepos() {
    return this.getJSON(this.KEYS.LEAN_MODE_REPOS, {});
  },
  // Security: Validates source key against Prototype Pollution and built-in property shadowing.
  saveLeanModeRepo(source, isLean) {
    if (!isValidStorageKey(source)) return false;
    try {
      const repos = this.loadLeanModeRepos();
      repos[source] = !!isLean;
      return this.setJSON(this.KEYS.LEAN_MODE_REPOS, repos);
    } catch {
      return false;
    }
  },

  // Security: Validates and sanitizes lean mode system directives to prevent control character / null-byte injection
  // and prompt payload bloat/tampering when directives are appended to session prompt bodies.
  loadLeanDirective() {
    const v = this.getItem(this.KEYS.LEAN_DIRECTIVE, DEFAULT_LEAN_DIRECTIVE);
    if (typeof v === "string" && v.trim() && !/[\x00-\x1F\x7F]/.test(v) && v.length <= 5000) {
      return v;
    }
    return DEFAULT_LEAN_DIRECTIVE;
  },
  saveLeanDirective(val) {
    const str = typeof val === "string" ? val.trim() : "";
    if (!str || /[\x00-\x1F\x7F]/.test(str) || str.length > 5000) return false;
    return this.setItem(this.KEYS.LEAN_DIRECTIVE, str);
  },
  loadLastBranches() {
    return this.getJSON(this.KEYS.LAST_BRANCHES, {});
  },
  // Security: Validates and sanitizes last branches object keys against Prototype Pollution and control character injection.
  saveLastBranches(branches) {
    if (!branches || typeof branches !== "object" || Array.isArray(branches)) return false;
    const cleanBranches = sanitizeObjectKeys(branches);
    const sanitized = {};
    const keys = Object.keys(cleanBranches);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      const val = cleanBranches[k];
      if (isValidStorageKey(k) && typeof val === "string" && !/[\x00-\x1F\x7F]/.test(val)) {
        sanitized[k] = val;
      }
    }
    return this.setJSON(this.KEYS.LAST_BRANCHES, sanitized);
  },
  // Security: Validates source key and branch parameter against Prototype Pollution and control character injection.
  saveLastBranch(source, branch) {
    if (!isValidStorageKey(source) || typeof branch !== "string" || /[\x00-\x1F\x7F]/.test(branch)) return false;
    try {
      const branches = this.loadLastBranches();
      branches[source] = branch;
      return this.saveLastBranches(branches);
    } catch {
      return false;
    }
  },

  loadDraftsBox() {
    return this.getJSON(this.KEYS.DRAFTS_BOX, []);
  },
  saveDraftsBox(drafts) {
    this.setJSON(this.KEYS.DRAFTS_BOX, drafts);
  },
  // Security: Validates draft object and ID to prevent Prototype Pollution, property shadowing, and control character injection.
  saveDraftToBox(draft) {
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return null;
    try {
      const cleanDraft = sanitizeObjectKeys(draft);
      if (cleanDraft.id && !isValidStorageKey(cleanDraft.id)) return null;
      const drafts = this.loadDraftsBox();
      const newDraft = {
        ...cleanDraft,
        id: cleanDraft.id || "dr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        createdAt: cleanDraft.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      const idx = drafts.findIndex(d => d.id === newDraft.id);
      if (idx >= 0) drafts[idx] = newDraft;
      else drafts.unshift(newDraft);
      this.saveDraftsBox(drafts);
      return newDraft;
    } catch (e) {
      return null;
    }
  },
  // Security: Validates draft ID against Prototype Pollution and control character injection before filtering.
  deleteDraftFromBox(id) {
    if (!isValidStorageKey(id)) return false;
    try {
      const drafts = this.loadDraftsBox().filter(d => d.id !== id);
      this.saveDraftsBox(drafts);
      return true;
    } catch {
      return false;
    }
  },
  clearDraftsBox() {
    this.removeItem(this.KEYS.DRAFTS_BOX);
  },

  loadSessionRegistry() {
    return this.getJSON(this.KEYS.SESSION_REGISTRY, {});
  },
  // Security: Validates session IDs and sanitizes keys against Prototype Pollution and parameter injection.
  saveSessionRegistry(reg) {
    if (!reg || typeof reg !== "object" || Array.isArray(reg)) return false;
    const cleanReg = sanitizeObjectKeys(reg);
    const sanitized = {};
    const keys = Object.keys(cleanReg);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isValidSessionId(k)) sanitized[k] = cleanReg[k];
    }
    return this.setJSON(this.KEYS.SESSION_REGISTRY, sanitized);
  },

  loadArchived() {
    const list = this.getJSON(this.KEYS.ARCHIVED, []);
    return Array.isArray(list) ? list.filter(isValidSessionId) : [];
  },
  // Security: Validates session IDs in archived array against path traversal and control characters.
  saveArchived(archivedArr) {
    if (!Array.isArray(archivedArr)) return false;
    const cleanArr = archivedArr.filter(isValidSessionId);
    return this.setJSON(this.KEYS.ARCHIVED, cleanArr);
  },

  loadIgnored() {
    const list = this.getJSON(this.KEYS.IGNORED, []);
    return Array.isArray(list) ? list.filter(isValidSessionId) : [];
  },
  // Security: Validates session IDs in ignored array against path traversal and control characters.
  saveIgnored(ignoredArr) {
    if (!Array.isArray(ignoredArr)) return false;
    const cleanArr = ignoredArr.filter(isValidSessionId);
    return this.setJSON(this.KEYS.IGNORED, cleanArr);
  },

  loadReadMap() {
    return this.getJSON(this.KEYS.READ_MAP, {});
  },
  // Security: Validates session IDs and sanitizes readMap keys against Prototype Pollution.
  saveReadMap(readMap) {
    if (!readMap || typeof readMap !== "object" || Array.isArray(readMap)) return false;
    const cleanMap = sanitizeObjectKeys(readMap);
    const sanitized = {};
    const keys = Object.keys(cleanMap);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isValidSessionId(k)) sanitized[k] = cleanMap[k];
    }
    return this.setJSON(this.KEYS.READ_MAP, sanitized);
  },

  loadActStats() {
    return this.getJSON(this.KEYS.ACT_STATS, {});
  },
  // Security: Validates session IDs and sanitizes actStats keys against Prototype Pollution.
  saveActStats(stats) {
    if (!stats || typeof stats !== "object" || Array.isArray(stats)) return false;
    const cleanStats = sanitizeObjectKeys(stats);
    const sanitized = {};
    const keys = Object.keys(cleanStats);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isValidSessionId(k)) sanitized[k] = cleanStats[k];
    }
    return this.setJSON(this.KEYS.ACT_STATS, sanitized);
  },

  loadActivitiesMap() {
    return this.getJSON(this.KEYS.ACT_MAP, {});
  },
  // Security: Validates session IDs and sanitizes activitiesMap keys against Prototype Pollution.
  saveActivitiesMap(map) {
    if (!map || typeof map !== "object" || Array.isArray(map)) return false;
    const cleanMap = sanitizeObjectKeys(map);
    const sanitized = {};
    const keys = Object.keys(cleanMap);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isValidSessionId(k)) sanitized[k] = cleanMap[k];
    }
    return this.setJSON(this.KEYS.ACT_MAP, sanitized);
  },

  loadSessionCache() {
    return this.getJSON(this.KEYS.SESSION_CACHE, {});
  },
  // Security: Validates session IDs and sanitizes sessionCache keys against Prototype Pollution.
  saveSessionCache(cache) {
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) return false;
    const cleanCache = sanitizeObjectKeys(cache);
    const sanitized = {};
    const keys = Object.keys(cleanCache);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (isValidSessionId(k)) sanitized[k] = cleanCache[k];
    }
    return this.setJSON(this.KEYS.SESSION_CACHE, sanitized);
  },

  loadSessionsList() {
    return this.getJSON(this.KEYS.SESSIONS_LIST, []);
  },
  // Security: Validates and sanitizes sessions list array objects against Prototype Pollution.
  saveSessionsList(sessions) {
    if (!Array.isArray(sessions)) return false;
    const cleanSessions = sessions.map(item => (typeof item === "object" && item !== null && !Array.isArray(item)) ? sanitizeObjectKeys(item) : item);
    return this.setJSON(this.KEYS.SESSIONS_LIST, cleanSessions);
  },

  loadRepoFilter() {
    const v = this.getItem(this.KEYS.REPO_FILTER, "ALL");
    if (v === "ALL" || (v && isValidGithubRepoName(v))) return v;
    return "ALL";
  },
  saveRepoFilter(val) {
    if (!val || val === "ALL" || isValidGithubRepoName(val)) {
      this.setItem(this.KEYS.REPO_FILTER, val || "ALL");
      return true;
    }
    return false;
  },

  loadApiKey() {
    const raw = this.getItem(this.KEYS.API_KEY, "");
    if (!raw || typeof raw !== "string") return "";
    const val = raw.trim();
    if (!val) return "";
    if (isValidGoogleApiKey(val)) {
      if (raw !== val) {
        this.setItem(this.KEYS.API_KEY, val);
      }
      return val;
    }
    return "";
  },
  saveApiKey(val) {
    const clean = typeof val === "string" ? val.trim() : "";
    if (!clean) {
      this.setItem(this.KEYS.API_KEY, "");
      return true;
    }
    if (isValidGoogleApiKey(clean)) {
      this.setItem(this.KEYS.API_KEY, clean);
      return true;
    }
    return false;
  },

  loadGithubToken() {
    const raw = this.getItem(this.KEYS.GITHUB_TOKEN, "");
    if (!raw || typeof raw !== "string") return "";
    const val = raw.trim();
    if (!val) return "";
    if (isValidGithubToken(val)) {
      if (raw !== val) {
        this.setItem(this.KEYS.GITHUB_TOKEN, val);
      }
      return val;
    }
    return "";
  },
  saveGithubToken(val) {
    const clean = typeof val === "string" ? val.trim() : "";
    if (!clean) {
      this.setItem(this.KEYS.GITHUB_TOKEN, "");
      return true;
    }
    if (isValidGithubToken(clean)) {
      this.setItem(this.KEYS.GITHUB_TOKEN, clean);
      return true;
    }
    return false;
  },

  // Security: Validates session identifier before accessing LocalStorage keys to prevent parameter pollution or key injection.
  loadFollowupDraft(sessionId) {
    if (!isValidSessionId(sessionId)) return "";
    return this.getItem(`jac_draft_${sessionId}`, "");
  },
  saveFollowupDraft(sessionId, val) {
    if (!isValidSessionId(sessionId)) return false;
    return this.setItem(`jac_draft_${sessionId}`, val);
  },
  clearFollowupDraft(sessionId) {
    if (!isValidSessionId(sessionId)) return false;
    return this.removeItem(`jac_draft_${sessionId}`);
  },
};

export { SafeStorage };
