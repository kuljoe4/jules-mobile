import { LRUCache } from './cache.js';

const WORKING_SET_CACHE = new LRUCache(500);
const FILE_MENTION_RE = /`([^`\s]+\.[a-z0-9]+)`/gi;

// Global WeakMap to cache parsed unidiff patch results directly by reference-stable gitPatch objects inside activities.
// This turns repetitive string splitting, hunk iteration, and multi-pass line scanning into flat O(1) lookups on re-renders.
const PARSED_PATCH_CACHE = new WeakMap();

// Global WeakMap to cache extracted working set file lists for individual reference-stable activity objects.
// OPTIMIZATION (Bolt): Caching per-activity file mentions and unidiff patch extractions avoids redundant regex matches
// and patch traversals across sessions when evaluating file overlaps in ConflictRadar and NewSession.
const WORKING_SET_ACTIVITY_CACHE = new WeakMap();

/**
 * Parses a git unidiff patch text into a structured list of file groups, each containing
 * filename, hunks (header, lines), additions (adds), removals (rems), and rawLines.
 *
 * This pure utility is extracted out of DiffViewer to prevent "God Mode" and mixed concerns,
 * keeping low-level string parsing separate from high-level visual rendering and UI state.
 *
 * Now optimized with reference-stable caching for extremely high performance.
 */
const parseUnidiffPatch = (patchOrObj, ts = null) => {
  if (!patchOrObj) return [];
  const isObj = typeof patchOrObj === "object" && patchOrObj !== null;
  const patch = isObj ? patchOrObj.unidiffPatch : patchOrObj;
  if (!patch) return [];

  if (isObj && PARSED_PATCH_CACHE.has(patchOrObj)) {
    const cached = PARSED_PATCH_CACHE.get(patchOrObj);
    if (ts !== null) {
      cached.forEach(g => { g.ts = ts; });
    }
    return cached;
  }

  const allGroups = [];
  const lines = patch.split("\n");
  let currentGroup = null;

  lines.forEach((line) => {
    if (line.startsWith("--- ") || line.startsWith("diff --git")) return;
    if (line.startsWith("+++ ")) {
      const file = line.slice(4).replace(/^b\//, "");
      currentGroup = {
        file,
        hunks: [],
        adds: 0,
        rems: 0,
        ts,
        rawLines: [`--- a/${file}`, `+++ b/${file}`]
      };
      allGroups.push(currentGroup);
      return;
    }
    if (!currentGroup) return;

    currentGroup.rawLines.push(line);

    if (line.startsWith("@@")) {
      currentGroup.hunks.push({ header: line, lines: [] });
    } else if (currentGroup.hunks.length > 0) {
      currentGroup.hunks[currentGroup.hunks.length - 1].lines.push(line);
      if (line.startsWith("+")) currentGroup.adds++;
      else if (line.startsWith("-")) currentGroup.rems++;
    }
  });

  if (isObj) {
    PARSED_PATCH_CACHE.set(patchOrObj, allGroups);
  }
  return allGroups;
};

const getWorkingSet = (s, activities = []) => {
  if (!s) return [];
  const sid = s.id || s.name || "temp";
  const actLen = activities.length;
  const promptLen = s.prompt?.length || 0;
  const cacheKey = `${sid}:${actLen}:${promptLen}`;

  if (WORKING_SET_CACHE.has(cacheKey)) return WORKING_SET_CACHE.get(cacheKey);

  const files = new Set();

  // 1. Scan activities for patches and plan file mentions, using WeakMap per-activity caching
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a) continue;

    let actFiles = WORKING_SET_ACTIVITY_CACHE.get(a);
    if (!actFiles) {
      actFiles = new Set();
      if (a.artifacts && Array.isArray(a.artifacts)) {
        for (let j = 0; j < a.artifacts.length; j++) {
          const art = a.artifacts[j];
          const patch = art.changeSet?.gitPatch?.unidiffPatch;
          if (patch) {
            const parsedGroups = parseUnidiffPatch(art.changeSet?.gitPatch || patch);
            for (let k = 0; k < parsedGroups.length; k++) {
              const file = parsedGroups[k].file;
              if (file && file !== "/dev/null") actFiles.add(file);
            }
          }
        }
      }

      if (a.planGenerated?.plan?.steps && Array.isArray(a.planGenerated.plan.steps)) {
        const steps = a.planGenerated.plan.steps;
        for (let j = 0; j < steps.length; j++) {
          const st = steps[j];
          const text = st.title + " " + (st.description || "");
          let match;
          FILE_MENTION_RE.lastIndex = 0;
          while ((match = FILE_MENTION_RE.exec(text)) !== null) {
            const f = match[1];
            if (f.includes("/") || f.includes(".")) actFiles.add(f);
          }
        }
      }
      WORKING_SET_ACTIVITY_CACHE.set(a, actFiles);
    }

    for (const f of actFiles) {
      files.add(f);
    }
  }

  // 3. Fallback: Scan prompt for file mentions if it's a new session
  if (files.size === 0 && s.prompt) {
    let match;
    FILE_MENTION_RE.lastIndex = 0;
    while ((match = FILE_MENTION_RE.exec(s.prompt)) !== null) {
      const f = match[1];
      if (f.includes("/") || f.includes(".")) files.add(f);
    }
  }

  const result = Array.from(files);
  if (WORKING_SET_CACHE.size > 500) WORKING_SET_CACHE.clear();
  WORKING_SET_CACHE.set(cacheKey, result);
  return result;
};

export { parseUnidiffPatch, getWorkingSet };
