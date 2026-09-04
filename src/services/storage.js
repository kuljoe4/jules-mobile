import { isValidSessionId, isValidStorageKey, sanitizeObjectKeys } from "../utils/validation.js";

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
        } else if (typeof fallback === 'object') {
          if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;
          return sanitizeObjectKeys(parsed);
        } else if (typeof parsed !== typeof fallback) {
          return fallback;
        }
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
      const v = parseInt(this.getItem(this.KEYS.CACHE_LIMIT));
      return isNaN(v) ? DEFAULT_CACHE_LIMIT : v;
    } catch {
      return DEFAULT_CACHE_LIMIT;
    }
  },
  saveCacheLimit(v) {
    this.setItem(this.KEYS.CACHE_LIMIT, v);
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
    return this.getItem(this.KEYS.PLAN, "free");
  },
  savePlan(id) {
    this.setItem(this.KEYS.PLAN, id);
  },

  loadCustomDaily() {
    try {
      return parseInt(this.getItem(this.KEYS.CUSTOM_DAILY)) || 50;
    } catch {
      return 50;
    }
  },
  saveCustomDaily(v) {
    this.setItem(this.KEYS.CUSTOM_DAILY, v);
  },

  loadPersonas() {
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const mergedDefaults = DEFAULT_PERSONAS.map(p => ({
        ...p,
        prompt: saved[p.id] || p.prompt
      }));
      return [...mergedDefaults, ...custom.map(c => ({ ...c, isCustom: true }))];
    } catch {
      return DEFAULT_PERSONAS;
    }
  },
  // Security: Validates persona prompt key against Prototype Pollution and property shadowing.
  savePersonaPrompt(id, prompt) {
    if (!isValidStorageKey(id)) return false;
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      saved[id] = prompt;
      return this.setJSON(this.KEYS.PERSONA_PROMPTS, saved);
    } catch {
      return false;
    }
  },
  saveCustomPersona(persona) {
    if (!persona || typeof persona !== 'object' || !isValidStorageKey(persona.id)) return false;
    try {
      const cleanPersona = sanitizeObjectKeys(persona);
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
  saveDraft(d) {
    this.setJSON(this.KEYS.NS_DRAFT, d);
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
  saveLastSource(name) {
    this.setItem(this.KEYS.LAST_SOURCE, name || "");
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

  loadLeanDirective() {
    return this.getItem(this.KEYS.LEAN_DIRECTIVE, DEFAULT_LEAN_DIRECTIVE);
  },
  saveLeanDirective(val) {
    this.setItem(this.KEYS.LEAN_DIRECTIVE, val);
  },
  loadLastBranches() {
    return this.getJSON(this.KEYS.LAST_BRANCHES, {});
  },
  saveLastBranches(branches) {
    return this.setJSON(this.KEYS.LAST_BRANCHES, branches);
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
  saveDraftToBox(draft) {
    try {
      const drafts = this.loadDraftsBox();
      const newDraft = {
        ...draft,
        id: draft.id || "dr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
        createdAt: draft.createdAt || Date.now(),
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
  deleteDraftFromBox(id) {
    try {
      const drafts = this.loadDraftsBox().filter(d => d.id !== id);
      this.saveDraftsBox(drafts);
    } catch {}
  },
  clearDraftsBox() {
    this.removeItem(this.KEYS.DRAFTS_BOX);
  },

  loadSessionRegistry() {
    return this.getJSON(this.KEYS.SESSION_REGISTRY, {});
  },
  saveSessionRegistry(reg) {
    this.setJSON(this.KEYS.SESSION_REGISTRY, reg);
  },

  loadArchived() {
    return this.getJSON(this.KEYS.ARCHIVED, []);
  },
  saveArchived(archivedArr) {
    this.setJSON(this.KEYS.ARCHIVED, archivedArr);
  },

  loadIgnored() {
    return this.getJSON(this.KEYS.IGNORED, []);
  },
  saveIgnored(ignoredArr) {
    this.setJSON(this.KEYS.IGNORED, ignoredArr);
  },

  loadReadMap() {
    return this.getJSON(this.KEYS.READ_MAP, {});
  },
  saveReadMap(readMap) {
    this.setJSON(this.KEYS.READ_MAP, readMap);
  },

  loadActStats() {
    return this.getJSON(this.KEYS.ACT_STATS, {});
  },
  saveActStats(stats) {
    this.setJSON(this.KEYS.ACT_STATS, stats);
  },

  loadActivitiesMap() {
    return this.getJSON(this.KEYS.ACT_MAP, {});
  },
  saveActivitiesMap(map) {
    this.setJSON(this.KEYS.ACT_MAP, map);
  },

  loadSessionCache() {
    return this.getJSON(this.KEYS.SESSION_CACHE, {});
  },
  saveSessionCache(cache) {
    this.setJSON(this.KEYS.SESSION_CACHE, cache);
  },

  loadSessionsList() {
    return this.getJSON(this.KEYS.SESSIONS_LIST, []);
  },
  saveSessionsList(sessions) {
    this.setJSON(this.KEYS.SESSIONS_LIST, sessions);
  },

  loadRepoFilter() {
    return this.getItem(this.KEYS.REPO_FILTER, "ALL");
  },
  saveRepoFilter(val) {
    this.setItem(this.KEYS.REPO_FILTER, val || "ALL");
  },

  loadApiKey() {
    return this.getItem(this.KEYS.API_KEY, "");
  },
  saveApiKey(val) {
    this.setItem(this.KEYS.API_KEY, val);
  },

  loadGithubToken() {
    return this.getItem(this.KEYS.GITHUB_TOKEN, "");
  },
  saveGithubToken(val) {
    this.setItem(this.KEYS.GITHUB_TOKEN, val);
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
