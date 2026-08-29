const ACTIVITY_LINKS_CACHE = new WeakMap();

const getExtractedLinks = (pu) => {
  if (!pu) return null;
  if (ACTIVITY_LINKS_CACHE.has(pu)) return ACTIVITY_LINKS_CACHE.get(pu);

  const desc = pu.description;
  if (!desc) {
    ACTIVITY_LINKS_CACHE.set(pu, null);
    return null;
  }

  const prMatch = desc.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/(\d+)/);
  const commitMatch = desc.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/commit\/([a-f0-9]{7,40})/);
  const branchMatch = desc.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/tree\/([a-zA-Z0-9\-_]+)/);

  const res = prMatch || commitMatch || branchMatch ? { prMatch, commitMatch, branchMatch } : null;
  ACTIVITY_LINKS_CACHE.set(pu, res);
  return res;
};

const inputSt = {
  width:"100%",background:T.surfaceHi,border:`1px solid ${T.border}`,borderRadius:6,
  padding:"10px 12px",color:T.text,fontFamily:"'IBM Plex Sans',sans-serif",fontSize:15,
  outline:"none",boxSizing:"border-box",transition:"border-color .18s cubic-bezier(0.4, 0, 0.2, 1)",
};

// ─── Media Artifacts ──────────────────────────────────────────────────────────
const MediaArtifacts = memo(({ artifacts, ts, onMediaClick }) => {
  const mediaItems = (artifacts || []).filter(a => a.media?.data);
  if (mediaItems.length === 0) return null;

  return (
    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
      {mediaItems.map((a, i) => {
        const mime = safeMediaMimeType(a.media?.mimeType);
        const base64Data = safeMediaBase64(a.media?.data);
        const isVideo = mime.startsWith("video/");
        return (
          <button
            key={i}
            onClick={() => onMediaClick?.({ ...a.media, data: base64Data, mimeType: mime, ts })}
            style={{
              padding:0, border:`1px solid ${T.border}`, borderRadius:6,
              background:T.surfaceHi, cursor:"pointer", overflow:"hidden",
              width:100, height:70, display:"flex", alignItems:"center",
              justifyContent:"center", transition:"border-color .15s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.brand}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            {isVideo ? (
              <video
                src={`data:${mime};base64,${base64Data}`}
                muted autoPlay loop playsInline
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            ) : (
              <img
                src={`data:${mime};base64,${base64Data}`}
                alt="artifact-thumb"
                style={{ width:"100%", height:"100%", objectFit:"cover" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
});

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = memo(({ act, type, onMediaClick, onEdit, onReply, forceExpanded = false }) => {
  const isUser = type === "userMessaged";
  const text   = isUser ? act.userMessaged?.userMessage : act.agentMessaged?.agentMessage;
  const time   = fmtTime(parseDateMs(act.createTime));
  const isTemp = act._temp === true;
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (copied) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const key = getActKey(act);

  return (
    <div id={`chat-activity-${key}`} style={{ marginBottom: 24, width: "100%", animation: "fadeIn .25s ease-out" }}>
      {/* Header Accent Row */}
      <div style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
        color: isUser ? T.blue : T.brand, fontWeight: 800,
        letterSpacing: "0.1em", marginBottom: 12,
        display: "flex", alignItems: "center", gap: 8
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: isUser ? T.blueDim : T.brandDim,
          border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 900,
          color: isUser ? T.blue : T.brandLight, flexShrink: 0
        }}>{isUser ? "U" : "J"}</div>
        <span>{isUser ? "USER MESSAGE" : "JULES RESPONSE"}</span>
        <div style={{ height: 1, flex: 1, background: isUser ? `${T.blue}20` : `${T.brand}20` }}/>
        <span style={{ color: T.textDim, fontSize: 10, fontWeight: 500 }}>{isTemp ? "sending..." : time}</span>
      </div>

      {/* Structured Expandable Card */}
      <div style={{
        background: "transparent", border: "none",
        borderLeft: `3px solid ${isUser ? T.blue : T.brand}`,
        borderRadius: 0, padding: "12px 0 12px 20px", position: "relative",
        boxShadow: "none", transition: "all .2s cubic-bezier(0.4, 0, 0.2, 1)",
        width: "100%", opacity: isTemp ? 0.6 : 1
      }}>
        <div style={{
          fontSize: 16, color: T.text, lineHeight: 1.6,
          fontFamily: "'IBM Plex Sans',sans-serif",
        }}>
          <ExpandableContent text={text} limit={400} forceExpanded={forceExpanded} />
        </div>

        <MediaArtifacts artifacts={act.artifacts} ts={act.createTime} onMediaClick={onMediaClick}/>

        {/* Footer Actions Strip */}
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}33`,
          fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
          color: isUser ? T.blue + "70" : T.brand + "60",
          display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap"
        }}>
          <span style={{ fontWeight: 800, letterSpacing: "0.05em", color: isUser ? T.blue : T.brandLight }}>
            {isUser ? "YOU" : "JULES"}
          </span>
          <span>·</span>
          <span style={{ opacity: 0.8 }}>{fmtChars(text?.length || 0)}</span>

          {!isTemp && (
            <>
              <span>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(); }}
                style={{
                  background: "none", border: "none", padding: "0 2px", cursor: "pointer",
                  color: copied ? T.brand : T.muted, fontWeight: 800, fontSize: 10, letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 4, transition: "color .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <Ic n="copy" s={11} c={copied ? T.brand : T.muted}/>
                {copied ? "COPIED" : "COPY"}
              </button>
            </>
          )}

          {onReply && !isUser && !isTemp && (
            <>
              <span>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); onReply(act, "JULES"); }}
                style={{
                  background: "none", border: "none", padding: "0 2px", cursor: "pointer",
                  color: T.brandLight, fontWeight: 800, fontSize: 10, letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 4, transition: "color .2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <Ic n="reply" s={11} c={T.brandLight}/>
                REPLY
              </button>
            </>
          )}

          {isUser && !isTemp && onEdit && (
            <>
              <span>·</span>
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(text); }}
                style={{
                  background: "none", border: "none", padding: "0 2px", cursor: "pointer",
                  color: T.brand, fontWeight: 800, fontSize: 10, letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", gap: 4
                }}
              >
                EDIT
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Timeline Event (non-message activities) ──────────────────────────────────
const TimelineEvent = memo(({ act, onMediaClick, onReply }) => {
  const type = getActType(act);
  const isMajor = ["sessionCompleted", "sessionFailed", "planGenerated", "planApproved"].includes(type);
  const desc = act.progressUpdated?.description || "";
  const isPush = type === "progressUpdated" && (desc.toLowerCase().includes("pushed") || desc.toLowerCase().includes("pushing"));

  const IC_MAP = {
    planGenerated:{n:"plan",c:T.purple},
    planApproved:{n:"approve",c:T.brandLight},
    progressUpdated:{n:isPush?"branch":"refresh",c:isPush?T.blue:T.muted},
    sessionCompleted:{n:"check",c:T.brandLight},
    sessionFailed:{n:"x",c:T.red},
    system:{n:"code",c:T.muted},
  };
  const ic  = { ...(IC_MAP[type] || IC_MAP.system) };
  const time = fmtTime(parseDateMs(act.createTime));

  let title = "", detail = null;
  switch (type) {
    case "planGenerated": {
      const plan = act.planGenerated?.plan;
      title = "Plan generated";
      detail = plan?.steps && (
        <div style={{marginTop:10}}>
          {plan.steps.map((st,i) => (
            <div key={st.id||i} style={{display:"flex",gap:8,marginBottom:12,alignItems:"flex-start"}}>
              <div style={{
                width:20,height:20,borderRadius:3,flexShrink:0,
                background:T.purpleDim,border:`1px solid ${T.purple}40`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.purple,
                marginTop: 1,
              }}>{i+1}</div>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{fontSize:14,color:T.text,fontWeight:700,lineHeight:1.5,wordBreak:"break-word",marginBottom:4}}>{st.title}</div>
                {st.description&&<div style={{fontSize:13,color:T.textDim,lineHeight:1.6,wordBreak:"break-word"}}>{st.description}</div>}
              </div>
            </div>
          ))}
        </div>
      );
      break;
    }
    case "progressUpdated": {
      const p = act.progressUpdated;
      const lowerT = (p?.title || "").toLowerCase();
      const isReview = lowerT.includes("review");
      const isMerge = lowerT.includes("merge");
      const isResearch = lowerT.includes("research");
      const isPush = lowerT.includes("pushed") || lowerT.includes("pushing");
      const highlight = isReview || isMerge || isResearch || isPush;
      title = p?.title || "Progress";
      detail = act.progressUpdated?.description && (
        <div style={{
          fontSize:14, color:highlight?T.text:T.muted,
          lineHeight:isReview?1.75:1.6, padding:highlight?"20px 24px":"0",
          background:isReview?`linear-gradient(165deg, ${T.brand}0d, ${T.surface}44)` : isMerge?`${T.purple}0a`:isResearch?`${T.amber}0a`:isPush?`${T.blue}0a`:"transparent",
          border:isReview?`1px solid ${T.brand}35`:isMerge?`1px solid ${T.purple}15`:isResearch?`1px solid ${T.amber}15`:isPush?`1px solid ${T.blue}15`:"none",
          borderRadius:highlight?12:0,
          boxShadow:isReview?`0 16px 48px ${T.brandDark}15, inset 0 0 20px ${T.brand}05` : (highlight?"inset 0 0 12px rgba(255,255,255,0.01)":"none"),
          fontFamily:"'IBM Plex Sans',sans-serif",
          letterSpacing:isReview?"0.015em":"0",
        }}>
          {highlight && (
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:12}}>
              <span style={{
                padding:"2px 6px", borderRadius:3,
                background:isReview?T.brandDim:(isMerge?T.purpleDim:(isResearch?T.amberDim:(isPush?T.blueDim:T.muted))),
                color:isReview?T.brandLight:(isMerge?T.purple:(isResearch?T.amber:(isPush?T.blue:T.muted))),
                fontSize:10, fontWeight:800, letterSpacing:"0.05em"
              }}>{isReview?"REVIEW":isMerge?"MERGE":isResearch?"RESEARCH":isPush?"PUSH":"EVENT"}</span>
              <div style={{height:1, flex:1, background:`linear-gradient(90deg, ${isReview?T.brandLight:(isMerge?T.purple:(isResearch?T.amber:(isPush?T.blue:T.muted)))}30, transparent)`}}/>
            </div>
          )}
          <Markdown text={act.progressUpdated.description}/>
          {(() => {
            const links = getExtractedLinks(act.progressUpdated);
            if (!links) return null;

            if (links.prMatch) return (
              <div style={{marginTop:12}}>
                <a href={safeUrl(links.prMatch[0])} target="_blank" rel="noopener noreferrer" style={{
                  display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px",
                  background:T.brandDim, border:`1px solid ${T.brand}40`, borderRadius:6,
                  color:T.brand, textDecoration:"none", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:12, fontWeight:800
                }}>
                  <Ic n="git_pull" s={14} c={T.brand}/>
                  OPEN PULL REQUEST #{links.prMatch[1]} ↗
                </a>
              </div>
            );

            if (links.commitMatch) return (
              <div style={{marginTop:12}}>
                <a href={safeUrl(links.commitMatch[0])} target="_blank" rel="noopener noreferrer" style={{
                  display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px",
                  background:T.blueDim, border:`1px solid ${T.blue}40`, borderRadius:6,
                  color:T.blue, textDecoration:"none", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:12, fontWeight:800
                }}>
                  <Ic n="code" s={14} c={T.blue}/>
                  VIEW COMMIT {links.commitMatch[1].slice(0,7)} ↗
                </a>
              </div>
            );

            if (links.branchMatch) return (
              <div style={{marginTop:12}}>
                <a href={safeUrl(links.branchMatch[0])} target="_blank" rel="noopener noreferrer" style={{
                  display:"inline-flex", alignItems:"center", gap:6, padding:"6px 12px",
                  background:T.blueDim, border:`1px solid ${T.blue}40`, borderRadius:6,
                  color:T.blue, textDecoration:"none", fontFamily:"'JetBrains Mono',monospace",
                  fontSize:12, fontWeight:800
                }}>
                  <Ic n="branch" s={14} c={T.blue}/>
                  BROWSE BRANCH {links.branchMatch[1]} ↗
                </a>
              </div>
            );
          })()}
        </div>
      );
      if (isReview) { ic.c = T.brand; ic.n = "tasks"; }
      if (isMerge) { ic.c = T.purple; ic.n = "git_merge"; }
      if (isResearch) { ic.c = T.amber; ic.n = "search"; }
      break;
    }
    case "sessionCompleted": {
      title = "Session completed";
      const rawPr = act.sessionCompleted?.outputs?.find(o => o.githubPullRequest)?.githubPullRequest;
      const pr = getPrUrlAndNumber(rawPr);
      detail = (
        <div style={{marginTop:8, display:"flex", gap:10, flexWrap:"wrap"}}>
          {pr && (
            <a href={safeUrl(pr.url)} target="_blank" rel="noopener noreferrer" style={{
              display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px",
              background:T.brandDim, border:`1px solid ${T.brand}60`, borderRadius:8,
              color:T.brandLight, textDecoration:"none", fontFamily:"'JetBrains Mono',monospace",
              fontSize:12, fontWeight:800, boxShadow:`0 4px 15px ${T.brand}20`
            }}>
              <Ic n="git_pull" s={14} c={T.brandLight}/>
              VIEW PULL REQUEST #{pr.number}
            </a>
          )}
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8, padding:"10px 18px",
            background:`linear-gradient(135deg, ${T.brand}20, ${T.surfaceHi})`,
            border:`1px solid ${T.brand}50`, borderRadius:10,
            color:T.brandLight, fontFamily:"'JetBrains Mono',monospace",
            fontSize:12, fontWeight:900, textTransform: "uppercase",
            boxShadow:`0 4px 15px ${T.brand}15, inset 0 0 10px ${T.brand}10`,
            animation:"fadeIn .4s ease-out"
          }}>
            <Ic n="check" s={16} c={T.brandLight}/>
            SESSION FINISHED
          </div>
        </div>
      );
      break;
    }
    case "sessionFailed":
      title = "Session failed";
      detail = act.sessionFailed?.reason && (
        <div style={{fontSize:13,color:T.red,marginTop:6,fontFamily:"'IBM Plex Sans',sans-serif",lineHeight:1.5}}>{act.sessionFailed.reason}</div>
      );
      break;
    case "planApproved": title = "Plan approved"; break;
    default: title = act.description || "System event"; break;
  }

  return (
    <div style={{
      display:"flex",gap:12,marginBottom:16,alignItems:"stretch",
      padding:isMajor?"14px":"4px 12px", borderRadius:8,
      background:isMajor?T.surfaceHi:"transparent",
      border:isMajor?`1px solid ${T.border}`:"none",
      position:"relative",
    }}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:0,flexShrink:0,width:24}}>
        <div style={{width:24,height:24,borderRadius:6,background:`${ic.c}18`,border:`1px solid ${ic.c}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"none"}}>
          <Ic n={ic.n} s={13} c={ic.c}/>
        </div>
        {detail&&<div style={{width:1,flex:1,background:T.border,marginTop:3}}/>}
      </div>
      <div style={{flex:1,paddingBottom:detail?12:0,minWidth:0,marginTop:1}}>
        <div style={{display:"flex",gap:10,alignItems:"center",minHeight:22,marginBottom:detail?12:0}}>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:isMajor?13:12,
            fontWeight:isMajor?900:800, color:ic.c, flex:1, lineHeight:1.3,
            letterSpacing:"0.04em", textTransform:isMajor?"uppercase":"none",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"
          }}>{title}</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:T.textDim,fontWeight:600,flexShrink:0}}>{time}</span>
        </div>
        {detail}
        <MediaArtifacts artifacts={act.artifacts} ts={act.createTime} onMediaClick={onMediaClick}/>

        {onReply && (
          <div style={{marginTop:6, display:"flex", justifyContent:"flex-end"}}>
            <button
              onClick={(e) => { e.stopPropagation(); onReply(act, title.toUpperCase()); }}
              style={{
                background:"none", border:"none", padding:"2px 6px", cursor:"pointer",
                color:T.brandLight, fontWeight:800, fontSize:9, letterSpacing:"0.05em",
                display:"inline-flex", alignItems:"center", gap:4, transition: "color .2s cubic-bezier(0.4, 0, 0.2, 1)",
                opacity: 0.8
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "1"}
              onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}
            >
              <Ic n="reply" s={10} c={T.brandLight}/>
              REPLY TO EVENT
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Media Modal ──────────────────────────────────────────────────────────────
const MediaModal = ({ media, onClose }) => {
  if (!media) return null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const mime = safeMediaMimeType(media.mimeType);
  const base64Data = safeMediaBase64(media.data);

  const handleDownload = (e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = `data:${mime};base64,${base64Data}`;
    link.download = `jules-artifact-${Date.now()}.${mime.split("/")[1] || "png"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isVideo = mime.startsWith("video/");
  const dataSize = base64Data ? base64Data.length * 0.75 : 0; // Approx base64 to bytes

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:10000,
        background:"rgba(4,5,7,0.95)", backdropFilter:"blur(10px)",
        display:"flex", flexDirection:"column",
        animation:"fadeIn .2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>

      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"16px 20px",
        background:"linear-gradient(to bottom, rgba(7,9,12,0.8), transparent)",
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:T.text, fontWeight:700 }}>
            MEDIA ARTIFACT
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.textDim }}>
            {mime} · {fmtBytes(dataSize/1024)} · {fmtTime(parseDateMs(media.ts))}
          </div>
        </div>
        <button
          onClick={handleDownload}
          title="Save Artifact"
          aria-label="Save Artifact"
          style={{
            background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:8,
            padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            color:T.brand, fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700,
          }}
        >
          <Ic n="download" s={14} c={T.brand}/>
          SAVE
        </button>
        <button
          onClick={onClose}
          title="Close Preview"
          aria-label="Close Preview"
          style={{
            background:T.surfaceHi, border:`1px solid ${T.borderHi}`, borderRadius:8,
            padding:"8px", cursor:"pointer", display:"flex",
          }}
        >
          <Ic n="x" s={18} c={T.text}/>
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:20, overflow:"hidden",
      }}>
        {isVideo ? (
          <video
            src={`data:${mime};base64,${base64Data}`}
            controls autoPlay loop playsInline
            style={{
              maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
              borderRadius:4, boxShadow:"0 20px 50px rgba(0,0,0,0.5)",
              animation:"zoomIn .25s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img
            src={`data:${mime};base64,${base64Data}`}
            alt="artifact-preview"
            style={{
              maxWidth:"100%", maxHeight:"100%", objectFit:"contain",
              borderRadius:4, boxShadow:"0 20px 50px rgba(0,0,0,0.5)",
              animation:"zoomIn .25s cubic-bezier(0.2, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Footer / Hint */}
      <div style={{
        padding:20, textAlign:"center", fontFamily:"'JetBrains Mono',monospace",
        fontSize:11, color:T.textDim, letterSpacing:"0.05em",
      }}>
        TAP OUTSIDE TO CLOSE
      </div>
    </div>
  );
};

// ─── Activity Feed ────────────────────────────────────────────────────────────
const COLLAPSE_THRESHOLD = 35;
const COLLAPSE_SHOW      = 25;

const ActivityFeed = memo(({ activities, showAll, onShowAll, onMediaClick, onEditMessage, onReply, driftSessions = [], justUpdated = false, scrolledActivityId = null }) => {
  const collapse  = !showAll && activities.length > COLLAPSE_THRESHOLD;

  // OPTIMIZATION: Memoize the sliced visible activities array. Since activities is reference-stable
  // and collapse is a boolean, memoizing the slice prevents recreating a new array reference on
  // every render. This prevents downstream useMemo hooks (deduped, combined) from being re-evaluated
  // during active countdown ticks or parent polling ticks.
  const visible   = useMemo(() => {
    return collapse ? activities.slice(activities.length - COLLAPSE_SHOW) : activities;
  }, [activities, collapse]);

  const hidden    = activities.length - visible.length;

  const deduped = useMemo(() => {
    const list = [];
    let lastPKey = null;
    let lastType = null;
    for (const a of visible) {
      const type = getActType(a);
      if (type === "planApproved" && lastType === "planApproved") continue;
      if (type === "sessionCompleted" && lastType === "sessionCompleted") continue;

      if (a.progressUpdated) {
        const p = a.progressUpdated;
        const pKey = `${p.title || ""}:${p.description || ""}`;
        if (lastPKey === pKey) continue;
        lastPKey = pKey;
      } else {
        lastPKey = null;
      }
      list.push(a);
      lastType = type;
    }
    return list;
  }, [visible]);

  const combined = useMemo(() => {
    const list = [...deduped.map(a => ({ type: "activity", data: a, ts: parseDateMs(a.createTime) }))];
    driftSessions.forEach(s => {
      list.push({ type: "drift", data: s, ts: parseDateMs(s.updateTime || s.createTime) });
    });
    return list.sort((a, b) => a.ts - b.ts);
  }, [deduped, driftSessions]);

  return (
    <>
      {collapse && (
        <button onClick={onShowAll} style={{
          display:"block",width:"100%",marginBottom:14,
          background:T.surfaceHi,border:`1px solid ${T.border}`,
          borderRadius:6,padding:"8px 12px",cursor:"pointer",
          fontFamily:"'JetBrains Mono',monospace",fontSize:11,
          color:T.textDim,textAlign:"center",letterSpacing:"0.08em",
        }}>
          ↑ SHOW {hidden} EARLIER {hidden===1?"EVENT":"EVENTS"}
        </button>
      )}
      {combined.map((item, idx) => {
        if (item.type === "drift") {
          return (
            <div key={`drift-${item.data.id}-${idx}`} style={{
              margin: "12px 0 20px", padding: "10px 14px", background: "rgba(252, 211, 77, 0.03)",
              border: `1px dashed ${T.amber}30`, borderRadius: 8, display: "flex", gap: 10, alignItems: "center"
            }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.amberDim, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.amber}40` }}>
                <Ic n="wifi" s={11} c={T.amber}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: T.amber, letterSpacing: "0.05em",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }} title={item.data.title || item.data.prompt}>
                  BASE DRIFT · {item.data.title || item.data.prompt}
                </div>
                <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11, color: T.dim }}>
                  Merged {fmtAgo(item.ts)}
                </div>
              </div>
            </div>
          );
        }
        const act = item.data;
        const type = getActType(act);
        const key  = getActKey(act);
        if (type === "userMessaged" || type === "agentMessaged") {
          return <ChatBubble key={key} act={act} type={type} onMediaClick={onMediaClick} onEdit={onEditMessage} onReply={onReply} forceExpanded={scrolledActivityId === key}/>;
        }
        return (
          <div key={key} id={`chat-activity-${key}`} style={{
            animation: justUpdated && idx >= combined.length - 5 ? "shimmerPulse 0.8s ease-out" : "none"
          }}>
            <TimelineEvent act={act} onMediaClick={onMediaClick} onReply={onReply}/>
          </div>
        );
      })}
    </>
  );
});

// ─── Interactive Plan View ────────────────────────────────────────────────────
// Lets the user review steps, annotate individual ones, compose a revision
// request via sendMessage, or approve the plan directly.
