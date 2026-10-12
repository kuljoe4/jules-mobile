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
  const handleBulkDelete = useCallback(async (rawIds) => {
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

    await Promise.all(
      ids.map(id =>
        apiCall(apiKey, `/sessions/${id}`, { method: "DELETE" }).catch(err =>
          console.error(sanitizeErrorMessage(err ? String(err) : ""))
        )
      )
    );
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

  const handleBulkResume = useCallback(async (rawIds) => {
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

    const results = await Promise.all(
      ids.map(id =>
        apiCall(apiKey, `/sessions/${id}:resume`, { method: "POST" }).catch(err => {
          console.error(sanitizeErrorMessage(err ? String(err) : ""));
          return null;
        })
      )
    );

    const updatedMap = new Map();
    for (let i = 0; i < results.length; i++) {
      const updated = results[i];
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        updatedMap.set(updated.id, updated);
      }
    }

    if (updatedMap.size > 0) {
      setSessions(prev => prev.map(s => updatedMap.get(s.id) || s));
    }
  }, [apiKey, setSessions, lastStates]);

  const handleBulkPause = useCallback(async (rawIds) => {
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

    const results = await Promise.all(
      ids.map(id =>
        apiCall(apiKey, `/sessions/${id}:pause`, { method: "POST" }).catch(err => {
          console.error(sanitizeErrorMessage(err ? String(err) : ""));
          return null;
        })
      )
    );

    const updatedMap = new Map();
    for (let i = 0; i < results.length; i++) {
      const updated = results[i];
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        updatedMap.set(updated.id, updated);
      }
    }

    if (updatedMap.size > 0) {
      setSessions(prev => prev.map(s => updatedMap.get(s.id) || s));
    }
  }, [apiKey, setSessions, lastStates]);

  const handleBulkIgnore = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to ignore ${ids.length} session(s)? This will remove them from your active list.`)) return;
    setIgnoredIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
    if (selected && ids.includes(selected.id)) {
      setSelected(null);
      setDesktop("empty");
      setMobile("detail");
    }
  }, [selected, setIgnoredIds, setSelected, setDesktop, setMobile]);

  const handlePause = useCallback(id => {
    if (!isValidSessionId(id)) return;
    if (!confirm("Are you sure you want to pause this session?")) return;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, state: "PAUSED" } : s));
    lastStates.current.set(id, "PAUSED");
    apiCall(apiKey, `/sessions/${id}:pause`, { method:"POST" }).then(updated => {
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      }
    }).catch(err => console.error(sanitizeErrorMessage(err ? String(err) : "")));
  }, [apiKey, setSessions, lastStates]);

  const handleResume = useCallback(id => {
    if (!isValidSessionId(id)) return;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, state: "QUEUED" } : s));
    lastStates.current.set(id, "QUEUED");
    apiCall(apiKey, `/sessions/${id}:resume`, { method:"POST" }).then(updated => {
      if (updated && updated.id) {
        lastStates.current.set(updated.id, updated.state);
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
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
  }, [lastStates, setSessions, setDraftsMap, setSelected, setDesktop, setMobile]);

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
