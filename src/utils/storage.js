import {
  POLL_OPTIONS, DEFAULT_POLL_MS, LIMIT_OPTIONS, DEFAULT_LIMIT,
  DEFAULT_CACHE_LIMIT, ACTIVITY_LIMIT_OPTIONS, DEFAULT_ACTIVITY_LIMIT
} from "../constants/config.js";
import { DEFAULT_PERSONAS } from "../constants/personas.js";

export const SafeStorage = {
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
  },

  getItem(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? v : fallback; }
    catch { return fallback; }
  },

  setItem(key, val) {
    try { localStorage.setItem(key, val); return true; }
    catch { return false; }
  },

  removeItem(key) {
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
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
        } else if (typeof parsed !== typeof fallback) {
          return fallback;
        }
      }
      return parsed;
    } catch { return fallback; }
  },

  setJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch { return false; }
  },

  loadNotify() { return this.getItem(this.KEYS.NOTIFY) === "1"; },
  saveNotify(v) { this.setItem(this.KEYS.NOTIFY, v ? "1" : "0"); },

  loadPollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : DEFAULT_POLL_MS;
    } catch { return DEFAULT_POLL_MS; }
  },
  savePollMs(ms) { this.setItem(this.KEYS.POLL, ms); },

  loadActPollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACT_POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : DEFAULT_POLL_MS;
    } catch { return DEFAULT_POLL_MS; }
  },
  saveActPollMs(ms) { this.setItem(this.KEYS.ACT_POLL, ms); },

  loadActivePollMs() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACTIVE_POLL));
      return POLL_OPTIONS.some(o => o.ms === v) ? v : 10000;
    } catch { return 10000; }
  },
  saveActivePollMs(ms) { this.setItem(this.KEYS.ACTIVE_POLL, ms); },

  loadApiTimeout() {
    try {
      const v = parseInt(this.getItem(this.KEYS.API_TIMEOUT));
      return [15000, 30000, 60000, 120000].includes(v) ? v : 30000;
    } catch { return 30000; }
  },
  saveApiTimeout(ms) { this.setItem(this.KEYS.API_TIMEOUT, ms); },

  loadCacheLimit() {
    try {
      const v = parseInt(this.getItem(this.KEYS.CACHE_LIMIT));
      return isNaN(v) ? DEFAULT_CACHE_LIMIT : v;
    } catch { return DEFAULT_CACHE_LIMIT; }
  },
  saveCacheLimit(v) { this.setItem(this.KEYS.CACHE_LIMIT, v); },

  loadActivityLimit() {
    try {
      const v = parseInt(this.getItem(this.KEYS.ACTIVITY_LIMIT));
      return ACTIVITY_LIMIT_OPTIONS.some(o => o.val === v) ? v : DEFAULT_ACTIVITY_LIMIT;
    } catch { return DEFAULT_ACTIVITY_LIMIT; }
  },
  saveActivityLimit(v) { this.setItem(this.KEYS.ACTIVITY_LIMIT, v); },

  loadLimit() {
    try {
      const v = parseInt(this.getItem(this.KEYS.LIMIT));
      return LIMIT_OPTIONS.some(o => o.val === v) ? v : DEFAULT_LIMIT;
    } catch { return DEFAULT_LIMIT; }
  },
  saveLimit(v) { this.setItem(this.KEYS.LIMIT, v); },

  loadPlan() { return this.getItem(this.KEYS.PLAN, "free"); },
  savePlan(id) { this.setItem(this.KEYS.PLAN, id); },

  loadCustomDaily() {
    try { return parseInt(this.getItem(this.KEYS.CUSTOM_DAILY)) || 50; }
    catch { return 50; }
  },
  saveCustomDaily(v) { this.setItem(this.KEYS.CUSTOM_DAILY, v); },

  loadPersonas() {
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const mergedDefaults = DEFAULT_PERSONAS.map(p => ({
        ...p, prompt: saved[p.id] || p.prompt
      }));
      return [...mergedDefaults, ...custom.map(c => ({ ...c, isCustom: true }))];
    } catch { return DEFAULT_PERSONAS; }
  },
  savePersonaPrompt(id, prompt) {
    try {
      const saved = this.getJSON(this.KEYS.PERSONA_PROMPTS, {});
      saved[id] = prompt;
      this.setJSON(this.KEYS.PERSONA_PROMPTS, saved);
    } catch {}
  },
  saveCustomPersona(persona) {
    try {
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const index = custom.findIndex(p => p.id === persona.id);
      if (index >= 0) custom[index] = { ...custom[index], ...persona };
      else custom.push(persona);
      this.setJSON(this.KEYS.CUSTOM_PERSONAS, custom);
    } catch {}
  },
  deleteCustomPersona(id) {
    try {
      const custom = this.getJSON(this.KEYS.CUSTOM_PERSONAS, []);
      const filtered = custom.filter(p => p.id !== id);
      this.setJSON(this.KEYS.CUSTOM_PERSONAS, filtered);
    } catch {}
  },
  resetPersonas() {
    this.removeItem(this.KEYS.PERSONA_PROMPTS);
    this.removeItem(this.KEYS.CUSTOM_PERSONAS);
    return DEFAULT_PERSONAS;
  },

  loadNetStats() { return this.getJSON(this.KEYS.NET_STATS, { overall: { in: 0, out: 0 }, daily: {} }); },
  saveNetStats(stats) { this.setJSON(this.KEYS.NET_STATS, stats); },

  loadDraft() { return this.getJSON(this.KEYS.NS_DRAFT); },
  saveDraft(d) { this.setJSON(this.KEYS.NS_DRAFT, d); },
  clearDraft() { this.removeItem(this.KEYS.NS_DRAFT); },

  loadRepoStats() { return this.getJSON(this.KEYS.REPO_STATS, {}); },
  saveRepoStats(stats) { this.setJSON(this.KEYS.REPO_STATS, stats); },
  incRepoStat(name) {
    if (!name) return;
    try {
      const stats = this.loadRepoStats();
      stats[name] = (stats[name] || 0) + 1;
      this.saveRepoStats(stats);
    } catch {}
  },

  loadLastSource() { return this.getItem(this.KEYS.LAST_SOURCE, ""); },
  saveLastSource(name) { this.setItem(this.KEYS.LAST_SOURCE, name || ""); },

  loadLastBranches() { return this.getJSON(this.KEYS.LAST_BRANCHES, {}); },
  saveLastBranches(branches) { this.setJSON(this.KEYS.LAST_BRANCHES, branches); },
  saveLastBranch(source, branch) {
    if (!source || !branch) return;
    try {
      const branches = this.loadLastBranches();
      branches[source] = branch;
      this.saveLastBranches(branches);
    } catch {}
  },

  loadDraftsBox() { return this.getJSON(this.KEYS.DRAFTS_BOX, []); },
  saveDraftsBox(drafts) { this.setJSON(this.KEYS.DRAFTS_BOX, drafts); },
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
    } catch (e) { return null; }
  },
  deleteDraftFromBox(id) {
    try {
      const drafts = this.loadDraftsBox().filter(d => d.id !== id);
      this.saveDraftsBox(drafts);
    } catch {}
  },
  clearDraftsBox() { this.removeItem(this.KEYS.DRAFTS_BOX); },

  loadSessionRegistry() { return this.getJSON(this.KEYS.SESSION_REGISTRY, {}); },
  saveSessionRegistry(reg) { this.setJSON(this.KEYS.SESSION_REGISTRY, reg); },

  loadArchived() { return this.getJSON(this.KEYS.ARCHIVED, []); },
  saveArchived(archivedArr) { this.setJSON(this.KEYS.ARCHIVED, archivedArr); },

  loadIgnored() { return this.getJSON(this.KEYS.IGNORED, []); },
  saveIgnored(ignoredArr) { this.setJSON(this.KEYS.IGNORED, ignoredArr); },

  loadReadMap() { return this.getJSON(this.KEYS.READ_MAP, {}); },
  saveReadMap(readMap) { this.setJSON(this.KEYS.READ_MAP, readMap); },

  loadActStats() { return this.getJSON(this.KEYS.ACT_STATS, {}); },
  saveActStats(stats) { this.setJSON(this.KEYS.ACT_STATS, stats); },

  loadActivitiesMap() { return this.getJSON(this.KEYS.ACT_MAP, {}); },
  saveActivitiesMap(map) { this.setJSON(this.KEYS.ACT_MAP, map); },

  loadSessionCache() { return this.getJSON(this.KEYS.SESSION_CACHE, {}); },
  saveSessionCache(cache) { this.setJSON(this.KEYS.SESSION_CACHE, cache); },

  loadApiKey() { return this.getItem(this.KEYS.API_KEY, ""); },
  saveApiKey(val) { this.setItem(this.KEYS.API_KEY, val); },

  loadGithubToken() { return this.getItem(this.KEYS.GITHUB_TOKEN, ""); },
  saveGithubToken(val) { this.setItem(this.KEYS.GITHUB_TOKEN, val); },

  loadFollowupDraft(sessionId) { return this.getItem(`jac_draft_${sessionId}`, ""); },
  saveFollowupDraft(sessionId, val) { this.setItem(`jac_draft_${sessionId}`, val); },
  clearFollowupDraft(sessionId) { this.removeItem(`jac_draft_${sessionId}`); },
};

