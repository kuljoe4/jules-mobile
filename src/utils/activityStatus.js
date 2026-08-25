const HASH_RE = /\b[a-f0-9]{7,40}\b/g;
const COMMIT_COUNT_RE = /(?:pushed|committed|applied)\s+(\d+)\s+(?:commit|change|fix|update)/i;
// Cache computed ahead/commit stats per reference-stable activity object to avoid redundant string/regex matching on re-renders
const AHEAD_ACTIVITY_CACHE = new WeakMap();

// Bounded WeakMap cache for computing aggregate ahead counts of reference-stable immutable activities arrays.
// Caching at the array reference level avoids O(N) array traversals across render loops.
const AHEAD_COUNT_ARRAY_CACHE = new WeakMap();

const getAheadCount = (activities = []) => {
  if (!activities || !Array.isArray(activities)) return 0;
  const cached = AHEAD_COUNT_ARRAY_CACHE.get(activities);
  if (cached !== undefined) return cached;

  let totalCommits = 0;
  const seenHashes = new Set();

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    if (!a) continue;

    if (!AHEAD_ACTIVITY_CACHE.has(a)) {
      let textCount = 0;
      const actHashes = [];
      const pu = a.progressUpdated;
      if (pu) {
        const rawDesc = pu.description || "";
        const desc = rawDesc.toLowerCase();
        const hashes = rawDesc.match(HASH_RE);
        if (hashes) {
          for (let j = 0; j < hashes.length; j++) {
            const h = hashes[j];
            if (h.length >= 7 && !h.includes("-")) {
              actHashes.push(h);
            }
          }
        }

        const m = desc.match(COMMIT_COUNT_RE);
        if (m) {
          textCount = parseInt(m[1], 10);
        } else if (desc.includes("pushed a commit") || desc.includes("pushed 1 commit") || desc.includes("pushed the changes") || desc.includes("committed changes")) {
          textCount = 1;
        } else if (desc.includes("pushed") && (desc.includes("change") || desc.includes("fix") || desc.includes("update"))) {
          textCount = 1;
        }
      }
      AHEAD_ACTIVITY_CACHE.set(a, { textCount, hashes: actHashes });
    }

    const cached = AHEAD_ACTIVITY_CACHE.get(a);
    if (cached) {
      if (cached.hashes.length > 0) {
        let newHashesCount = 0;
        for (let j = 0; j < cached.hashes.length; j++) {
          const h = cached.hashes[j];
          if (!seenHashes.has(h)) {
            seenHashes.add(h);
            newHashesCount++;
          }
        }
        const unhashedContribution = Math.max(0, cached.textCount - cached.hashes.length);
        totalCommits += newHashesCount + unhashedContribution;
      } else {
        totalCommits += cached.textCount;
      }
    }
  }

  AHEAD_COUNT_ARRAY_CACHE.set(activities, totalCommits);
  return totalCommits;
};

// Bounded WeakMap cache for computing whether a session is actually completed based on reference-stable immutable activities arrays.
const IS_ACTUALLY_DONE_CACHE = new WeakMap();

const getIsActuallyDone = (sState, activities = []) => {
  if (ACTIVE_STATES.has(sState)) return false;
  if (sState === "COMPLETED") return true;
  if (sState === "FAILED" || sState === "CANCELLED") return false;
  if (!activities || !Array.isArray(activities)) return false;

  const cached = IS_ACTUALLY_DONE_CACHE.get(activities);
  if (cached !== undefined) return cached;

  let lastComp = -1, lastUser = -1;
  for (let i = activities.length - 1; i >= 0; i--) {
    const type = getActType(activities[i]);
    if (lastComp === -1 && type === "sessionCompleted") lastComp = i;
    if (lastUser === -1 && type === "userMessaged") lastUser = i;
    if (lastComp !== -1 && lastUser !== -1) break;
  }
  const result = lastComp !== -1 && lastComp > lastUser;
  IS_ACTUALLY_DONE_CACHE.set(activities, result);
  return result;
};

// Bounded cache to avoid memory leaks. Caches parsed string date values to their epoch milliseconds.
