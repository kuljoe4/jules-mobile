import { SafeStorage } from "../services/storage.js";

/**
 * useGlobalEventListeners
 *
 * Extracted custom hook that encapsulates the global window event listeners (`storage`,
 * `jac_stats_updated`, and `gh-rate-limited`) to reduce `JulesClient`'s responsibility.
 * It manages cross-tab event wiring and synchronizes state correctly.
 */
export const useGlobalEventListeners = ({
  setApiKey,
  setArchivedIds,
  setActivityStatsMap,
  setSessions,
  setGhRateLimitedReset
}) => {
  useEffect(() => {
    const handleGhRateLimit = (e) => {
      setGhRateLimitedReset(e.detail?.resetAt || "soon");
    };
    window.addEventListener("gh-rate-limited", handleGhRateLimit);
    return () => window.removeEventListener("gh-rate-limited", handleGhRateLimit);
  }, [setGhRateLimitedReset]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "jac_key") setApiKey(e.newValue || "");
      if (e.key === SafeStorage.KEYS.ARCHIVED) {
        setArchivedIds(new Set(SafeStorage.loadArchived()));
      }
      if (e.key === SafeStorage.KEYS.ACT_STATS) {
        setActivityStatsMap(SafeStorage.loadActStats());
      }
      if (e.key === SafeStorage.KEYS.SESSIONS_LIST) {
        setSessions(SafeStorage.loadSessionsList());
      }
    };
    const handleCustomStats = (e) => {
      if (e.detail) setActivityStatsMap(e.detail);
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("jac_stats_updated", handleCustomStats);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("jac_stats_updated", handleCustomStats);
    };
  }, [setApiKey, setArchivedIds, setActivityStatsMap, setSessions]);
};
