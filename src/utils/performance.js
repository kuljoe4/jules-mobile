// ─── Performance Helpers ─────────────────────────────────────────────────────
// Global WeakMap to cache byte size calculations for reference-stable, non-array objects.
// This prevents redundant recursive traversal overhead, making repeat size checks O(1).
// We do not cache arrays to avoid potential stale values if an array reference is mutated.
const approxBytesCache = new WeakMap();

// Bounded WeakMap cache for computing aggregate byte sizes of reference-stable immutable activities arrays.
// Caching at the array reference level avoids O(N) array traversals across render loops and cache-key generations.
const ACTIVITIES_SIZE_CACHE = new WeakMap();

const getActivitiesSize = (activities) => {
  if (!activities || !Array.isArray(activities)) return 0;
  const cached = ACTIVITIES_SIZE_CACHE.get(activities);
  if (cached !== undefined) return cached;
  const size = getApproxBytes(activities);
  ACTIVITIES_SIZE_CACHE.set(activities, size);
  return size;
};

// Calculates the approximate byte size of any object recursively/iteratively
// without slow serialization (JSON.stringify) or heavy binary array conversions.
const getApproxBytes = (val) => {
  if (val === null || val === undefined) return 0;
  const type = typeof val;
  if (type === "string") return val.length;
  if (type === "number") return 8;
  if (type === "boolean") return 4;
  if (type === "object") {
    const isArr = Array.isArray(val);
    if (!isArr && val !== null && approxBytesCache.has(val)) {
      return approxBytesCache.get(val);
    }
    let size = 0;
    if (isArr) {
      for (let i = 0; i < val.length; i++) {
        size += getApproxBytes(val[i]);
      }
    } else {
      const keys = Object.keys(val);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        size += k.length + getApproxBytes(val[k]);
      }
      if (val !== null) {
        approxBytesCache.set(val, size);
      }
    }
    return size;
  }
  return 0;
};

const PAYLOAD_BREAKDOWN_CACHE = new WeakMap();
const PATCH_FILE_COUNT_CACHE = new WeakMap();

const getPatchFileCount = (changeSet) => {
  if (!changeSet) return 0;
  if (PATCH_FILE_COUNT_CACHE.has(changeSet)) return PATCH_FILE_COUNT_CACHE.get(changeSet);

  let count = 0;
  const unidiff = changeSet.gitPatch?.unidiffPatch;
  if (unidiff) {
    const matches = unidiff.match(/\+\+\+\s+b\//g);
    count = matches ? matches.length : 0;
  }
  PATCH_FILE_COUNT_CACHE.set(changeSet, count);
  return count;
};

const getPayloadBreakdown = (activities = []) => {
  if (!activities || !Array.isArray(activities)) {
    return { mediaBytes: 0, patchBytes: 0, messageBytes: 0, planBytes: 0, otherBytes: 0, totalBytes: 0, mediaCount: 0, patchCount: 0, topPatches: [], topMedia: [] };
  }
  const cached = PAYLOAD_BREAKDOWN_CACHE.get(activities);
  if (cached !== undefined) return cached;

  let mediaBytes = 0;
  let patchBytes = 0;
  let messageBytes = 0;
  let planBytes = 0;
  let mediaCount = 0;
  let patchCount = 0;
  const topPatches = [];
  const topMedia = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    if (!act) continue;

    // Artifacts / Media
    if (act.artifacts && Array.isArray(act.artifacts)) {
      for (let j = 0; j < act.artifacts.length; j++) {
        const art = act.artifacts[j];
        if (art.media) {
          const mSize = getApproxBytes(art.media);
          mediaBytes += mSize;
          if (art.media.data) {
            mediaCount++;
            topMedia.push({
              mimeType: art.media.mimeType || "image/png",
              bytes: mSize,
              ts: act.createTime
            });
          }
        }
        if (art.changeSet) {
          const pSize = getApproxBytes(art.changeSet);
          patchBytes += pSize;
          patchCount++;

          const fileCount = getPatchFileCount(art.changeSet);

          topPatches.push({
            id: act.id || `act-${i}`,
            bytes: pSize,
            ts: act.createTime,
            fileCount,
            unidiff: art.changeSet.gitPatch?.unidiffPatch
          });
        }
      }
    }

    // Messages
    if (act.userMessaged) messageBytes += getApproxBytes(act.userMessaged);
    if (act.agentMessaged) messageBytes += getApproxBytes(act.agentMessaged);

    // Plans & Progress
    if (act.planGenerated) planBytes += getApproxBytes(act.planGenerated);
    if (act.progressUpdated) planBytes += getApproxBytes(act.progressUpdated);
  }

  topPatches.sort((a, b) => b.bytes - a.bytes);
  topMedia.sort((a, b) => b.bytes - a.bytes);

  const totalBytes = getActivitiesSize(activities);
  const accounted = mediaBytes + patchBytes + messageBytes + planBytes;
  const otherBytes = Math.max(0, totalBytes - accounted);

  const res = { mediaBytes, patchBytes, messageBytes, planBytes, otherBytes, totalBytes, mediaCount, patchCount, topPatches, topMedia };
  PAYLOAD_BREAKDOWN_CACHE.set(activities, res);
  return res;
};

// Fast deep equality check that avoids costly stringification (JSON.stringify)
// and handles early exit on primitive or property mismatch.
const fastDeepEqual = (a, b) => {
  if (a === b) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) {
    return false;
  }
  const isArrA = Array.isArray(a);
  const isArrB = Array.isArray(b);
  if (isArrA !== isArrB) return false;
  if (isArrA) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!fastDeepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !fastDeepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
};

export { getActivitiesSize, getApproxBytes, getPatchFileCount, getPayloadBreakdown, fastDeepEqual };
