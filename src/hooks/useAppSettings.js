const useAppSettings = ({ onSessionLimitChange } = {}) => {
  const [pollInterval, setPollIntervalRaw] = useState(loadPollMs);
  const [actPollInterval, setActPollIntervalRaw] = useState(loadActPollMs);
  const [activePollInterval, setActivePollIntervalRaw] = useState(loadActivePollMs);
  const [sessionLimit, setSessionLimitRaw] = useState(loadLimit);
  const [activityLimit, setActivityLimitRaw] = useState(loadActivityLimit);
  const [cacheLimit, setCacheLimitRaw] = useState(loadCacheLimit);
  const [notifications, setNotificationsRaw] = useState(loadNotify);
  const [planId, setPlanIdRaw] = useState(loadPlan);
  const [customDaily, setCustomDailyRaw] = useState(loadCustomDaily);
  const [apiTimeout, setApiTimeoutRaw] = useState(loadApiTimeout);
  const [leanDirective, setLeanDirectiveRaw] = useState(loadLeanDirective);

  const setPollInterval = useCallback(ms => {
    savePollMs(ms);
    setPollIntervalRaw(ms);
  }, []);

  const setActPollInterval = useCallback(ms => {
    saveActPollMs(ms);
    setActPollIntervalRaw(ms);
  }, []);

  const setActivePollInterval = useCallback(ms => {
    saveActivePollMs(ms);
    setActivePollIntervalRaw(ms);
  }, []);

  const setSessionLimit = useCallback(v => {
    saveLimit(v);
    setSessionLimitRaw(v);
    if (onSessionLimitChange) onSessionLimitChange(v);
  }, [onSessionLimitChange]);

  const setActivityLimit = useCallback(v => {
    saveActivityLimit(v);
    setActivityLimitRaw(v);
  }, []);

  const setCacheLimit = useCallback(v => {
    saveCacheLimit(v);
    setCacheLimitRaw(v);
  }, []);

  const setNotifications = useCallback(async v => {
    if (v) {
      const ok = await requestNotificationPermission();
      if (!ok) { alert("Please enable notifications in your browser settings."); return; }
    }
    saveNotify(v);
    setNotificationsRaw(v);
  }, []);

  const setPlanId = useCallback(id => {
    savePlan(id);
    setPlanIdRaw(id);
  }, []);

  const setCustomDaily = useCallback(v => {
    saveCustomDaily(v);
    setCustomDailyRaw(v);
  }, []);

  const setApiTimeout = useCallback(ms => {
    saveApiTimeout(ms);
    setApiTimeoutRaw(ms);
  }, []);

  const setLeanDirective = useCallback(val => {
    saveLeanDirective(val);
    setLeanDirectiveRaw(val);
  }, []);

  const plan = useMemo(() => {
    const p = PLANS.find(p => p.id === planId) || PLANS[0];
    if (p.id === "custom") return { ...p, daily: customDaily };
    return p;
  }, [planId, customDaily]);

  return {
    pollInterval, setPollInterval,
    actPollInterval, setActPollInterval,
    activePollInterval, setActivePollInterval,
    sessionLimit, setSessionLimit,
    activityLimit, setActivityLimit,
    cacheLimit, setCacheLimit,
    notifications, setNotifications,
    planId, setPlanId,
    customDaily, setCustomDaily,
    apiTimeout, setApiTimeout,
    leanDirective, setLeanDirective,
    plan
  };
};

// ─── Main App ─────────────────────────────────────────────────────────────────
