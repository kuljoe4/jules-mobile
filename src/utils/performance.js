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
