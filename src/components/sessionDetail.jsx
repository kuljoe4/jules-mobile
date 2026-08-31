// ─── Session Detail ───────────────────────────────────────────────────────────
const SessionDetail = ({ session:initSession, apiKey, personas, onBack, onDelete, onSessionUpdate, onStatsUpdate, isDesktop, pollInterval, setPollInterval, isArchived, onArchive, onUnarchive, onIgnore, cacheLimit, activityLimit, allSessions = [], activitiesMap = {}, onDraftChange, onToggleMobileDrawer }) => {
  const [session,setSession]     = useState(initSession);

  useEffect(() => {
    const sTs = parseDateMs(session.updateTime || session.createTime);
    const initTs = parseDateMs(initSession.updateTime || initSession.createTime);
    if (initTs > sTs || initSession.id !== session.id) {
      setSession(initSession);
    }
  }, [initSession, session.updateTime, session.createTime, session.id]);

  const [activities,setActivities] = useState(() => {
    try {
      const cache = SafeStorage.loadSessionCache();
      const entry = cache[initSession.id];
      if (entry) {
        entry.ts = Date.now();
        SafeStorage.saveSessionCache(cache);
        return entry.activities || [];
      }
    } catch {}
    return [];
  });
  const [isStale, setIsStale] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncProgress] = useState("IDLE"); // IDLE, CACHE, FETCH, SYNC, DONE
  const [syncStats, setSyncPhaseStats] = useState({ count: 0, pages: 0, bytes: 0, newItems: 0, newBytes: 0, loaded: 0, total: 0 });
  const [showAll,setShowAll]     = useState(false);
  const [tab,setTab]             = useState("activity");
  const [scrolledActivityId, setScrolledActivityId] = useState(null);

  const scrollToActivityInChat = (targetId, isOriginal) => {
    setTab("activity");
    setShowAll(true);
    if (isOriginal) {
      setHeaderPromptExpanded(true);
      setScrolledActivityId("original");
    } else {
      setScrolledActivityId(targetId);
    }

    setTimeout(() => {
      const element = document.getElementById(isOriginal ? "chat-original-prompt" : `chat-activity-${targetId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        element.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
        const originalBoxShadow = element.style.boxShadow || "none";
        const originalBorder = element.style.border || `1px solid ${T.border}`;

        element.style.boxShadow = `0 0 24px ${T.brand}cc, inset 0 0 12px ${T.brand}50`;
        element.style.border = `1px solid ${T.brand}`;

        setTimeout(() => {
          element.style.boxShadow = originalBoxShadow;
          element.style.border = originalBorder;
        }, 2500);
      }
    }, 150);
  };

  const [chatFilter, setChatFilter] = useState("ALL");
  const [msg,setMsg]             = useState(() => SafeStorage.loadFollowupDraft(initSession.id));
  const [selectedPersonas, setSelectedPersonas] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [busy,setBusy]           = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [err,setErr]             = useState(null);
  const [activeMedia,setActiveMedia] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { act, sender }
  const [headerPromptExpanded, setHeaderPromptExpanded] = useState(false);
  const headerPromptRef = useRef(null);
  const [showDriftWarning, setShowDriftWarning] = useState(false);
  const [driftExpanded, setDriftExpanded] = useState(false);
  const [ghPrNonce, setGhPrNonce] = useState(0);
  useEffect(() => {
    const h = () => setGhPrNonce(n => n + 1);
    window.addEventListener("gh-pr-updated", h);
    return () => window.removeEventListener("gh-pr-updated", h);
  }, []);

  const [copiedReviews, setCopiedReviews] = useState({});
  const [copiedChat, setCopiedChat] = useState(false);
  const [showPayloadBreakdown, setShowPayloadBreakdown] = useState(false);

  const completedSessionsMap = useMemo(() => {
    const map = new Map();
    allSessions.forEach(s => {
      if (s.state === "COMPLETED") {
        const repo = s.sourceContext?.source;
        if (repo) {
          if (!map.has(repo)) map.set(repo, []);
          map.get(repo).push(s);
        }
      }
    });
    return map;
  }, [allSessions]);

  const driftSessions = useMemo(() => {
    if (!session) return [];
    const repo = session.sourceContext?.source;
    if (!repo) return [];
    const repoCompletions = completedSessionsMap.get(repo) || [];
    const currentStart = parseDateMs(session.createTime);
    return repoCompletions.filter(s => {
      if (s.id === session.id) return false;
      return parseDateMs(s.updateTime || s.createTime) > currentStart;
    });
  }, [session, completedSessionsMap]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (chatFilter === "MESSAGES") return a.userMessaged || a.agentMessaged;
      if (chatFilter === "REVIEWS") return a.progressUpdated && a.progressUpdated.title?.toLowerCase().includes("review");
      if (chatFilter === "SYSTEM") return !a.userMessaged && !a.agentMessaged && !(a.progressUpdated && a.progressUpdated.title?.toLowerCase().includes("review"));
      return true;
    });
  }, [activities, chatFilter]);

  const [scrolled, setScrolled] = useState(false);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [composerVisible, setComposerVisible] = useState(true);
  const [composerMinimized, setComposerMinimized] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [scrollDirMode, setScrollDirMode] = useState("bottom"); // "top" or "bottom"
  const lastScrollY = useRef(0);
  const scrollDir = useRef(0); // 1 = down, -1 = up

  const contentRef = useRef(null);
  const composerRef = useRef(null);

  const handleScroll = useCallback(e => {
    const y = e.target.scrollTop;
    const h = e.target.scrollHeight;
    const vh = e.target.offsetHeight;
    const diff = y - lastScrollY.current;

    if (Math.abs(diff) > 5) {
      scrollDir.current = diff > 0 ? 1 : -1;
    }

    const isNearBottom = h - y - vh < 100;
    const canHeaderShrink = h - vh > 250; // Only allow shrinking if there's significant content

    // Scrolled state for visual transitions
    if (y > 10 !== scrolled) setScrolled(y > 10);

    // Visibility logic:
    if (isNearBottom) {
      setComposerVisible(true);
      setHeaderExpanded(true);
    } else if (y > 150 && canHeaderShrink) {
      if (scrollDir.current === 1) {
        setComposerVisible(false);
        setHeaderExpanded(false);
      } else if (scrollDir.current === -1) {
        setComposerVisible(true);
        setHeaderExpanded(true);
      }
    } else if (y < 50) {
      setComposerVisible(true);
      setHeaderExpanded(true);
    }

    const isCloseToBottom = h - y - vh < 150;
    const isCloseToTop = y < 150;
    const canScroll = h - vh > 250;

    if (canScroll) {
      if (isCloseToBottom) {
        setShowScroll(true);
        setScrollDirMode("top");
      } else if (isCloseToTop) {
        setShowScroll(true);
        setScrollDirMode("bottom");
      } else {
        setShowScroll(true);
        setScrollDirMode(scrollDir.current === -1 ? "bottom" : "top");
      }
    } else {
      setShowScroll(false);
    }

    lastScrollY.current = y;
  }, [scrolled]);

  const driftDetected = useMemo(() => {
    if (!session) return false;
    const repo = session.sourceContext?.source;
    if (!repo) return false;
    const currentStart = parseDateMs(session.createTime);
    const repoCompletions = completedSessionsMap.get(repo) || [];

    return repoCompletions.some(s => {
      if (s.id === session.id) return false;
      const completionTime = parseDateMs(s.updateTime || s.createTime);
      return completionTime > currentStart;
    });
  }, [session, completedSessionsMap]);

  useEffect(() => {
    if (driftDetected && !isArchived) setShowDriftWarning(true);
  }, [driftDetected, isArchived]);

  const txtRef       = useRef(null);

  // Performance Optimization: Wrap callbacks in reference-stable useCallback
  // to avoid breaking React.memo for the ActivityFeed child component.
  const handleShowAll = useCallback(() => {
    setShowAll(true);
  }, []);

  const handleEditMessage = useCallback((text) => {
    setMsg(text);
    setComposerVisible(true);
    requestAnimationFrame(() => {
      if (txtRef.current) {
        txtRef.current.focus();
        txtRef.current.setSelectionRange(text.length, text.length);
        txtRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  const handleReply = useCallback((act, sender) => {
    setReplyingTo({ act, sender });
    setComposerMinimized(false);
    setComposerVisible(true);
    requestAnimationFrame(() => {
      if (txtRef.current) {
        txtRef.current.focus();
        txtRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, []);

  const feedEndRef   = useRef(null);
  const actMapRef    = useRef(new Map());      // id → activity (dedup)
  const prevLenRef   = useRef(0);
  const activitiesAbortRef = useRef(null);

  // ── Optimized activity loader: createTime cursor + Map dedup ──────────────
  // First load fetches all; subsequent loads fetch only new (createTime filter)
  const lastTsRef = useRef(null);
  const loadActivities = useCallback(async (sinceTs=null) => {
    if (activitiesAbortRef.current) {
      activitiesAbortRef.current.abort();
    }
    const controller = new AbortController();
    activitiesAbortRef.current = controller;

    setIsSyncing(true); setIsStale(true);
    setSyncProgress(sinceTs ? (busy ? "SYNC" : "FETCH") : "CACHE");
    setSyncPhaseStats({ count: 0, pages: 0, bytes: 0, newItems: 0, newBytes: 0, loaded: 0, total: 0 });
    let currentPages = 0;
    let currentCount = 0;
    let currentBytes = 0;
    let currentLoaded = 0;
    let currentTotal = 0;
    let newItems = 0;
    let newBytes = 0;

    try {
      let pageToken = null;
      let changed = false;
      let latestTs = lastTsRef.current;

      do {
        currentPages++;
        if (!sinceTs) setSyncProgress("FETCH");
        const pageSize = Math.min(activityLimit, 100);
        // The /activities API does not support createTime query parameter
        const qs = `pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ""}`;

        const d = await apiCall(apiKey, `/sessions/${session.id}/activities?${qs}`, {
          _label:`Acts ${sinceTs?"Δ":"full"} ${session.id?.slice(0,6)}`,
          signal: controller.signal,
          onProgress: ({ loaded, total }) => {
            currentLoaded = loaded;
            currentTotal = total;
            setSyncPhaseStats(prev => ({ ...prev, loaded: currentLoaded, total: currentTotal }));
          }
        });

        if (activitiesAbortRef.current !== controller) return;

        const incoming = d.activities || [];
        const batchBytes = getActivitiesSize(incoming);

        currentCount += incoming.length;
        currentBytes += batchBytes;

        for (const act of incoming) {
          const k = getActKey(act);
          const existing = actMapRef.current.get(k);
          // Upsert: update if content changed or is new
          if (!existing || !fastDeepEqual(existing, act)) {
            const actSize = getApproxBytes(act);
            newItems++;
            newBytes += actSize;
            actMapRef.current.set(k, act);
            changed = true;
            if (!latestTs || act.createTime > latestTs) latestTs = act.createTime;
          }
        }
        setSyncPhaseStats({ count: currentCount, pages: currentPages, bytes: currentBytes, newItems, newBytes, loaded: currentLoaded, total: currentTotal });

        pageToken = d.nextPageToken;

        // Respect activityLimit
        if (actMapRef.current.size >= activityLimit) {
          pageToken = null;
        }

        // On incremental loads (sinceTs), we don't need to follow tokens as new
        // activities are added to the end of the history.
        if (sinceTs) break;

      } while (pageToken);

      if (activitiesAbortRef.current !== controller) return;

      if (latestTs) lastTsRef.current = latestTs;
      if (changed) {
        setSyncProgress("SYNC");
        let sorted = Array.from(actMapRef.current.values())
          .filter(a => !a._temp)
          .sort((a,b) => parseDateMs(a.createTime) - parseDateMs(b.createTime));

        // Enforce limit if we exceeded it during this load
        if (sorted.length > activityLimit) {
          sorted = sorted.slice(-activityLimit);
          // Sync map back
          actMapRef.current = new Map();
          sorted.forEach(a => actMapRef.current.set(getActKey(a), a));
        }
        setActivities(sorted);
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 3000);
        setIsStale(false);

        // Persist stats
        try {
          const size = getActivitiesSize(sorted);
          const stats = { count: sorted.length, size };
          const allStats = SafeStorage.loadActStats();
          allStats[session.id] = stats;
          SafeStorage.saveActStats(allStats);
          onStatsUpdate?.(session.id, stats);
          window.dispatchEvent(new CustomEvent("jac_stats_updated", { detail: allStats }));
        } catch (e) { console.error("Failed to save stats", e); }
      }

      // Update Session Cache
      if (cacheLimit > 0) {
        try {
          const cache = SafeStorage.loadSessionCache();
          cache[session.id] = { activities: Array.from(actMapRef.current.values()).filter(a => !a._temp).sort((a,b) => parseDateMs(a.createTime) - parseDateMs(b.createTime)).slice(-activityLimit), ts: Date.now() };
          // Strict LRU Strategy
          let keys = Object.keys(cache);
          if (keys.length > cacheLimit) {
            keys.sort((a, b) => (cache[a].ts || 0) - (cache[b].ts || 0));
            while (keys.length > cacheLimit) {
              delete cache[keys.shift()];
            }
          }
          SafeStorage.saveSessionCache(cache);
        } catch {}
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error("[LoadActivities] Error:", err);
      throw err;
    } finally {
      if (activitiesAbortRef.current === controller) {
        setIsSyncing(false); setIsStale(false);
        setSyncProgress("DONE");
        setTimeout(() => setSyncProgress("IDLE"), 2000);
      }
    }
  }, [apiKey, session.id, activityLimit, cacheLimit]);

  const loadSession = useCallback(async () => {
    try {
      const d = await apiCall(apiKey, `/sessions/${session.id}`, { _label:`Session ${session.id?.slice(0,6)}` });
      setSession(d);
      onSessionUpdate?.(d);
    } catch (err) {
      console.error("[LoadSession] Error:", err);
      throw err;
    }
  }, [apiKey, session.id, onSessionUpdate]);

  // On mount (keyed by session.id, so fresh per-session)
  useEffect(() => {
    actMapRef.current = new Map();
    // Seed Map from initial activities (cached)
    activities.forEach(a => actMapRef.current.set(getActKey(a), a));
    lastTsRef.current = activities.length > 0 ? activities[activities.length-1].createTime : null;
    prevLenRef.current = 0;
    setShowAll(false);
    setErr(null);

    // If we have cached activities, report their stats immediately
    if (activities.length > 0) {
      try {
        const size = getActivitiesSize(activities);
        onStatsUpdate?.(session.id, { count: activities.length, size });
      } catch {}
    }

    // Set stale immediately if we have cache, to trigger syncing cue
    if (activities.length > 0) setIsStale(true);

    loadActivities(null); // full load on first open
    loadSession();

    return () => {
      if (activitiesAbortRef.current) activitiesAbortRef.current.abort();
    };
  }, []); // intentional: component is keyed by session.id

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const len = activities.length;
    if (len > prevLenRef.current && tab === "activity" && feedEndRef.current) {
      const el = contentRef.current;
      const isNearBottom = el ? (el.scrollHeight - el.scrollTop - el.offsetHeight < 150) : false;

      if (userSentRef.current || isNearBottom) {
        feedEndRef.current.scrollIntoView({ behavior: len - prevLenRef.current > 8 ? "instant" : "smooth" });
      }
    }
    userSentRef.current = false;
    prevLenRef.current = len;
  }, [activities, tab]);

  // Ensure non-activity tabs start at the top
  useEffect(() => {
    if (tab !== "activity" && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [tab]);

  const togglePersona = (id) => {
    const next = new Set(selectedPersonas);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedPersonas(next);
  };

  const handleExpandComposer = useCallback(() => {
    setComposerMinimized(false);
    setComposerVisible(true);
    setTimeout(() => { if (txtRef.current) txtRef.current.focus(); }, 50);
  }, []);

  // Persist draft follow-up message
  const draftRef = useRef(null);
  useEffect(() => {
    clearTimeout(draftRef.current);
    draftRef.current = setTimeout(() => {
      try {
        if (msg.trim()) {
          SafeStorage.saveFollowupDraft(session.id, msg);
          if (onDraftChange) onDraftChange(session.id, true);
        } else {
          SafeStorage.clearFollowupDraft(session.id);
          if (onDraftChange) onDraftChange(session.id, false);
        }
      } catch {}
    }, 400);
    return () => clearTimeout(draftRef.current);
  }, [msg, session.id, onDraftChange]);

  const userSentRef = useRef(false);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!msg.trim() || busy) return;
    userSentRef.current = true;
    let text = msg.trim();
    if (replyingTo) {
      let quoteText = "";
      const replyAct = replyingTo.act;
      if (replyAct.agentMessaged) {
        quoteText = replyAct.agentMessaged.agentMessage;
      } else if (replyAct.progressUpdated) {
        quoteText = replyAct.progressUpdated.description || replyAct.progressUpdated.title || "";
      } else if (replyAct.planGenerated) {
        quoteText = "Plan Generated";
      } else {
        quoteText = replyAct.description || "System Event";
      }

      // Limit quoteText length
      if (Array.from(quoteText).length > 200) {
        quoteText = safeSlice(quoteText, 197) + "...";
      }

      const headerLine = `> **Replying to ${replyingTo.sender || "JULES"}**: *"${quoteText.replace(/\n/g, " ")}"*`;
      text = `${headerLine}\n\n${text}`;
    }

    if (selectedPersonas.size > 0) {
      const personaPrompts = Array.from(selectedPersonas)
        .map(id => personas.find(p => p.id === id)?.prompt)
        .filter(Boolean);
      if (personaPrompts.length > 0) {
        const personaText = `(Persona: ${Array.from(selectedPersonas).map(id => personas.find(p => p.id === id)?.label).join(", ")})\n\n${personaPrompts.join("\n\n")}`;
        text = text ? `${text}\n\n${personaText}` : personaText;
      }
    }
    setMsg("");
    setComposerMinimized(true);
    setExpanded(false);
    setReplyingTo(null);
    setBusy(true); setErr(null);

    // Optimistic: add temp bubble immediately
    const tempKey = `_temp_${Date.now()}`;
    const tempAct = {
      id: tempKey,
      createTime: new Date().toISOString(),
      userMessaged: { userMessage: text },
      _temp: true
    };
    actMapRef.current.set(tempKey, tempAct);
    setActivities(prev => [...prev, tempAct]);

    try {
      await apiCall(apiKey, `/sessions/${session.id}:sendMessage`, {
        method: "POST",
        body: { prompt: text },
        _label: `Msg -> ${session.id?.slice(0,6)}`
      });
      // Success: clear local draft
      try {
        SafeStorage.clearFollowupDraft(session.id);
        if (onDraftChange) onDraftChange(session.id, false);
      } catch (e) {}
      // Switch back to chat to show Jules' response
      setTab("activity");
      // Remove temp, fetch real activities with smart polling
      actMapRef.current.delete(tempKey);
      setTimeout(() => {
        loadActivities(lastTsRef.current);
        loadSession();
      }, 1200);
    } catch (err) {
      setErr(err.message);
      setMsg(text); // restore draft on error
      if (onDraftChange) onDraftChange(session.id, true);
      actMapRef.current.delete(tempKey);
      setActivities(prev => prev.filter(a => a.id !== tempKey));
    } finally {
      setBusy(false);
    }
  };

  const handlePublishPR = async () => {
    if (busy) return;
    const promptText = "Please publish a Pull Request for the changes made in this session.";
    setBusy(true); setErr(null);

    const tempKey = `_temp_${Date.now()}`;
    const tempAct = {
      id: tempKey,
      createTime: new Date().toISOString(),
      userMessaged: { userMessage: promptText },
      _temp: true
    };
    actMapRef.current.set(tempKey, tempAct);
    setActivities(prev => [...prev, tempAct]);

    try {
      await apiCall(apiKey, `/sessions/${session.id}:sendMessage`, {
        method: "POST",
        body: { prompt: promptText },
        _label: `Publish PR -> ${session.id?.slice(0,6)}`
      });
      setTab("activity");
      actMapRef.current.delete(tempKey);
      setTimeout(() => {
        loadActivities(lastTsRef.current);
        loadSession();
      }, 1200);
    } catch (err) {
      setErr(err.message);
      actMapRef.current.delete(tempKey);
      setActivities(prev => prev.filter(a => a.id !== tempKey));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (busy) return;
    let planTs = null;
    for (let i = activities.length - 1; i >= 0; i--) {
      if (activities[i].planGenerated) { planTs = activities[i].createTime; break; }
    }
    const alreadyApproved = activities.some(a => a.planApproved && (!planTs || a.createTime >= planTs));
    if (alreadyApproved) {
      setTab("activity");
      return;
    }

    setBusy(true); setErr(null);
    try {
      await apiCall(apiKey, `/sessions/${session.id}:approvePlan`, {
        method: "POST",
        body: {},
        _label: `Approve ${session.id?.slice(0,6)}`
      });
      await loadSession();
      await loadActivities(lastTsRef.current);
      setTab("activity");
    } catch (err) {
      const isAlready = err.message?.includes("400") && err.message.toLowerCase().includes("already approved");
      if (isAlready) {
        await loadSession();
        await loadActivities(lastTsRef.current);
        setTab("activity");
      } else {
        setErr(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      const check = () => {
        const y = el.scrollTop;
        const h = el.scrollHeight;
        const vh = el.offsetHeight;
        const canScroll = h - vh > 200;
        setShowScroll(canScroll && (y > 100 || h - y - vh > 100));
        setScrollDirMode(y > (h - vh) / 2 ? "top" : "bottom");
      };
      const raf = requestAnimationFrame(check);
      window.addEventListener("resize", check);
      return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", check); };
    }
  }, [activities, tab]);

  // Used by PlanView to send revision requests
  const handleSendFeedback = useCallback(async (prompt, stayOnTab = false) => {
    let text = prompt;
    if (selectedPersonas.size > 0) {
      const personaPrompts = Array.from(selectedPersonas)
        .map(id => personas.find(p => p.id === id)?.prompt)
        .filter(Boolean);
      if (personaPrompts.length > 0) {
        const personaText = `(Persona: ${Array.from(selectedPersonas).map(id => personas.find(p => p.id === id)?.label).join(", ")})\n\n${personaPrompts.join("\n\n")}`;
        text = text ? `${text}\n\n${personaText}` : personaText;
      }
    }
    const tempKey = `_temp_${Date.now()}`;
    const tempAct = {
      id: tempKey,
      createTime: new Date().toISOString(),
      userMessaged: { userMessage: text },
      _temp: true
    };
    actMapRef.current.set(tempKey, tempAct);
    setActivities(prev => [...prev, tempAct]);
    try {
      await apiCall(apiKey, `/sessions/${session.id}:sendMessage`, {
        method: "POST",
        body: { prompt: text },
        _label: `Msg -> ${session.id?.slice(0,6)}`
      });
      actMapRef.current.delete(tempKey);
      setComposerMinimized(true);
      setExpanded(false);
      if (stayOnTab !== true) setTab("activity");
      setTimeout(() => {
        loadActivities(lastTsRef.current);
        loadSession();
      }, 1500);
    } catch (err) {
      setErr(err.message);
      actMapRef.current.delete(tempKey);
      setActivities(prev => prev.filter(a => a.id !== tempKey));
      throw err;
    }
  }, [apiKey, session.id, loadActivities, loadSession, selectedPersonas, personas, setTab]);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await apiCall(apiKey, `/sessions/${session.id}`, { method:"DELETE", _label:`Delete ${session.id?.slice(0,6)}` });
      onDelete(session.id);
    } catch (err) { setErr(err.message); setBusy(false); }
  };

  const mediaArtifacts = useMemo(() =>
    activities.flatMap(a => (a.artifacts||[]).filter(x=>x.media?.data).map(x=>({...x.media,ts:a.createTime})))
  , [activities]);

  const activityStats = useMemo(() => {
    return {
      count: activities.length,
      size: getActivitiesSize(activities)
    };
  }, [activities]);

  const payloadBreakdown = useMemo(() => {
    return getPayloadBreakdown(activities);
  }, [activities]);

  const b = useMemo(() => getBranchInfo(session, activities), [session, activities]);
  const ahead = useMemo(() => getAheadCount(activities), [activities]);

  const summary = session.outputs?.find(o=>o.sessionSummary)?.sessionSummary;
  const pri = useMemo(() => getPRInfo(session, activities), [session, activities, ghPrNonce]);
  const pr = pri;
  const isActuallyDone = useMemo(() => {
    return getIsActuallyDone(session.state, activities);
  }, [activities, session.state]);
  const currentState = isActuallyDone ? "COMPLETED" : session.state;
  const isFinished = currentState === "COMPLETED" || currentState === "FAILED";
  const m       = STATUS_META[currentState] || STATUS_META.QUEUED;
  const repo    = session.sourceContext?.source?.replace("sources/github/","");
  const pct     = pctFromState(currentState);
  const canSend = true; // Always allow follow-up messages

  const { countdown, handleRefresh } = useSessionPolling(
    session,
    pollInterval,
    loadSession,
    loadActivities,
    lastTsRef,
    isFinished,
    busy,
    setBusy,
    setErr,
    setJustUpdated
  );

  const latestPlan = useMemo(() => {
    for (let i = activities.length - 1; i >= 0; i--) {
      if (activities[i].planGenerated?.plan) return activities[i].planGenerated.plan;
    }
    return null;
  }, [activities]);

  const isApproved = useMemo(() => {
    let planTs = null;
    for (let i = activities.length - 1; i >= 0; i--) {
      if (activities[i].planGenerated) { planTs = activities[i].createTime; break; }
    }
    return activities.some(a => a.planApproved && (!planTs || a.createTime >= planTs));
  }, [activities]);

  // Auto-switch to PLAN tab when AWAITING_PLAN_APPROVAL
  useEffect(() => {
    if (currentState === "AWAITING_PLAN_APPROVAL" && latestPlan && !isApproved) setTab("plan");
  }, [currentState, latestPlan, isApproved]);

  const reviews = useMemo(() => {
    return activities.filter(a => a.progressUpdated && a.progressUpdated.title?.toLowerCase().includes("review"));
  }, [activities]);

  const TABS = [
    { id:"activity", label:"CHAT" },
    { id:"prompt",   label:"PROMPT" },
    ...(reviews.length > 0 ? [{ id: "reviews", label: "REVIEWS" }] : []),
    ...(latestPlan?[{ id:"plan", label:"PLAN" }]:[]),
    { id:"diff",     label:"DIFF" },
    ...(mediaArtifacts.length>0?[{ id:"media", label:"MEDIA" }]:[]),
  ];


  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",minHeight:0,position:"relative"}}>
      {/* ── Header ── */}
      <div style={{
        padding:scrolled?"8px 12px":"12px 16px 0",
        background:T.surface,
        flexShrink:0,
        transition:"padding .2s cubic-bezier(0.4, 0, 0.2, 1)",
        zIndex: 5,
        contain: "layout",
        position: "relative",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:scrolled?0:6, minHeight:scrolled?24:44}}>
          {!isDesktop&&(
            <div style={{display:"flex", alignItems:"center", gap:4}}>
              {onToggleMobileDrawer ? (
                <button onClick={onToggleMobileDrawer} title="Open Sessions Drawer" aria-label="Open Sessions Drawer" style={{background:"none",border:"none",cursor:"pointer",padding:3,display:"flex",flexShrink:0}}>
                  <Ic n="layout_toggle" s={18} c={T.brand}/>
                </button>
              ) : (
                <button onClick={onBack} aria-label="Go back" style={{background:"none",border:"none",cursor:"pointer",padding:3,display:"flex",flexShrink:0}}>
                  <Ic n="back" s={18} c={T.text}/>
                </button>
              )}
            </div>
          )}
          <div style={{flex:1,minWidth:0, position:"relative"}}>
            {/* Session Title and Metadata */}
            <>
              <div style={{
                fontFamily:"'IBM Plex Sans',sans-serif",
                fontSize:scrolled?13:15,
                fontWeight:700,
                color:T.textHi,
                lineHeight:1.3,
                overflow:"hidden",
                textOverflow:"ellipsis",
                whiteSpace: scrolled ? "nowrap" : "normal",
                display: "-webkit-box",
                WebkitLineClamp:scrolled?1:2,
                WebkitBoxOrient:"vertical",
                transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                minHeight: scrolled ? 18 : 38,
              }}>
                {session.title||session.prompt}
              </div>
              <div style={{display:"flex", alignItems:"center", gap:8, marginTop: 2, animation:"fadeIn .2s ease", height: (repo || (scrolled && !headerExpanded)) ? 14 : 0, overflow: "hidden", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"}}>
                 {repo && (
                   <div style={{display:"flex", alignItems:"center", gap:4, minWidth:0}}>
                     <Ic n="code" s={9} c={T.dim}/>
                     <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.dim, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{repo}</span>
                   </div>
                 )}
                 {scrolled && !headerExpanded && (
                   <>
                     {session.sourceContext?.source && (
                       <a href={safeUrl(b?.repoUrl ? `${b.repoUrl}/branches` : "#")} target="_blank" rel="noopener noreferrer" style={{display:"flex", alignItems:"center", gap:3, color:T.blue, textDecoration:"none", flexShrink:0, borderBottom:`1px solid ${T.blue}40`}}>
                         <Ic n="branch" s={9} c={T.blue}/>
                         <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:900}}>{b?.working || "main"}</span>
                       </a>
                     )}
                     {isStale && !isFinished && <div style={{width:5, height:5, borderRadius:"50%", background:T.brand, animation:"pulse 2s infinite"}}/>}
                     {pr && (
                        <a href={safeUrl(pr.url)} target="_blank" rel="noopener noreferrer" style={{
                          background:pr.state==="merged"?T.purpleDim:pr.state==="closed"?T.dim:T.brandDim,
                          border:`1px solid ${pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand}40`,
                          borderRadius:3, padding:"1px 4px", display:"flex", alignItems:"center", gap:3,
                          color:pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand,
                          textDecoration:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:8, fontWeight:900, flexShrink:0
                        }}>
                          <Ic n={pr.state==="merged"?"git_merge":"git_pull"} s={9} c={pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand}/>
                          #{pr.number}
                        </a>
                      )}
                    </>
                 )}
              </div>
            </>
          </div>

          <div style={{
            display:"flex",gap:6,alignItems:"center",flexShrink:0,
            opacity: 1,
            pointerEvents: "auto",
            transition: "all .2s ease"
          }}>
            {syncPhase !== "IDLE" && (
              <span title={
                syncPhase === "CACHE" ? "Recovering from cache..." :
                syncPhase === "FETCH" ? (syncStats.total > 0 ? `Downloading assets ${Math.min(100, Math.round((syncStats.loaded / syncStats.total) * 100))}% (${fmtBytes(syncStats.loaded / 1024)} / ${fmtBytes(syncStats.total / 1024)})` : `Fetching ${syncStats.count} items... (${fmtBytes(syncStats.loaded / 1024)})`) :
                syncPhase === "SYNC" ? "Synchronizing..." : "Session is up to date"
              } style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 6px", borderRadius: 4,
                background: syncPhase === "DONE" ? `${T.brand}15` : `${T.amber}15`,
                border: `1px solid ${syncPhase === "DONE" ? T.brand : T.amber}30`,
                color: syncPhase === "DONE" ? T.brandLight : T.amber,
                fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 800,
                letterSpacing: "0.05em", animation: "fadeIn 0.2s ease", flexShrink: 0
              }}>
                <div style={{ animation: syncPhase === "DONE" ? "none" : "spin 1.5s linear infinite", display: "flex" }}>
                  <Ic n={syncPhase === "DONE" ? "check" : "refresh"} s={10} c={syncPhase === "DONE" ? T.brandLight : T.amber} />
                </div>
                {syncPhase === "DONE" ? "SYNCED" : (syncPhase === "FETCH" && syncStats.loaded > 0 ? `FETCH (${fmtBytes(syncStats.loaded / 1024)})` : syncPhase)}
              </span>
            )}
            {driftDetected && (
              <span title="STALE BASE: Repository was updated since this session started" style={{
                display:"flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:4,
                background:`${T.amber}15`, border:`1px solid ${T.amber}40`, color:T.amber,
                fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, letterSpacing:"0.05em"
              }}>
                <Ic n="wifi" s={11} c={T.amber}/>
                {!scrolled && "STALE"}
              </span>
            )}
            <Pill status={currentState} small hideLabel={!headerExpanded && scrolled}/>

            <div style={{position:"relative"}}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                title="More actions"
                aria-label="More actions"
                onMouseEnter={e => { e.currentTarget.style.background = T.border; e.currentTarget.style.borderColor = T.brand; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.surfaceHi; e.currentTarget.style.borderColor = T.borderHi; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.92)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{
                  background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                  borderRadius:4, cursor:"pointer", display:"flex", padding:4,
                  transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <Ic n="more" s={14} c={showMenu ? T.brand : T.muted}/>
              </button>

              {showMenu && (
                <>
                  <Backdrop onClick={() => setShowMenu(false)}/>
                  <div style={{
                    position:"absolute", top:"100%", right:0, zIndex:101, marginTop:8,
                    background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                    borderRadius:8, width:180, boxShadow:"0 10px 32px rgba(0,0,0,0.6)",
                    overflow:"hidden", animation: "zoomIn 0.15s cubic-bezier(0.2, 0, 0.2, 1)"
                  }}>
                    <div style={{
                      padding:"10px 14px", borderBottom:`1px solid ${T.border}33`,
                      display:"flex", alignItems:"center", justifyContent:"space-between"
                    }}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:800, color:T.dim}}>ACTIONS</div>
                      {busy && <div style={{animation:"spin 1s linear infinite"}}><Ic n="refresh" s={10} c={T.brand}/></div>}
                    </div>
                    {session.sourceContext?.source && !pr && (
                      <button
                        onClick={() => { handlePublishPR(); setShowMenu(false); }}
                        disabled={busy}
                        onMouseEnter={e => e.currentTarget.style.background = T.border}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                        style={{
                          width:"100%", padding:"12px 14px", background:"none", border:"none",
                          color:T.brand, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                          fontSize:11, fontWeight:700, cursor: busy ? "not-allowed" : "pointer",
                          display:"flex", alignItems:"center", gap:10,
                          borderBottom:`1px solid ${T.border}33`, opacity: busy ? 0.5 : 1,
                          transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                        aria-label="Publish Pull Request for session"
                        title="Publish Pull Request for this session"
                      >
                        <Ic n="git_pull" s={14} c={T.brand}/> PUBLISH PR
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMsg("The repository has been updated. Please pull the latest changes from the base branch and rebase your current work to avoid conflicts.");
                        setComposerMinimized(false);
                        setComposerVisible(true);
                        setShowMenu(false);
                        setTimeout(() => txtRef.current?.focus(), 100);
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = T.border}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      style={{
                        width:"100%", padding:"12px 14px", background:"none", border:"none",
                        color:T.amber, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                        borderBottom:`1px solid ${T.border}33`,
                        transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <Ic n="wifi" s={14} c={T.amber}/> SYNC / REBASE
                    </button>
                    <button
                      onClick={() => { handleRefresh(); setShowMenu(false); }}
                      disabled={busy}
                      onMouseEnter={e => e.currentTarget.style.background = T.border}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      style={{
                        width:"100%", padding:"12px 14px", background:"none", border:"none",
                        color:T.text, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                        borderBottom:`1px solid ${T.border}33`, opacity: busy ? 0.5 : 1,
                        transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <Ic n="refresh" s={14} c={T.brand}/> REFRESH
                    </button>
                    <button
                      onClick={() => { isArchived ? onUnarchive(session.id) : onArchive(session.id); setShowMenu(false); }}
                      onMouseEnter={e => e.currentTarget.style.background = T.border}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      style={{
                        width:"100%", padding:"12px 14px", background:"none", border:"none",
                        color:T.text, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                        borderBottom:`1px solid ${T.border}33`,
                        transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <Ic n={isArchived ? "unarchive" : "archive"} s={14} c={T.purple}/> {isArchived ? "UNARCHIVE" : "ARCHIVE"}
                    </button>
                    {onIgnore && (
                      <button
                        onClick={() => { onIgnore(session.id); setShowMenu(false); }}
                        onMouseEnter={e => e.currentTarget.style.background = T.border}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                        onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                        style={{
                          width:"100%", padding:"12px 14px", background:"none", border:"none",
                          color:T.amber, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                          fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                          borderBottom:`1px solid ${T.border}33`,
                          transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                      >
                        <Ic n="pause" s={14} c={T.amber}/> IGNORE
                      </button>
                    )}
                    <button
                      onClick={() => { if(confirm("Delete session?")) { handleDelete(); setShowMenu(false); } }}
                      disabled={busy}
                      onMouseEnter={e => e.currentTarget.style.background = T.border}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                      onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                      onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                      style={{
                        width:"100%", padding:"12px 14px", background:"none", border:"none",
                        color:T.red, textAlign:"left", fontFamily:"'JetBrains Mono',monospace",
                        fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:10,
                        transition: "all .1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <Ic n="trash" s={14} c={T.red}/> DELETE
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Secondary Metadata & Actions (Hidden when scrolled on mobile, expanded on scroll up) */}
        <div style={{
          height: headerExpanded ? 22 : 0,
          maxHeight: headerExpanded ? 40 : 0,
          opacity: headerExpanded ? 1 : 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: headerExpanded ? 8 : 0,
          transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1), height .2s ease",
          pointerEvents: headerExpanded ? "auto" : "none",
          contain: "size layout",
        }}>
          <div style={{display:"flex", alignItems:"center", gap:8, overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch", width:"100%"}}>

            {pr && (
              <a href={safeUrl(pr.url)} target="_blank" rel="noopener noreferrer" aria-label={`Pull Request #${pr.number} is ${pr.state}. ${pr.ahead || 0} commits ahead, ${pr.behind || 0} commits behind.`} style={{
                background:pr.state==="merged"?T.purpleDim:pr.state==="closed"?T.dim:T.brandDim,
                border:`1px solid ${pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand}40`,
                borderRadius:4, padding:"3px 8px", display:"flex", alignItems:"center", gap:4,
                color:pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand,
                textDecoration:"none", fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:900, flexShrink:0,
                animation: isSyncing ? "shimmerPulse 1.5s infinite" : "none"
              }}>
                <Ic n={pr.state==="merged"?"git_merge":"git_pull"} s={11} c={pr.state==="merged"?T.purple:pr.state==="closed"?T.muted:T.brand}/>
                #{pr.number} <span style={{fontSize:8, opacity:0.8}}>{pr.state.toUpperCase()}</span>
                {pr.ahead > 0 && <span style={{fontSize:9, background:`${T.brand}22`, color:T.brandLight, borderRadius:3, padding:"0px 4px", marginLeft:2, border:`1px solid ${T.brand}40`}}>↑{pr.ahead}</span>}
                {pr.behind > 0 && <span style={{fontSize:9, background:`${T.amber}22`, color:T.amber, borderRadius:3, padding:"0px 4px", marginLeft:2, border:`1px solid ${T.amber}40`}}>↓{pr.behind}</span>}
                {pr.checks && (
                  <span title={`Checks: ${pr.checks.label || pr.checks.state}`} aria-label={`Checks: ${pr.checks.label || pr.checks.state}`} style={{
                    width:5, height:5, borderRadius:"50%", flexShrink:0, marginLeft:2,
                    background: pr.checks.state === "success" ? "#34d399" : pr.checks.state === "failure" ? T.red : T.amber,
                    boxShadow: pr.checks.state === "success" ? "0 0 6px #34d399" : pr.checks.state === "failure" ? `0 0 6px ${T.red}` : `0 0 6px ${T.amber}`,
                    animation: pr.checks.state === "pending" ? "dot 1s infinite" : "none"
                  }}/>
                )}
              </a>
            )}

            {session.sourceContext?.source && !pr && (
              <button
                onClick={handlePublishPR}
                disabled={busy}
                title="Publish Pull Request for this session"
                aria-label="Publish Pull Request for this session"
                style={{
                  background: T.brandDim,
                  border: `1px solid ${T.brand}40`,
                  borderRadius: 4,
                  padding: "3px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  color: T.brandLight,
                  cursor: busy ? "not-allowed" : "pointer",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  fontWeight: 900,
                  flexShrink: 0,
                  opacity: busy ? 0.6 : 1,
                  transition: "all 0.15s ease"
                }}
              >
                <Ic n="git_pull" s={11} c={T.brandLight}/>
                + PUBLISH PR
              </button>
            )}

            {session.sourceContext?.source && (
              <a href={safeUrl(b?.repoUrl ? `${b.repoUrl}/branches` : "#")} target="_blank" rel="noopener noreferrer" aria-label={`Branch ${b?.working || "main"}. ${b?.ahead || ahead || 0} commits ahead, ${b?.behind || 0} commits behind.`} style={{
                background:T.blueDim, border:`1px solid ${T.blue}30`, borderRadius:4, padding:"3px 8px",
                display:"flex", alignItems:"center", gap:4, color:T.blue, textDecoration:"none",
                fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:900, flexShrink:0,
                animation: isSyncing ? "shimmerPulse 1.5s infinite 0.4s" : "none"
              }}>
                <Ic n="branch" s={11} c={T.blue}/>
                {b?.working || "main"}
                {b?.ahead > 0 && <span style={{fontSize:9, background:`${T.brand}22`, color:T.brandLight, borderRadius:3, padding:"0px 4px", border:`1px solid ${T.brand}40`}}>↑{b.ahead}</span>}
                {b?.behind > 0 && <span style={{fontSize:9, background:`${T.amber}22`, color:T.amber, borderRadius:3, padding:"0px 4px", border:`1px solid ${T.amber}40`}}>↓{b.behind}</span>}
                {!(b?.ahead > 0 || b?.behind > 0) && ahead > 0 && <span style={{fontSize:9}}>+{ahead}</span>}
                {b?.checks && (
                  <span title={`Checks: ${b.checks.label || b.checks.state}`} aria-label={`Checks: ${b.checks.label || b.checks.state}`} style={{
                    width:5, height:5, borderRadius:"50%", flexShrink:0, marginLeft:2,
                    background: b.checks.state === "success" ? "#34d399" : b.checks.state === "failure" ? T.red : T.amber,
                    boxShadow: b.checks.state === "success" ? "0 0 6px #34d399" : b.checks.state === "failure" ? `0 0 6px ${T.red}` : `0 0 6px ${T.amber}`,
                    animation: b.checks.state === "pending" ? "dot 1s infinite" : "none"
                  }}/>
                )}
              </a>
            )}


            {session.url && (
              <a href={safeUrl(session.url)} target="_blank" rel="noopener noreferrer" style={{
                background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:4, padding:"3px 8px",
                display:"flex", alignItems:"center", gap:4, color:T.muted, textDecoration:"none",
                fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:900, flexShrink:0
              }}>
                WEB ↗
              </a>
            )}
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 3, overflow: "hidden", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <Bar
            pct={pct}
            status={currentState}
            syncing={isSyncing || busy || syncPhase === "DONE"}
            secondaryPct={isSyncing ? (syncStats.total > 0 ? Math.min(100, (syncStats.loaded / syncStats.total) * 100) : Math.min(100, (syncStats.count / activityLimit) * 100)) : 0}
          />
        </div>
      </div>



        <div style={{
          maxHeight: (currentState==="AWAITING_PLAN_APPROVAL" || currentState==="AWAITING_USER_FEEDBACK") ? 100 : 0,
          overflow: "hidden",
          transition: "max-height .3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}>
          {currentState==="AWAITING_PLAN_APPROVAL"&&(
            <div style={{marginBottom:8,padding:"7px 10px",background:T.purpleDim,border:`1px solid ${T.purple}40`,borderRadius:5,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>setTab("plan")}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.purple,animation:currentState==="COMPLETED"?"none":"dot 1.2s ease-in-out infinite",flexShrink:0}}/>
              <div style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.purple,fontWeight:700}}>PLAN READY — tap to review & approve</div>
              <Ic n="plan" s={13} c={T.purple}/>
            </div>
          )}

          {currentState==="AWAITING_USER_FEEDBACK"&&(
            <div style={{marginBottom:10,padding:"8px 10px",background:T.amberDim,border:`1px solid ${T.amber}40`,borderRadius:5,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.amber}}>
              ⚡ Jules needs your input — reply below
            </div>
          )}
        </div>

        {(pr?.state === "closed" || !pr) && b?.isNew && (b.ahead > 0 || ahead > 0) && (
          <div style={{
            marginBottom:10, padding:"10px 14px", background:T.blueDim,
            border:`1px solid ${T.blue}40`, borderRadius:8, display:"flex",
            alignItems:"center", gap:12, boxShadow:`0 4px 12px ${T.blue}10`
          }}>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.blue, fontWeight:800, letterSpacing:"0.05em", marginBottom:2}}>BRANCH AHEAD</div>
              <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, color:T.textDim}}>
                {b.ahead || ahead} commit{(b.ahead || ahead)!==1?'s':''} pushed to <span style={{color:T.blue, fontWeight:600}}>{b.working}</span>. No PR created yet.
              </div>
            </div>
            {b.repoUrl && (
              <div style={{display:"flex", gap:8}}>
                <a href={safeUrl(`${b.repoUrl}/branches`)} target="_blank" rel="noopener noreferrer" style={{
                  background:"transparent", color:T.blue, border:`1px solid ${T.blue}40`, borderRadius:6,
                  padding:"6px 10px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:10, fontWeight:700, textDecoration:"none", flexShrink:0
                }}>
                  BRANCHES
                </a>
                <button onClick={handlePublishPR} disabled={busy} style={{
                  background:T.brand, color:"#000", border:"none", borderRadius:6,
                  padding:"6px 12px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11, fontWeight:800, cursor: busy ? "not-allowed" : "pointer", flexShrink:0,
                  opacity: busy ? 0.6 : 1
                }} aria-label="Publish Pull Request" title="Publish Pull Request">
                  PUBLISH PR
                </button>
                <a href={safeUrl(`${b.repoUrl}/compare/${b.base}...${b.working}`)} target="_blank" rel="noopener noreferrer" style={{
                  background:T.surfaceHi, color:T.blue, border:`1px solid ${T.blue}40`, borderRadius:6,
                  padding:"6px 12px", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:11, fontWeight:800, textDecoration:"none", flexShrink:0
                }}>
                  CREATE PR ↗
                </a>
              </div>
            )}
          </div>
        )}

        {err&&<div style={{marginBottom:8,padding:"6px 10px",borderRadius:4,background:T.redDim,border:`1px solid ${T.red}40`,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:T.red}}>{err}</div>}

        {summary && (
          <div style={{
            maxHeight:scrolled?0:500, overflow:"hidden", opacity:scrolled?0:1,
            marginBottom:scrolled?0:12, padding:scrolled?0:"12px 16px",
            background:T.surfaceHi, border:`${scrolled?0:1}px solid ${T.borderHi}`,
            borderRadius:8, transition:"all .25s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents:scrolled?"none":"auto",
            boxShadow:"none",
          }}>
            <div style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand,
              fontWeight:800, letterSpacing:"0.1em", marginBottom:8,
            }}>SESSION SUMMARY</div>
            <div style={{
              fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, color:T.text,
              lineHeight:1.55, whiteSpace:"pre-wrap",
            }}>{summary.summary}</div>
            {pr && (
              <a href={safeUrl(pr.url)} target="_blank" rel="noopener noreferrer" style={{
                display:"inline-flex", alignItems:"center", gap:6, marginTop:12,
                color:T.brand, textDecoration:"none", fontFamily:"'JetBrains Mono',monospace",
                fontSize:12, fontWeight:700, borderBottom:`1px solid ${T.brand}40`
              }}>
                <Ic n="git_pull" s={13} c={T.brand}/>
                VIEW PULL REQUEST #{pr.number}
              </a>
            )}
          </div>
        )}


        <div role="tablist" aria-label="Session detail tabs" style={{display:"flex", paddingBottom:scrolled?4:0, transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)"}}>
          {TABS.map(t=>(
            <button key={t.id} role="tab" aria-selected={tab===t.id?"true":"false"} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"6px 0",background:"none",border:"none",
              borderBottom:`2px solid ${tab===t.id?T.brand:"transparent"}`,
              color:tab===t.id?T.brand:T.muted,cursor:"pointer",
              fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:800,letterSpacing:"0.05em",
              transition:"color .15s cubic-bezier(0.4, 0, 0.2, 1), border-color .15s cubic-bezier(0.4, 0, 0.2, 1)",
            }}>{t.label}</button>
          ))}
        </div>

      {/* ── Content ── */}
      <div ref={contentRef} onScroll={handleScroll} style={{flex:1,overflowY:"auto",padding:"14px 16px",paddingBottom:isDesktop?(replyingTo?140:80):(composerMinimized?(replyingTo?180:130):(replyingTo?270:220)),WebkitOverflowScrolling:"touch",minHeight:200,position:"relative"}}>
        {tab==="activity"&&(
          <>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:16, flexWrap:"wrap"}}>
              {["ALL", "MESSAGES", "REVIEWS", "SYSTEM"].map(f => (
                <button
                  key={f}
                  onClick={() => setChatFilter(f)}
                  style={{
                    minHeight: 36, padding: "0 14px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 12, border: "none",
                    background: chatFilter === f ? T.brandDim : "transparent",
                    color: chatFilter === f ? T.brand : T.muted,
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800,
                    cursor: "pointer", border: chatFilter === f ? `1px solid ${T.brand}40` : `1px solid ${T.border}`,
                    transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  {f}
                </button>
              ))}
              <div style={{flex:1}}/>
              <button
                onClick={() => {
                  const filtered = activities.filter(a => {
                    if (chatFilter === "MESSAGES") return a.userMessaged || a.agentMessaged;
                    if (chatFilter === "REVIEWS") return a.progressUpdated && a.progressUpdated.title?.toLowerCase().includes("review");
                    if (chatFilter === "SYSTEM") return !a.userMessaged && !a.agentMessaged && !(a.progressUpdated && a.progressUpdated.title?.toLowerCase().includes("review"));
                    return true;
                  });
                  const text = filtered.map(a => {
                    if (a.userMessaged) return `[USER] ${a.userMessaged.userMessage}`;
                    if (a.agentMessaged) return `[JULES] ${a.agentMessaged.agentMessage}`;
                    if (a.progressUpdated) return `[SYSTEM] ${a.progressUpdated.title}: ${a.progressUpdated.description}`;
                    return `[SYSTEM] ${Object.keys(a)[0]}`;
                  }).join("\n\n");
                  navigator.clipboard.writeText(text).then(() => {
                    setCopiedChat(true);
                    setTimeout(() => setCopiedChat(false), 2000);
                  });
                }}
                style={{
                  background: "transparent", border: "none", color: T.brand,
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                }}
              >
                {copiedChat ? (
                  "COPIED ✓"
                ) : (
                  <><Ic n="copy" s={10} c={T.brand}/> COPY ALL</>
                )}
              </button>
            </div>
            {showDriftWarning && (
              <div id="stale-base-warning" style={{
                marginBottom: 16, background: "rgba(252, 211, 77, 0.04)",
                border: `1px solid ${T.amber}30`, borderRadius: 10,
                overflow: "hidden", animation: "slideUp .3s ease"
              }}>
                <button
                  onClick={() => setDriftExpanded(p => !p)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    textAlign: "left", outline: "none", color: "inherit"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(252, 211, 77, 0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <Ic n="wifi" s={14} c={T.amber}/>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 900, color: T.amber, flex: 1, letterSpacing: "0.05em" }}>
                    ⚠️ STALE BASE DETECTED
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.amber, fontWeight: 700, opacity: 0.8, marginRight: 4 }}>
                    {driftExpanded ? "COLLAPSE" : "REVIEW RISK"}
                  </span>
                  <Ic n={driftExpanded ? "chevron_up" : "chevron_down"} s={14} c={T.amber}/>
                </button>

                <div id="stale-base-detail" style={{
                  display: driftExpanded ? "block" : "none",
                  maxHeight: driftExpanded ? "500px" : "0px",
                  opacity: driftExpanded ? 1 : 0,
                  overflow: "hidden",
                  transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
                  padding: driftExpanded ? "0 14px 14px" : "0 14px"
                }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, color: T.textDim, lineHeight: 1.4, marginBottom: 12 }}>
                    Another session on this repository was merged since you started. Jules may be working on an outdated codebase.
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => {
                        setMsg("The repository has been updated. Please pull the latest changes from the base branch and rebase your current work to avoid conflicts.");
                        setComposerMinimized(false);
                        setComposerVisible(true);
                        setTimeout(() => txtRef.current?.focus(), 100);
                      }}
                      style={{
                        background: T.amber, border: "none", borderRadius: 4, padding: "6px 12px",
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 900,
                        cursor: "pointer", color: "#000"
                      }}
                    >SYNC / REBASE</button>
                    <button
                      onClick={() => setShowDriftWarning(false)}
                      style={{
                        background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4,
                        padding: "6px 12px", fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                        fontWeight: 700, cursor: "pointer", color: T.muted
                      }}
                    >DISMISS</button>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links Card */}
            {(pr || session.url) && (
              <div style={{
                background: `linear-gradient(135deg, ${T.brand}08, ${T.surfaceHi})`,
                border: `1px solid ${T.brand}20`,
                borderRadius: 10, padding: "14px 18px", marginBottom: 16,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                boxShadow: `0 4px 20px ${T.brand}05`,
                animation: "fadeIn .25s ease-out"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Ic n="layers" s={14} c={T.brandLight}/>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brandLight, fontWeight: 800, letterSpacing: "0.1em" }}>
                    QUICK LINKS
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {pr && (
                    <a href={safeUrl(pr.url)} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                      background: pr.state === "merged" ? T.purpleDim : pr.state === "closed" ? T.dim : T.brandDim,
                      border: `1px solid ${pr.state === "merged" ? T.purple : pr.state === "closed" ? T.muted : T.brand}40`,
                      borderRadius: 6,
                      color: pr.state === "merged" ? T.purple : pr.state === "closed" ? T.muted : T.brandLight,
                      textDecoration: "none", fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11, fontWeight: 800, transition: "all .15s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = pr.state === "merged" ? `${T.purple}30` : `${T.brand}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = pr.state === "merged" ? T.purpleDim : pr.state === "closed" ? T.dim : T.brandDim; }}
                    >
                      <Ic n={pr.state === "merged" ? "git_merge" : "git_pull"} s={13} c={pr.state === "merged" ? T.purple : pr.state === "closed" ? T.muted : T.brandLight}/>
                      PR #{pr.number} ({pr.state.toUpperCase()}) ↗
                    </a>
                  )}
                  {session.url && (
                    <a href={safeUrl(session.url)} target="_blank" rel="noopener noreferrer" style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px",
                      background: T.surface, border: `1px solid ${T.borderHi}`, borderRadius: 6,
                      color: T.text, textDecoration: "none", fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 11, fontWeight: 800, transition: "all .15s ease"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.border; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.surface; }}
                    >
                      <Ic n="code" s={13} c={T.dim}/>
                      JULES WEB ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Custom Pull Request Metadata Card in Chat Completion Style */}
            {pr && (
              <div style={{ marginBottom: 24, width: "100%", animation: "fadeIn .25s ease-out" }}>
                {/* Header Accent Row */}
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  color: pr.state === "merged" ? T.purple : T.brand, fontWeight: 800,
                  letterSpacing: "0.1em", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: pr.state === "merged" ? T.purpleDim : T.brandDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 900,
                    color: pr.state === "merged" ? T.purple : T.brandLight, flexShrink: 0
                  }}>G</div>
                  <span>GITHUB PULL REQUEST #{pr.number}</span>
                  <div style={{ height: 1, flex: 1, background: pr.state === "merged" ? `${T.purple}20` : `${T.brand}20` }}/>
                  <span style={{ color: T.textDim, fontSize: 10, fontWeight: 500, textTransform: "uppercase" }}>
                    {pr.state}
                  </span>
                </div>

                {/* Structured Card */}
                <div style={{
                  background: "transparent", border: "none",
                  borderLeft: `3px solid ${pr.state === "merged" ? T.purple : T.brand}`,
                  borderRadius: 0, padding: "12px 0 12px 20px", position: "relative",
                  boxShadow: "none", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: "100%"
                }}>
                  {pr.failed && (
                    <div style={{ marginBottom: 12, padding: 8, background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <Ic n="refresh" s={14} c={T.amber}/>
                      <span style={{ fontSize: 11, color: T.amber, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                        ⚠️ GITHUB METADATA FETCH PAUSED (RATE LIMIT OR PRIVACY SETTINGS)
                      </span>
                    </div>
                  )}
                  {/* PR Title & Desc */}
                  {pr.title && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "'IBM Plex Sans',sans-serif" }}>
                        {pr.title}
                      </div>
                      {pr.body && (
                        <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.4, fontFamily: "'IBM Plex Sans',sans-serif", whiteSpace: "pre-wrap", overflowWrap: "break-word", opacity: 0.85 }}>
                          {pr.body.length > 300 ? pr.body.slice(0, 300) + "..." : pr.body}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PR Metrics Badges */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: T.brandLight, background: T.brandDim, padding: "2px 8px", borderRadius: 4 }}>
                      +{pr.additions || 0} additions
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: T.red, background: T.redDim, padding: "2px 8px", borderRadius: 4 }}>
                      -{pr.deletions || 0} deletions
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: T.purple, background: T.purpleDim, padding: "2px 8px", borderRadius: 4 }}>
                      {pr.changedFiles || 0} files changed
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700, color: T.amber, background: T.amberDim, padding: "2px 8px", borderRadius: 4 }}>
                      {pr.commitsCount || 0} commits
                    </div>
                  </div>

                  {/* PR Branch Sync and CI/CD Build Status Grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12,
                    background: `${T.surfaceHi}80`, borderRadius: 8, border: `1px solid ${T.border}`,
                    padding: 12, marginBottom: 12
                  }}>
                    {/* Branch Sync */}
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: T.blue, letterSpacing: "0.05em", marginBottom: 4 }}>
                        BRANCH SYNC
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.brandLight }}>↑ {pr.ahead || 0}</span>
                          <span style={{ fontSize: 13, color: T.dim }}>/</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>↓ {pr.behind || 0}</span>
                        </div>
                        <span style={{ fontSize: 12, color: T.textDim }}>
                          {pr.behind > 0 ? "Behind upstream branch" : pr.ahead > 0 ? "Ahead of base branch" : "Fully synchronized"}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* High Density Commits list */}
                  {pr.commitsList && pr.commitsList.length > 0 && (
                    <div style={{ marginTop: 12, background: T.surfaceHi, borderRadius: 8, border: `1px solid ${T.border}`, padding: 12 }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800, color: T.brand, marginBottom: 8, letterSpacing: "0.05em" }}>
                        COMMITS COMPARISON
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {pr.commitsList.map(c => (
                          <div key={c.sha} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                            <span style={{ color: T.purple, fontWeight: 700, fontSize: 11 }}>{c.sha}</span>
                            <div style={{ flex: 1, color: T.text, fontSize: 11, minWidth: 0, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                              {c.message}
                            </div>
                            <span style={{ color: T.textDim, fontSize: 10, opacity: 0.6, flexShrink: 0 }}>
                              {c.author}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Branch Status Metadata Card in Chat Completion Style when no PR exists */}
            {!pr && b?.isNew && (
              <div style={{ marginBottom: 24, width: "100%", animation: "fadeIn .25s ease-out" }}>
                {/* Header Accent Row */}
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
                  color: T.blue, fontWeight: 800,
                  letterSpacing: "0.1em", marginBottom: 12,
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5,
                    background: T.blueDim,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 900,
                    color: T.blue, flexShrink: 0
                  }}>B</div>
                  <span>GITHUB BRANCH STATUS</span>
                  <div style={{ height: 1, flex: 1, background: `${T.blue}20` }}/>
                  <span style={{ color: T.textDim, fontSize: 10, fontWeight: 500, textTransform: "uppercase" }}>
                    {b.statusState || "FEATURE"}
                  </span>
                </div>

                {/* Structured Card */}
                <div style={{
                  background: "transparent", border: "none",
                  borderLeft: `3px solid ${T.blue}`,
                  borderRadius: 0, padding: "12px 0 12px 20px", position: "relative",
                  boxShadow: "none", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: "100%"
                }}>
                  {b.failed && (
                    <div style={{ marginBottom: 12, padding: 8, background: `${T.amber}10`, border: `1px solid ${T.amber}30`, borderRadius: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <Ic n="refresh" s={14} c={T.amber}/>
                      <span style={{ fontSize: 11, color: T.amber, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                        ⚠️ GITHUB BRANCH STATUS PAUSED (RATE LIMIT OR PRIVACY SETTINGS)
                      </span>
                    </div>
                  )}
                  {/* Branch Name & Base Branch */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 4, fontFamily: "'IBM Plex Sans',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                      <Ic n="branch" s={14} c={T.blue}/>
                      {b.working}
                    </div>
                    <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.4, fontFamily: "'IBM Plex Sans',sans-serif", opacity: 0.85 }}>
                      Working branch based on <span style={{color: T.blue, fontWeight: 600}}>{b.base}</span>.
                    </div>
                  </div>

                  {/* Branch Sync and CI/CD Status Grid */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12,
                    background: `${T.surfaceHi}80`, borderRadius: 8, border: `1px solid ${T.border}`,
                    padding: 12, marginBottom: 12
                  }}>
                    {/* Sync Status */}
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: T.blue, letterSpacing: "0.05em", marginBottom: 4 }}>
                        BRANCH SYNC
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.brandLight }}>↑ {b.ahead || ahead || 0}</span>
                          <span style={{ fontSize: 13, color: T.dim }}>/</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.amber }}>↓ {b.behind || 0}</span>
                        </div>
                        <span style={{ fontSize: 12, color: T.textDim }}>
                          {b.behind > 0 ? "Behind upstream branch" : (b.ahead || ahead) > 0 ? "Ahead of base branch" : "Fully synchronized"}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* Collapsible Session Prompt Card (Dropdown style) */}
            {session.prompt && (
              <div id="chat-original-prompt" style={{
                background: T.surfaceHi, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: "12px 16px", marginBottom: 16,
                boxShadow: "none", position: "relative",
                transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !headerPromptExpanded;
                    setHeaderPromptExpanded(next);
                    if (next) {
                      requestAnimationFrame(() => {
                        if (headerPromptRef.current) {
                          headerPromptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                      });
                    }
                  }}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0,
                    textAlign: "left", outline: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Ic n="plan" s={14} c={T.brand}/>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: T.brand, fontWeight: 800, letterSpacing: "0.1em" }}>
                      ORIGINAL SESSION PROMPT
                    </span>
                  </div>
                  <Ic n={headerPromptExpanded ? "chevron_up" : "chevron_down"} s={16} c={T.brand}/>
                </button>

                <div
                  ref={headerPromptRef}
                  style={{
                    maxHeight: headerPromptExpanded ? 1000 : 0,
                    opacity: headerPromptExpanded ? 1 : 0,
                    overflow: "hidden",
                    transition: "all .3s cubic-bezier(0.4, 0, 0.2, 1)",
                    marginTop: headerPromptExpanded ? 12 : 0,
                  }}
                >
                  <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.5, fontFamily: "'IBM Plex Sans',sans-serif", whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
                    <ExpandableContent text={session.prompt} limit={200} showCopy forceExpanded={scrolledActivityId === "original"} />
                  </div>
                </div>
              </div>
            )}

            {activities.length===0
              ?<div style={{textAlign:"center",padding:"50px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
                {ACTIVE_STATES.has(currentState)?"Waiting for activity…":"No activities yet"}
              </div>
              :<ActivityFeed
                  activities={filteredActivities}
                  driftSessions={driftSessions}
                  showAll={showAll}
                  justUpdated={justUpdated}
                  scrolledActivityId={scrolledActivityId}
                  onShowAll={handleShowAll}
                  onMediaClick={setActiveMedia}
                  onEditMessage={handleEditMessage}
                  onReply={handleReply}
                />
            }
            <div style={{
              marginTop: 20, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <button
                onClick={handleRefresh}
                disabled={busy}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.background = T.brandDim; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}
                onMouseDown={e => { e.currentTarget.style.transform = "scale(0.95)"; }}
                onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 16px",
                  borderRadius: 20, border: `1px solid ${busy ? T.brand : T.border}`,
                  background: busy ? T.brandDim : "transparent",
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: busy ? T.brand : T.muted,
                  cursor: busy ? "default" : "pointer", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  opacity: 0.9, boxShadow: busy ? `0 4px 12px ${T.brand}20` : "none"
                }}
              >
                {pollInterval > 0 && !isFinished && !busy ? (
                  <div style={{ position: "relative", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="7" cy="7" r="5.5" fill="none" stroke={T.border} strokeWidth="1.5" opacity="0.3" />
                      <circle cx="7" cy="7" r="5.5" fill="none" stroke={T.brand} strokeWidth="2"
                        strokeDasharray={2 * Math.PI * 5.5}
                        strokeDashoffset={2 * Math.PI * 5.5 * (1 - (countdown / (pollInterval / 1000)))}
                        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                      />
                    </svg>
                    <div style={{
                      position: "absolute", width: 3, height: 3, borderRadius: "50%", background: T.brand,
                      animation: countdown <= 3 ? "dot 1s infinite" : "none"
                    }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", animation: busy ? "spin 1s linear infinite" : "none" }}>
                    <Ic n="refresh" s={12} c={busy ? T.brand : T.muted} />
                  </div>
                )}
                <span style={{ fontWeight: 800, letterSpacing: "0.05em" }}>
                  {busy ? "REFRESHING..." : isFinished ? "COMPLETED — TAP TO REFRESH" : pollInterval > 0 ? `REFRESH IN ${countdown}S` : "MANUAL REFRESH"}
                </span>
                {justUpdated && !busy && <span style={{ color: T.brand, fontSize: 9 }}>✓ UPDATED</span>}
              </button>
            </div>
          </>
        )}
        {tab==="reviews" && (
          <div style={{display:"flex", flexDirection:"column", gap:12}}>
            {reviews.length === 0 ? (
              <div style={{textAlign:"center",padding:"50px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>
                No reviews found
              </div>
            ) : (
              reviews.map(act => {
                const p = act.progressUpdated;
                return (
                  <div key={getActKey(act)} style={{
                    background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                    borderRadius:8, padding:16, position:"relative"
                  }}>
                    <div style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, color:T.text, lineHeight:1.5, whiteSpace:"pre-wrap"}}>
                      {p.description}
                    </div>
                    <div style={{marginTop:12, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
                       <div style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.dim}}>
                         {fmtChars(p.description?.length || 0)}
                       </div>
                       <button
                         onClick={() => {
                           navigator.clipboard.writeText(p.description).then(() => {
                             const actKey = getActKey(act);
                             setCopiedReviews(prev => ({ ...prev, [actKey]: true }));
                             setTimeout(() => {
                               setCopiedReviews(prev => ({ ...prev, [actKey]: false }));
                             }, 2000);
                           });
                         }}
                         style={{
                           background:"transparent", border:"none", color:T.brand,
                           fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700,
                           cursor:"pointer", display:"flex", alignItems:"center", gap:4
                         }}
                       >
                         {copiedReviews[getActKey(act)] ? (
                           "COPIED ✓"
                         ) : (
                           <><Ic n="copy" s={12} c={T.brand}/> COPY</>
                         )}
                       </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {tab==="prompt"&&(
          <div style={{padding:"4px 0 20px", display:"flex", flexDirection:"column", gap:20}}>
            <div key="original">
              <div style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.brand,
                fontWeight:800, letterSpacing:"0.1em", marginBottom:12,
                display:"flex", alignItems:"center", gap:8
              }}>
                ORIGINAL PROMPT
                <div style={{height:1, flex:1, background:T.brandDim}}/>
              </div>
              <div
                style={{
                  background:T.surfaceHi, border:`1px solid ${T.border}`,
                  borderRadius:10, padding:"20px", boxShadow:"none", position:"relative",
                  transition: "border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <div style={{ fontSize:16, color:T.text, lineHeight:1.6, fontFamily:"'IBM Plex Sans',sans-serif" }}>
                  <ExpandableContent text={session.prompt} showCopy />
                </div>
                <div style={{ position:"absolute", top:12, right:12, display:"flex", gap:6 }}>
                  <button onClick={(e) => { e.stopPropagation(); scrollToActivityInChat(null, true); }} style={{
                    background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, padding:"4px 8px",
                    color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer",
                    display:"inline-flex", alignItems:"center", gap:4
                  }} title="Jump to this prompt in chat tab" aria-label="Jump to this prompt in chat tab">
                    <Ic n="reply" s={11} c={T.brand}/>
                    VIEW IN CHAT
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onEditMessage(session.prompt); }} style={{
                    background:T.brandDim, border:"none", borderRadius:4, padding:"4px 8px",
                    color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer"
                  }} title="Edit message prompt" aria-label="Edit message prompt">EDIT</button>
                </div>
              </div>
            </div>

            {activities.filter(a => a.userMessaged).map((a, i) => {
              const actKey = getActKey(a);
              return (
                <div key={actKey || i}>
                  <div style={{
                    fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.brand,
                    fontWeight:800, letterSpacing:"0.1em", marginBottom:12,
                    display:"flex", alignItems:"center", gap:8
                  }}>
                    FOLLOW-UP #{i+1}
                    <div style={{height:1, flex:1, background:T.brandDim}}/>
                    <span style={{color:T.textDim, fontSize:10}}>{fmtTime(parseDateMs(a.createTime))}</span>
                  </div>
                  <div
                    style={{
                      background:T.surfaceHi, border:`1px solid ${T.border}`,
                      borderRadius:10, padding:"20px", boxShadow:"none", position:"relative",
                      transition: "border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                  >
                    <div style={{ fontSize:16, color:T.text, lineHeight:1.6, fontFamily:"'IBM Plex Sans',sans-serif" }}>
                      <ExpandableContent text={a.userMessaged.userMessage} showCopy />
                    </div>
                    <div style={{ position:"absolute", top:12, right:12, display:"flex", gap:6 }}>
                      <button onClick={(e) => { e.stopPropagation(); scrollToActivityInChat(actKey, false); }} style={{
                        background:T.surface, border:`1px solid ${T.border}`, borderRadius:4, padding:"4px 8px",
                        color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer",
                        display:"inline-flex", alignItems:"center", gap:4
                      }} title="Jump to this follow-up in chat tab" aria-label="Jump to this follow-up in chat tab">
                        <Ic n="reply" s={11} c={T.brand}/>
                        VIEW IN CHAT
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onEditMessage(a.userMessaged.userMessage); }} style={{
                        background:T.brandDim, border:"none", borderRadius:4, padding:"4px 8px",
                        color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, cursor:"pointer"
                      }} title="Edit follow-up prompt" aria-label="Edit follow-up prompt">EDIT</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab==="plan"&&(
          <PlanView
            activities={activities}
            session={session}
            apiKey={apiKey}
            onApprove={handleApprove}
            onSendFeedback={handleSendFeedback}
            busy={busy}
            allSessions={allSessions}
            activitiesMap={activitiesMap}
          />
        )}
        {tab==="diff"&&<DiffViewer activities={activities} isDesktop={isDesktop}/>}
        {tab==="media"&&(
          mediaArtifacts.length===0
          ?<div style={{textAlign:"center",padding:"40px 0",fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:T.textDim}}>No media artifacts</div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:12}}>
            {mediaArtifacts.map((m,i)=>{
              const mime = safeMediaMimeType(m.mimeType);
              const base64Data = safeMediaBase64(m.data);
              const isVideo = mime.startsWith("video/");
              return (
                <button
                  key={i}
                  onClick={() => setActiveMedia({ ...m, data: base64Data, mimeType: mime })}
                  style={{
                    background:T.surface, border:`1px solid ${T.border}`, borderRadius:8,
                    overflow:"hidden", cursor:"pointer", padding:0, textAlign:"left",
                    transition:"transform .15s cubic-bezier(0.4, 0, 0.2, 1), border-color .15s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ width:"100%", height:120, background:"#040507", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {isVideo ? (
                      <video src={`data:${mime};base64,${base64Data}`} muted autoPlay loop playsInline
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    ) : (
                      <img src={`data:${mime};base64,${base64Data}`} alt={`artifact-${i}`}
                        style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    )}
                  </div>
                  <div style={{ padding:"8px 10px" }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.text, fontWeight:700, marginBottom:2 }}>
                      {mime.split("/")[1]?.toUpperCase() || "IMAGE"}
                    </div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.textDim, display:"flex", justifyContent:"space-between" }}>
                      <span>{fmtTime(parseDateMs(m.ts))}</span>
                      <span>{fmtBytes((m.data?.length || 0) * 0.75 / 1024)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div ref={feedEndRef}/>
      </div>

      {/* ── Media Lightbox ── */}
      <MediaModal media={activeMedia} onClose={() => setActiveMedia(null)}/>

      {/* ── Payload Breakdown Modal ── */}
      {showPayloadBreakdown && (
        <PayloadBreakdownModal
          breakdown={payloadBreakdown}
          onClose={() => setShowPayloadBreakdown(false)}
        />
      )}

      {/* ── Composer ── */}
      {canSend&&(
        <div ref={composerRef} onBlur={e => {
          if (composerRef.current && !composerRef.current.contains(e.relatedTarget)) {
            // Keep expanded if replying so they don't lose context
            if (!replyingTo) {
              setComposerMinimized(true);
              setExpanded(false);
            }
          }
        }} style={{
          padding:"10px 12px", borderTop:`1px solid ${T.border}`, background:T.surface,
          flexShrink:0, transition:"transform .3s cubic-bezier(0.4, 0, 0.2, 1), opacity .2s ease, visibility .3s",
          transform: (isDesktop || composerVisible) ? "translateY(0)" : "translateY(100%)",
          opacity: (isDesktop || composerVisible) ? 1 : 0,
          visibility: (isDesktop || composerVisible) ? "visible" : "hidden",
          position: isDesktop ? "relative" : "absolute",
          bottom: 0, left: 0, right: 0, zIndex: 10,
          boxShadow: isDesktop ? "none" : "0 -12px 32px rgba(0,0,0,0.5)",
        }}>
          {!composerMinimized && replyingTo && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              background: "rgba(6, 182, 212, 0.08)", border: `1px solid ${T.brand}30`,
              borderRadius: 8, marginBottom: 10, animation: "fadeIn .2s ease-out",
            }}>
              <Ic n="reply" s={14} c={T.brand}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: T.brand, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  REPLYING TO {replyingTo.sender}
                </div>
                <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                  {(() => {
                    const replyAct = replyingTo.act;
                    if (replyAct.agentMessaged) return replyAct.agentMessaged.agentMessage;
                    if (replyAct.progressUpdated) return replyAct.progressUpdated.description || replyAct.progressUpdated.title || "";
                    if (replyAct.planGenerated) return "Plan Generated";
                    return replyAct.description || "System Event";
                  })()}
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: 0.6, transition: "opacity .15s ease"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                onMouseLeave={e => e.currentTarget.style.opacity = "0.6"}
              >
                <Ic n="x" s={14} c={T.red}/>
              </button>
            </div>
          )}

          {!composerMinimized && <MultiPersonaPicker personas={personas} selectedIds={selectedPersonas} onToggle={togglePersona} style={{marginBottom:10}} />}

          <div style={{position:"relative", display:"flex", flexDirection:"column"}}>
            {!composerMinimized ? (
              <>
                <textarea
                  ref={txtRef}
                  value={msg}
                  onChange={e=>setMsg(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),handleSend())}
                  placeholder="Message Jules or give new instructions…"
                  aria-label="Message Jules or give new instructions"
                  rows={expanded?15:3}
                  maxLength={20000}
                  style={{
                    width:"100%", background:T.surfaceHi,
                    border:`1px solid ${msg?T.brand+"66":T.border}`,
                    borderRadius:10, padding:`12px 14px 44px`, color:T.text,
                    fontFamily:"'IBM Plex Sans',sans-serif", fontSize:15, lineHeight:1.45,
                    resize:"none", outline:"none", transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                    WebkitOverflowScrolling:"touch",
                    ...(expanded ? {
                      position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1000,
                      margin:0, borderRadius:0, height:"100vh", padding:"60px 24px 80px"
                    } : {})
                  }}
                />

                {/* Input Toolbar (Inside Textarea area but positioned bottom-right) */}
                <div style={{
                  position: expanded ? "fixed" : "absolute",
                  bottom: expanded ? 90 : 8,
                  right: expanded ? 24 : 8,
                  display: "flex", gap: 10, alignItems: "center", zIndex: 1001,
                  padding: "4px 8px", borderRadius: 8,
                  background: expanded ? T.surfaceHi : "rgba(11, 14, 20, 0.8)",
                  backdropFilter: expanded ? "none" : "blur(8px)",
                  border: expanded ? `1px solid ${T.border}` : "none",
                }}>
                  {msg.trim() && (
                    <button onClick={()=>setMsg("")} title="Clear" aria-label="Clear" style={{background:"transparent", border:"none", padding:4, cursor:"pointer", display:"flex", alignItems:"center"}}>
                      <Ic n="x" s={16} c={T.red}/>
                    </button>
                  )}
                  <button onClick={()=>setExpanded(!expanded)} title={expanded ? "Minimize" : "Expand"} aria-label={expanded ? "Minimize" : "Expand"} style={{background:"transparent", border:"none", padding:4, cursor:"pointer", display:"flex", alignItems:"center"}}>
                    <Ic n={expanded ? "chevron_down" : "expand"} s={16} c={T.brand}/>
                  </button>
                  <div style={{width:1, height:16, background:T.border}}/>
                  {(() => {
                    const sendTitle = !msg.trim() ? "Please enter a message first" : (busy ? "Jules is currently busy..." : "Send message to Jules");
                    return (
                      <button
                        onClick={handleSend}
                        disabled={!msg.trim()||busy}
                        title={sendTitle}
                        aria-label={sendTitle}
                        style={{
                          background: "transparent", border: "none", cursor: msg.trim()&&!busy?"pointer":"default",
                          display: "flex", alignItems: "center", justifyContent: "center", padding: 4,
                          opacity: msg.trim()&&!busy ? 1 : 0.4, transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)"
                        }}
                      >
                        <Ic n="send" s={20} c={msg.trim()&&!busy?T.brand:T.muted}/>
                      </button>
                    );
                  })()}
                </div>

                {expanded && (() => {
                  const sendTitle = !msg.trim() ? "Please enter a message first" : (busy ? "Jules is currently busy..." : "Send message to Jules");
                  return (
                    <button
                      onClick={handleSend}
                      disabled={!msg.trim()||busy}
                      title={sendTitle}
                      aria-label={sendTitle}
                      style={{
                        position: "fixed", bottom: 16, left: 24, right: 24, zIndex: 1001, height: 48,
                        borderRadius: 10, border: "none", background: T.brand, color: "#000",
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 900,
                        letterSpacing: "0.05em", cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 10, boxShadow: `0 8px 24px ${T.brand}40`
                      }}
                    >
                      <Ic n="send" s={18} c="#000"/> SEND MESSAGE
                    </button>
                  );
                })()}
              </>
            ) : (
              <button
                onClick={handleExpandComposer}
                style={{
                  width:"100%", background:T.surfaceHi, border:`1px solid ${T.borderHi}`,
                  borderRadius:8, padding:"12px 16px", display:"flex", alignItems:"center",
                  justifyContent:"space-between", cursor:"pointer", transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow:`0 4px 12px rgba(0,0,0,0.3)`
                }}
              >
                <span style={{fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, color:T.muted, display:"flex", alignItems:"center", gap:8}}>
                  {replyingTo ? (
                    <>
                      <Ic n="reply" s={14} c={T.brand}/>
                      Replying to {replyingTo.sender}...
                    </>
                  ) : (
                    msg.trim() ? "Continue follow-up..." : "Send a message..."
                  )}
                </span>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  {msg.trim() && <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.brand, fontWeight:800}}>{fmtChars(msg.length)}</span>}
                  <Ic n="expand" s={16} c={T.brand}/>
                </div>
              </button>
            )}
          </div>

          <div style={{marginTop:8, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.dim}}>
            <div style={{display:"flex", alignItems:"center", gap:10, minWidth:0}}>
               <div style={{whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>↵ SEND · SHIFT+↵ NEWLINE</div>
               <div style={{color: T.brand, fontWeight:700, opacity: 0.8 }}>{fmtChars(msg.length)}</div>
            </div>
            <button
              onClick={() => setShowPayloadBreakdown(true)}
              title="View activity payload size breakdown"
              aria-label="View activity payload size breakdown"
              style={{
                display:"flex", alignItems:"center", gap:6, fontWeight:700, opacity:0.9, letterSpacing:"0.05em", whiteSpace:"nowrap",
                background:T.surfaceHi, border:`1px solid ${T.borderHi}`, padding:"2px 8px", borderRadius:4, cursor:"pointer",
                color:T.textDim, transition:"all .15s cubic-bezier(0.4, 0, 0.2, 1)", outline:"none"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.brandLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.color = T.textDim; }}
            >
              <span>{activityStats.count} ITEMS</span>
              <span style={{width:1, height:8, background:T.border}}/>
              <span>{fmtBytes(activityStats.size/1024)}</span>
              <Ic n="layers" s={10} c={T.brand}/>
            </button>
          </div>
        </div>
      )}

      {/* ── Refined Floating Scroll Actions ── */}
      <div style={{
        position:"absolute", right:20,
        bottom: (isDesktop || composerVisible) ? (isDesktop ? (replyingTo ? 170 : 110) : (composerMinimized ? (replyingTo ? 160 : 110) : (replyingTo ? 290 : 240))) : 30,
        zIndex:100, pointerEvents:"none",
        transition:"bottom .3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <button
          onClick={() => {
            const el = contentRef.current;
            if (!el) return;
            if (scrollDirMode === "top") el.scrollTo({ top: 0, behavior: "smooth" });
            else el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          }}
          style={{
            width:40, height:40, borderRadius:"50%", background:T.surfaceHi,
            border:`1px solid ${T.borderHi}`, color:T.brand, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 24px rgba(0,0,0,0.5)", pointerEvents:"auto",
            opacity:showScroll?1:0, transform:showScroll?"scale(1)":"scale(0.8)",
            transition:"all .2s cubic-bezier(0.4, 0, 0.2, 1)",
            visibility:showScroll?"visible":"hidden",
            outline:"none",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.borderColor = T.brand; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = T.borderHi; }}
          title={scrollDirMode === "top" ? "Scroll to top" : "Scroll to bottom"}
          aria-label={scrollDirMode === "top" ? "Scroll to top" : "Scroll to bottom"}
        >
          <Ic n={scrollDirMode === "top" ? "chevron_up" : "chevron_down"} s={24} c={T.brand}/>
        </button>
      </div>
    </div>
  );
};

// ─── Payload Breakdown Modal ─────────────────────────────────────────
const PayloadBreakdownModal = ({ breakdown, onClose }) => {
  const { mediaBytes, patchBytes, messageBytes, planBytes, otherBytes, totalBytes, mediaCount, patchCount, topPatches = [], topMedia = [] } = breakdown;
  const total = totalBytes || 1;
  const [showPatchDetail, setShowPatchDetail] = useState(false);
  const [copiedDebug, setCopiedDebug] = useState(false);

  const categories = [
    { label: "Media Artifacts", bytes: mediaBytes, color: T.red, icon: "layers", note: mediaCount > 0 ? `${mediaCount} images/videos` : "None" },
    { label: "Code Patches / Diffs", bytes: patchBytes, color: T.purple, icon: "code", note: patchCount > 0 ? `${patchCount} patch sets` : "None" },
    { label: "User / Agent Messages", bytes: messageBytes, color: T.blue, icon: "tasks", note: "Chat text" },
    { label: "Plans & Progress Events", bytes: planBytes, color: T.brandLight, icon: "plan", note: "Timeline events" },
    { label: "Metadata & Structure", bytes: otherBytes, color: T.muted, icon: "database", note: "Overhead" },
  ].filter(c => c.bytes > 0);

  const handleCopyDebugLog = () => {
    const logData = {
      summary: {
        totalBytes,
        formattedTotal: fmtBytes(totalBytes / 1024),
        mediaBytes,
        patchBytes,
        messageBytes,
        planBytes,
        otherBytes
      },
      codePatches: topPatches.map((p, i) => ({
        index: i + 1,
        id: p.id,
        bytes: p.bytes,
        formattedSize: fmtBytes(p.bytes / 1024),
        percentageOfTotal: `${((p.bytes / total) * 100).toFixed(2)}%`,
        fileCount: p.fileCount,
        timestamp: p.ts
      })),
      mediaArtifacts: topMedia.map((m, i) => ({
        index: i + 1,
        mimeType: m.mimeType,
        bytes: m.bytes,
        formattedSize: fmtBytes(m.bytes / 1024),
        timestamp: m.ts
      }))
    };

    navigator.clipboard.writeText(JSON.stringify(logData, null, 2)).then(() => {
      setCopiedDebug(true);
      setTimeout(() => setCopiedDebug(false), 2000);
    });
  };

  return (
    <Modal
      onClose={onClose}
      title="PAYLOAD SIZE BREAKDOWN"
      subtitle={`Total Activity Size: ${fmtBytes(totalBytes / 1024)}`}
      icon="layers"
      maxWidth={520}
      actions={
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={handleCopyDebugLog}
            style={{
              flex: 1, padding: "10px", borderRadius: 8,
              border: `1px solid ${T.purple}40`, background: `${T.purple}15`,
              color: T.purple, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            <Ic n="copy" s={12} c={T.purple} />
            {copiedDebug ? "LOG COPIED ✓" : "COPY DEBUG LOG"}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "none",
              background: T.brand, color: "#000", fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12, fontWeight: 900, cursor: "pointer"
            }}
          >
            CLOSE
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Visual Stacked Bar */}
        <div style={{
          height: 12, borderRadius: 6, overflow: "hidden", background: T.surfaceHi,
          display: "flex", border: `1px solid ${T.border}`
        }}>
          {categories.map((c, i) => {
            const pct = Math.max(1, (c.bytes / total) * 100);
            return (
              <div
                key={i}
                title={`${c.label}: ${fmtBytes(c.bytes / 1024)} (${((c.bytes / total) * 100).toFixed(1)}%)`}
                style={{
                  width: `${pct}%`, background: c.color, height: "100%",
                  transition: "width .3s ease"
                }}
              />
            );
          })}
        </div>

        {/* Detailed Category List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {categories.map((c, i) => {
            const pct = ((c.bytes / total) * 100).toFixed(1);
            return (
              <div
                key={i}
                style={{
                  background: T.surfaceHi, border: `1px solid ${T.borderHi}`, borderRadius: 8,
                  padding: "10px 14px", display: "flex", alignItems: "center", gap: 12
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6, background: `${c.color}15`,
                  border: `1px solid ${c.color}40`, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0
                }}>
                  <Ic n={c.icon} s={14} c={c.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.text, display: "flex", justifyContent: "space-between" }}>
                    <span>{c.label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", color: c.color }}>{fmtBytes(c.bytes / 1024)}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.textDim, display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span>{c.note}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Code Patch Breakdown Toggle */}
        {topPatches.length > 0 && (
          <div style={{
            background: `${T.purple}0d`, border: `1px solid ${T.purple}30`, borderRadius: 8,
            overflow: "hidden"
          }}>
            <button
              onClick={() => setShowPatchDetail(p => !p)}
              style={{
                width: "100%", padding: "10px 14px", background: "none", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 800, color: T.purple,
                outline: "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic n="code" s={14} c={T.purple} />
                <span>CODE PATCHES BREAKDOWN ({topPatches.length})</span>
              </div>
              <Ic n={showPatchDetail ? "chevron_up" : "chevron_down"} s={14} c={T.purple} />
            </button>

            {showPatchDetail && (
              <div style={{ padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {topPatches.map((p, idx) => {
                  const pPct = ((p.bytes / total) * 100).toFixed(1);
                  return (
                    <div
                      key={idx}
                      style={{
                        background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 6,
                        padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 11
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                        <div style={{ color: T.text, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Patch #{idx + 1} ({p.fileCount} file{p.fileCount !== 1 ? "s" : ""})
                        </div>
                        <div style={{ color: T.dim, fontSize: 9, marginTop: 1 }}>
                          {fmtTime(parseDateMs(p.ts))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ color: T.purple, fontWeight: 800 }}>{fmtBytes(p.bytes / 1024)}</div>
                        <div style={{ color: T.textDim, fontSize: 9 }}>{pPct}% of payload</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{
          padding: 12, borderRadius: 8, background: `${T.brand}0d`, border: `1px solid ${T.brand}20`,
          fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: T.textDim, lineHeight: 1.45
        }}>
          💡 <strong style={{ color: T.brandLight }}>Payload Tip:</strong> Base64 media artifacts and long unidiff patch histories dominate fetch sizes. To keep sessions lightweight, enable <strong>Lean Payload Mode</strong> in repository settings.
        </div>
      </div>
    </Modal>
  );
};

// ─── New Session ──────────────────────────────────────────────────────────────
// ─── NewSession draft persistence ────────────────────────────────────────────