export function loadNotify() { return SafeStorage.loadNotify(); }
export function saveNotify(v) { SafeStorage.saveNotify(v); }
export function loadPollMs() { return SafeStorage.loadPollMs(); }
export function savePollMs(ms) { SafeStorage.savePollMs(ms); }
export function loadActPollMs() { return SafeStorage.loadActPollMs(); }
export function saveActPollMs(ms) { SafeStorage.saveActPollMs(ms); }
export function loadActivePollMs() { return SafeStorage.loadActivePollMs(); }
export function saveActivePollMs(ms) { SafeStorage.saveActivePollMs(ms); }
export function loadApiTimeout() { return SafeStorage.loadApiTimeout(); }
export function saveApiTimeout(ms) { SafeStorage.saveApiTimeout(ms); }
export function loadCacheLimit() { return SafeStorage.loadCacheLimit(); }
export function saveCacheLimit(v) { SafeStorage.saveCacheLimit(v); }
export function loadActivityLimit() { return SafeStorage.loadActivityLimit(); }
export function saveActivityLimit(v) { SafeStorage.saveActivityLimit(v); }
export function loadLimit() { return SafeStorage.loadLimit(); }
export function saveLimit(v) { SafeStorage.saveLimit(v); }
export function loadPlan() { return SafeStorage.loadPlan(); }
export function savePlan(id) { SafeStorage.savePlan(id); }
export function loadCustomDaily() { return SafeStorage.loadCustomDaily(); }
export function saveCustomDaily(v) { SafeStorage.saveCustomDaily(v); }
export function loadPersonas() { return SafeStorage.loadPersonas(); }
export function savePersonaPrompt(id, prompt) { SafeStorage.savePersonaPrompt(id, prompt); }
export function saveCustomPersona(persona) { SafeStorage.saveCustomPersona(persona); }
export function deleteCustomPersona(id) { SafeStorage.deleteCustomPersona(id); }
export function resetPersonas() { return SafeStorage.resetPersonas(); }
export function loadDraft() { return SafeStorage.loadDraft(); }
export function saveDraft(d) { SafeStorage.saveDraft(d); }
export function clearDraft() { SafeStorage.clearDraft(); }
export function loadRepoStats() { return SafeStorage.loadRepoStats(); }
export function saveRepoStats(stats) { SafeStorage.saveRepoStats(stats); }
export function incRepoStat(name) { SafeStorage.incRepoStat(name); }
export function loadLastSource() { return SafeStorage.loadLastSource(); }
export function saveLastSource(name) { SafeStorage.saveLastSource(name); }
export function loadLastBranches() { return SafeStorage.loadLastBranches(); }
export function saveLastBranches(branches) { SafeStorage.saveLastBranches(branches); }
export function saveLastBranch(source, branch) { SafeStorage.saveLastBranch(source, branch); }
export function loadDraftsBox() { return SafeStorage.loadDraftsBox(); }
export function saveDraftsBox(drafts) { SafeStorage.saveDraftsBox(drafts); }
export function saveDraftToBox(draft) { return SafeStorage.saveDraftToBox(draft); }
export function deleteDraftFromBox(id) { SafeStorage.deleteDraftFromBox(id); }
export function clearDraftsBox() { SafeStorage.clearDraftsBox(); }
export function loadApiKey() { return SafeStorage.loadApiKey(); }
export function saveApiKey(val) { SafeStorage.saveApiKey(val); }
export function loadGithubToken() { return SafeStorage.loadGithubToken(); }
export function saveGithubToken(val) { SafeStorage.saveGithubToken(val); }

export function cleanupActivityStats(validSessionIds) {
  if (!validSessionIds || validSessionIds.length === 0) return;
  try {
    const stats = SafeStorage.loadActStats();
    const activeKeys = new Set(validSessionIds);
    let changed = false;
    Object.keys(stats).forEach(k => {
      if (!activeKeys.has(k)) { delete stats[k]; changed = true; }
    });
    if (changed) SafeStorage.saveActStats(stats);
  } catch {}
}
