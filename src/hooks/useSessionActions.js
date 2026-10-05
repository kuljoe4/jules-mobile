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
    setSessions(prev => prev.filter(s => !ids.includes(s.id)));
    ids.forEach(id => {
      lastStates.current.delete(id);
      try { SafeStorage.clearFollowupDraft(id); } catch {}
    });
    setDraftsMap(prev => {
      const next = { ...prev };
      ids.forEach(id => delete next[id]);
      return next;
    });
    if (selected && ids.includes(selected.id)) {
      setSelected(null);
      setDesktop("empty");
      setMobile("detail");
    }

    for (const id of ids) {
      apiCall(apiKey, `/sessions/${id}`, { method:"DELETE" }).catch(err => console.error(sanitizeErrorMessage(err.toString())));
    }
  }, [apiKey, selected, setSessions, setDraftsMap, setSelected, setDesktop, setMobile, lastStates]);

  const handleBulkArchive = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, [setArchivedIds]);

  const handleBulkUnarchive = useCallback((rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    setArchivedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, [setArchivedIds]);

  const handleBulkResume = useCallback(async (rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (ids.includes(s.id)) return { ...s, state: "QUEUED" };
      return s;
    }));

    for (const id of ids) {
      lastStates.current.set(id, "QUEUED");
      apiCall(apiKey, `/sessions/${id}:resume`, { method:"POST" }).catch(err => console.error(sanitizeErrorMessage(err.toString())));
    }
  }, [apiKey, setSessions, lastStates]);

  const handleBulkPause = useCallback(async (rawIds) => {
    if (!Array.isArray(rawIds)) return;
    const ids = rawIds.filter(isValidSessionId);
    if (ids.length === 0) return;
    if (!confirm(`Are you sure you want to pause ${ids.length} session(s)?`)) return;

    // Optimistic update
    setSessions(prev => prev.map(s => {
      if (ids.includes(s.id)) return { ...s, state: "PAUSED" };
      return s;
    }));

    for (const id of ids) {
      lastStates.current.set(id, "PAUSED");
      apiCall(apiKey, `/sessions/${id}:pause`, { method:"POST" }).catch(err => console.error(sanitizeErrorMessage(err.toString())));
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
    apiCall(apiKey, `/sessions/${id}:pause`, { method:"POST" }).catch(err => console.error(sanitizeErrorMessage(err.toString())));
  }, [apiKey, setSessions, lastStates]);

  const handleResume = useCallback(id => {
    if (!isValidSessionId(id)) return;

    // Optimistic update
    setSessions(prev => prev.map(s => s.id === id ? { ...s, state: "QUEUED" } : s));
    lastStates.current.set(id, "QUEUED");
    apiCall(apiKey, `/sessions/${id}:resume`, { method:"POST" }).catch(err => console.error(sanitizeErrorMessage(err.toString())));
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