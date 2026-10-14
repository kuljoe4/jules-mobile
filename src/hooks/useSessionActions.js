import { useCallback } from 'react';
import { apiCall, sanitizeErrorMessage } from '../services/api.js';
import { isValidSessionId } from '../utils/validation.js';
import { SafeStorage } from '../services/storage.js';

const useSessionActions = ({
  apiKey,
  setSessions,
  setArchivedIds,
  setIgnoredIds,
  setDraftsMap,
  selected,
  setSelected,
  setDesktop,
  setMobile,
  lastStates
}) => {
  const handleBulkDelete = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${ids.length} session(s)?`)) return;
    const idSet = new Set(ids);
    setSessions(prev => prev.filter(s => !idSet.has(s.id)));
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      lastStates.current.delete(id);
      try { SafeStorage.clearFollowupDraft(id); } catch {}
    }
    setDraftsMap(prev => {
      let changed = false;
      const next = { ...prev };
      for (let i = 0; i < ids.length; i++) {
        delete next[ids[i]];
      }
      return next;
    });
    if (selected && idSet.has(selected.id)) {
      setSelected(null);
      setDesktop("empty");
      setMobile("detail");
    }

    Promise.allSettled(
      ids.map(id =>
        apiCall(apiKey, `/sessions/${id}`, { method: "DELETE" })
      )
    ).then(results => {
      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'rejected') {
          console.error(sanitizeErrorMessage(results[i].reason ? String(results[i].reason) : ""));
        }
      }
    });
  }, [apiKey, selected, setSessions, setDraftsMap, setSelected, setDesktop, setMobile, lastStates]);

  const handleBulkArchive = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      for (let i = 0; i < ids.length; i++) {
        next.add(ids[i]);
      }
      return next;
    });
  }, [setArchivedIds]);

  const handleBulkUnarchive = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      for (let i = 0; i < ids.length; i++) {
        next.delete(ids[i]);
      }
      return next;
    });
  }, [setArchivedIds]);

  const handleBulkResume = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;

    const idSet = new Set(ids);
    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (idSet.has(s.id)) return { ...s, state: "QUEUED" };
      return s;
    }));

    for (let i = 0; i < ids.length; i++) {
      lastStates.current.set(ids[i], "QUEUED");
    }

    Promise.allSettled(
      ids.map(id => apiCall(apiKey, `/sessions/${id}:resume`, { method:"POST" }))
    ).then(results => {
      const updatedMap = new Map();
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.status === 'fulfilled' && res.value && res.value.id) {
          const updated = res.value;
          lastStates.current.set(updated.id, updated.state);
          updatedMap.set(updated.id, updated);
        } else if (res.status === 'rejected') {
          console.error(sanitizeErrorMessage(res.reason ? String(res.reason) : ""));
        }
      }

      if (updatedMap.size > 0) {
        setSessions(prev => {
          let changed = false;
          const len = prev.length;
          const next = new Array(len);
          for (let i = 0; i < len; i++) {
            const s = prev[i];
            const updated = updatedMap.get(s.id);
            if (updated) {
              next[i] = updated;
              changed = true;
            } else {
              next[i] = s;
            }
          }
          return changed ? next : prev;
        });
      }
    });
  }, [apiKey, setSessions, lastStates]);

  const handleBulkPause = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to pause ${ids.length} session(s)?`)) return;

    const idSet = new Set(ids);
    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (idSet.has(s.id)) return { ...s, state: "PAUSED" };
      return s;
    }));

    for (let i = 0; i < ids.length; i++) {
      lastStates.current.set(ids[i], "PAUSED");
    }

    Promise.allSettled(
      ids.map(id => apiCall(apiKey, `/sessions/${id}:pause`, { method:"POST" }))
    ).then(results => {
      const updatedMap = new Map();
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.status === 'fulfilled' && res.value && res.value.id) {
          const updated = res.value;
          lastStates.current.set(updated.id, updated.state);
          updatedMap.set(updated.id, updated);
        } else if (res.status === 'rejected') {
          console.error(sanitizeErrorMessage(res.reason ? String(res.reason) : ""));
        }
      }

      if (updatedMap.size > 0) {
        setSessions(prev => {
          let changed = false;
          const len = prev.length;
          const next = new Array(len);
          for (let i = 0; i < len; i++) {
            const s = prev[i];
            const updated = updatedMap.get(s.id);
            if (updated) {
              next[i] = updated;
              changed = true;
            } else {
              next[i] = s;
            }
          }
          return changed ? next : prev;
        });
      }
    });
  }, [apiKey, setSessions, lastStates]);

  const handleBulkIgnore = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to ignore ${ids.length} session(s)? This will remove them from your active list.`)) return;
    const idSet = new Set(ids);
    setIgnoredIds(prev => {
      const next = new Set(prev);
      for (let i = 0; i < ids.length; i++) {
        next.add(ids[i]);
      }
      return next;
    });
    if (selected && idSet.has(selected.id)) {
      setSelected(null);
      setDesktop("empty");
      setMobile("detail");
    }
  }, [selected, setIgnoredIds, setSelected, setDesktop, setMobile]);

  const handlePause = useCallback(id => {
    if (!isValidSessionId(id)) return;
    if (!confirm("Are you sure you want to pause this session?")) return;

    // Optimistic update
    setSessions(prev => {
      let changed = false;
      const len = prev.length;
      const next = new Array(len);
      for (let i = 0; i < len; i++) {
        const s = prev[i];
        if (s.id === id) {
          next[i] = { ...s, state: "PAUSED" };
          changed = true;
        } else {
          next[i] = s;
        }
      }
      return changed ? next : prev;
    });
    lastStates.current.set(id, "PAUSED");
    apiCall(apiKey, `/sessions/${id}:pause`, { method:"POST" }).then(updated => {
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        setSessions(prev => {
          let changed = false;
          const len = prev.length;
          const next = new Array(len);
          for (let i = 0; i < len; i++) {
            const s = prev[i];
            if (s.id === updated.id) {
              next[i] = updated;
              changed = true;
            } else {
              next[i] = s;
            }
          }
          return changed ? next : prev;
        });
      }
    }).catch(err => console.error(sanitizeErrorMessage(err ? String(err) : "")));
  }, [apiKey, setSessions, lastStates]);

  const handleResume = useCallback(id => {
    if (!isValidSessionId(id)) return;

    // Optimistic update
    setSessions(prev => {
      let changed = false;
      const len = prev.length;
      const next = new Array(len);
      for (let i = 0; i < len; i++) {
        const s = prev[i];
        if (s.id === id) {
          next[i] = { ...s, state: "QUEUED" };
          changed = true;
        } else {
          next[i] = s;
        }
      }
      return changed ? next : prev;
    });
    lastStates.current.set(id, "QUEUED");
    apiCall(apiKey, `/sessions/${id}:resume`, { method:"POST" }).then(updated => {
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        setSessions(prev => {
          let changed = false;
          const len = prev.length;
          const next = new Array(len);
          for (let i = 0; i < len; i++) {
            const s = prev[i];
            if (s.id === updated.id) {
              next[i] = updated;
              changed = true;
            } else {
              next[i] = s;
            }
          }
          return changed ? next : prev;
        });
      }
    }).catch(err => console.error(sanitizeErrorMessage(err ? String(err) : "")));
  }, [apiKey, setSessions, lastStates]);

  const handleArchive = useCallback(id => {
    if (!isValidSessionId(id)) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [setArchivedIds]);

  const handleUnarchive = useCallback(id => {
    if (!isValidSessionId(id)) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, [setArchivedIds]);

  const handleIgnore = useCallback(id => {
    if (!isValidSessionId(id)) return;
    if (!confirm("Are you sure you want to ignore this session? This will remove it from your active list and stop updates.")) return;
    setIgnoredIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setSelected(null);
    setDesktop("empty");
    setMobile("detail");
  }, [setIgnoredIds, setSelected, setDesktop, setMobile]);

  const handleDelete = useCallback(id => {
    if (!isValidSessionId(id)) return;
    lastStates.current.delete(id);
    setSessions(prev => prev.filter(s=>s.id!==id));
    try { SafeStorage.clearFollowupDraft(id); } catch {}
    setDraftsMap(prev => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSelected(null);
    setDesktop("empty");
    setMobile("detail");
    apiCall(apiKey, `/sessions/${id}`, { method:"DELETE" }).catch(err => console.error(sanitizeErrorMessage(err ? String(err) : "")));
  }, [apiKey, lastStates, setSessions, setDraftsMap, setSelected, setDesktop, setMobile]);

  return {
    handleBulkDelete,
    handleBulkArchive,
    handleBulkUnarchive,
    handleBulkResume,
    handleBulkPause,
    handleBulkIgnore,
    handlePause,
    handleResume,
    handleArchive,
    handleUnarchive,
    handleIgnore,
    handleDelete
  };
};

export default useSessionActions;
