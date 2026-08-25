const useNewSessionFlow = ({ apiKey, personas, onCreate, initialDraft, onDraftSaved }) => {
  const draft = useMemo(() => initialDraft || loadDraft(), [initialDraft]);
  const hasSavedOrSubmitted = useRef(false);
  const [sources,setSources]       = useState([]);
  const [loadingSrc,setLoadSrc]    = useState(true);
  const [source,setSource]         = useState(draft?.source ?? "");
  const [sourceSearch,setSourceSearch] = useState("");
  const [showSources,setShowSources] = useState(false);
  const [branch,setBranch]         = useState(draft?.branch ?? "");
  const [branches,setBranches]     = useState([]);   // [{displayName}] from Jules API
  const [showBranches,setShowBranches] = useState(false);
  const [defaultBranch,setDefault] = useState("");   // e.g. "main"
  const [prompt,setPrompt]         = useState(draft?.prompt ?? "");
  const [autoMode,setAutoMode]     = useState(draft?.autoMode ?? true);
  const [reqApproval,setReqApp]    = useState(draft?.reqApproval ?? false);
  const [selectedPersonas, setSelectedPersonas] = useState(new Set(draft?.selectedPersonas || []));
  const [leanMode, setLeanMode]    = useState(() => {
    if (!source) return true;
    const repos = SafeStorage.loadLeanModeRepos();
    return repos[source] !== undefined ? repos[source] : true;
  });
  const [submitting,setSub]        = useState(false);
  const [err,setErr]               = useState(null);
  const [savedFlash,setSavedFlash] = useState(false);
  const [expanded,setExpanded]     = useState(false);
  const [showConfirm,setShowConfirm] = useState(false);
  const [sourceInteracted, setSourceInteracted] = useState(false);

  // ── Derive branches whenever selected source changes ─────────────────────
  const srcObj = useMemo(() => sources.find(s => s.name === source) || null, [sources, source]);

  const getSourceDisplay = useCallback((s) => {
    if (!s) return "No repo (repoless)";
    return s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : s.id || s.name;
  }, []);

  useEffect(() => {
    if (srcObj) setSourceSearch(getSourceDisplay(srcObj));
    else if (source === "") setSourceSearch("No repo (repoless)");

    if (source) {
      const repos = SafeStorage.loadLeanModeRepos();
      if (repos[source] !== undefined) {
        setLeanMode(repos[source]);
      } else {
        setLeanMode(true);
      }
    }
  }, [srcObj, source, getSourceDisplay]);

  const toggleLeanMode = useCallback(() => {
    setLeanMode(prev => {
      const next = !prev;
      if (source) {
        SafeStorage.saveLeanModeRepo(source, next);
      }
      return next;
    });
  }, [source]);

  const filteredSources = useMemo(() => {
    const search = sourceSearch.toLowerCase();
    const isSelectedMatch = (srcObj && sourceSearch === getSourceDisplay(srcObj)) || (source === "" && sourceSearch === "No repo (repoless)");

    let base = [...sources];
    const stats = loadRepoStats();
    base.sort((a,b) => (stats[b.name]||0) - (stats[a.name]||0));

    const all = [...base, null]; // null represents "repoless"
    if (!sourceSearch || isSelectedMatch) return all;
    return all.filter(s => getSourceDisplay(s).toLowerCase().includes(search));
  }, [sources, sourceSearch, getSourceDisplay, srcObj, source]);

  useEffect(() => {
    if (!srcObj) { setBranches([]); setDefault(""); return; }
    const repo = srcObj.githubRepo;
    if (!repo) { setBranches([]); setDefault(""); return; }
    const bs   = (repo.branches || []).map(b => b.displayName).filter(Boolean);
    const def  = repo.defaultBranch?.displayName || bs[0] || "main";
    setBranches(bs);
    setDefault(def);
    if (!draft?.branch || draft?.source !== source) {
      const lastBranch = loadLastBranches()[source];
      setBranch(lastBranch || def);
    }
  }, [srcObj, source]);

  const filteredBranches = useMemo(() => {
    if (!branch || branches.includes(branch)) return branches;
    const s = branch.toLowerCase();
    return branches.filter(b => b.toLowerCase().includes(s));
  }, [branches, branch]);

  const togglePersona = (id) => {
    const next = new Set(selectedPersonas);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedPersonas(next);
  };

  useEffect(() => {
    if (!source && autoMode) setAutoMode(false);
  }, [source, autoMode]);

  const draftRef = useRef(null);
  useEffect(() => {
    clearTimeout(draftRef.current);
    draftRef.current = setTimeout(() => {
      saveDraft({ source, branch, prompt, autoMode, reqApproval, selectedPersonas: Array.from(selectedPersonas) });
    }, 400);
    return () => clearTimeout(draftRef.current);
  }, [source, branch, prompt, autoMode, reqApproval]);

  const stateRef = useRef({ source, branch, prompt, autoMode, reqApproval, selectedPersonas, defaultBranch, initialDraft });
  useEffect(() => {
    stateRef.current = { source, branch, prompt, autoMode, reqApproval, selectedPersonas, defaultBranch, initialDraft };
  }, [source, branch, prompt, autoMode, reqApproval, selectedPersonas, defaultBranch, initialDraft]);

  useEffect(() => {
    return () => {
      if (!hasSavedOrSubmitted.current) {
        const current = stateRef.current;
        if (current.prompt.trim()) {
          const d = {
            id: current.initialDraft?.id,
            source: current.source,
            branch: current.branch || current.defaultBranch || "main",
            prompt: current.prompt,
            autoMode: current.autoMode,
            reqApproval: current.reqApproval,
            selectedPersonas: Array.from(current.selectedPersonas),
            title: (() => {
              const firstLine = current.prompt.trim().split("\n")[0];
              const truncated = safeSlice(firstLine, 50);
              const hasMore = Array.from(current.prompt.trim()).length > 50 || firstLine !== current.prompt.trim();
              return truncated + (hasMore ? "..." : "");
            })()
          };
          saveDraftToBox(d);
          clearDraft();
        }
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiCall(apiKey, "/sources?pageSize=50", { _label:"List sources" });
        const s = d.sources || [];
        const stats = loadRepoStats();
        const sorted = [...s].sort((a,b) => (stats[b.name]||0) - (stats[a.name]||0));
        setSources(sorted);
        if (!draft?.source) {
          const last = loadLastSource();
          if (last && sorted.some(x => x.name === last)) setSource(last);
          else if (sorted.length > 0) setSource(sorted[0].name);
        }
      } catch (err) { setErr(err.message); }
      finally { setLoadSrc(false); }
    })();
  }, []);

  const handleClearDraft = () => {
    hasSavedOrSubmitted.current = true;
    clearDraft();
    setSource(""); setBranch(""); setPrompt("");
    setAutoMode(true); setReqApp(false); setSelectedPersonas(new Set());
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    if (onDraftSaved) onDraftSaved();
  };

  const handleSaveToBox = () => {
    if (!prompt.trim()) return;
    hasSavedOrSubmitted.current = true;
    const d = {
      id: initialDraft?.id,
      source,
      branch: branch || defaultBranch || "main",
      prompt,
      autoMode,
      reqApproval,
      selectedPersonas: Array.from(selectedPersonas),
      title: (() => {
        const firstLine = prompt.trim().split("\n")[0];
        const truncated = safeSlice(firstLine, 50);
        const hasMore = Array.from(prompt.trim()).length > 50 || firstLine !== prompt.trim();
        return truncated + (hasMore ? "..." : "");
      })()
    };
    saveDraftToBox(d);
    handleClearDraft();
    if (onDraftSaved) onDraftSaved();
  };

  const handleCreate = async () => {
    setSub(true); setErr(null); setShowConfirm(false);

    const activeBranch = branch || defaultBranch || "main";
    if (source && !isValidGitBranchName(activeBranch)) {
      setErr("Invalid branch name format. Branch names cannot contain spaces, consecutive dots, or characters like ~, ^, :, ?, *, [, \\.");
      setSub(false);
      return;
    }

    let finalPrompt = prompt.trim();
    if (selectedPersonas.size > 0) {
      const personaPrompts = Array.from(selectedPersonas)
        .map(id => personas.find(p => p.id === id)?.prompt)
        .filter(Boolean);
      if (personaPrompts.length > 0) {
        finalPrompt += "\n\n" + personaPrompts.join("\n\n");
      }
    }

    if (leanMode) {
      finalPrompt += "\n\n[System Directive: Do not capture or attach visual media artifacts (screenshots or videos) unless specifically requested for visual bug verification.]";
    }

    const body = {
      prompt: finalPrompt,
      ...(source&&{
        sourceContext:{ source, githubRepoContext:{ startingBranch:branch||defaultBranch||"main" } },
        ...(autoMode&&{automationMode:"AUTO_CREATE_PR"}),
      }),
      requirePlanApproval: reqApproval,
    };
    try {
      const d = await apiCall(apiKey, "/sessions", {
        method: "POST",
        headers: {},
        body,
        timeout: 60000,
        attempts: 4,
        retryDelayMultiplier: 2000,
        _label: "Create session"
      });
      hasSavedOrSubmitted.current = true;
      clearDraft();
      if (source) {
        incRepoStat(source);
        saveLastSource(source);
        saveLastBranch(source, branch || defaultBranch || "main");
      }
      onCreate(d);
    } catch (err) { setErr(err.message); setSub(false); }
  };

  return {
    draft,
    sources, setSources,
    loadingSrc, setLoadSrc,
    source, setSource,
    sourceSearch, setSourceSearch,
    showSources, setShowSources,
    branch, setBranch,
    branches, setBranches,
    showBranches, setShowBranches,
    defaultBranch, setDefault,
    prompt, setPrompt,
    autoMode, setAutoMode,
    reqApproval, setReqApp,
    selectedPersonas, setSelectedPersonas,
    leanMode, setLeanMode, toggleLeanMode,
    submitting, setSub,
    err, setErr,
    savedFlash, setSavedFlash,
    expanded, setExpanded,
    showConfirm, setShowConfirm,
    sourceInteracted, setSourceInteracted,
    srcObj,
    getSourceDisplay,
    filteredSources,
    filteredBranches,
    togglePersona,
    handleClearDraft,
    handleSaveToBox,
    handleCreate
  };
};
