const ExpandableContent = memo(({ text, limit = 300, showCopy = false, forceExpanded = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const isOverScroll = ref.current && ref.current.scrollHeight > limit;
    const isOverLength = text && text.length > limit;
    if (isOverScroll || isOverLength) setShowToggle(true);
  }, [text, limit]);

  useEffect(() => {
    if (forceExpanded) {
      setExpanded(true);
    }
  }, [forceExpanded]);

  const handleCopy = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (copied) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{position:"relative"}}>
      <div ref={ref} style={{
        maxHeight: expanded ? "none" : limit,
        overflow: "hidden",
        position: "relative",
        transition: "max-height .4s cubic-bezier(0.4, 0, 0.2, 1)"
      }}>
        <div style={{
          animation: expanded ? "shimmerPulse 0.8s ease-out" : "none"
        }}>
          <Markdown text={text} />
        </div>
        {!expanded && showToggle && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: `linear-gradient(transparent, ${T.surfaceHi} 90%)`,
            pointerEvents: "none", display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 8
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              onMouseDown={e => e.currentTarget.style.transform = "translateY(6px) scale(0.96)"}
              onMouseUp={e => e.currentTarget.style.transform = "translateY(4px) scale(1)"}
              style={{
                background: T.brand, color: "#000", border: "none", cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 900,
                padding: "6px 14px", borderRadius: 20, display: "flex", alignItems:"center", gap: 6,
                boxShadow: `0 8px 20px ${T.brand}40`, pointerEvents: "auto",
                transform: "translateY(4px)", animation: "fadeIn .3s ease",
                transition: "transform .1s cubic-bezier(0.2, 0, 0.2, 1)"
              }}
            >
              READ FULL MESSAGE <Ic n="chevron_down" s={12} c="#000" />
            </button>
          </div>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:8 }}>
        {expanded && showToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            style={{
              background: "none", border: "none", color: T.dim, cursor: "pointer",
              fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700,
              padding: 0, display: "flex", alignItems:"center", gap: 4, opacity: 0.8
            }}
          >
            SHOW LESS <Ic n="chevron_up" s={12} c={T.dim} />
          </button>
        )}
        {showCopy && (
          <>
            <div style={{ color: T.textDim, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 600, opacity: 0.8 }}>{fmtChars(text?.length || 0)}</div>
            <button
              onClick={handleCopy}
              style={{
                background: "none", border: "none", color: copied ? T.brand : T.muted, cursor: "pointer",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 11, fontWeight: 700,
                padding: 0, display: "flex", alignItems:"center", gap: 4, transition: "color .2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <Ic n="copy" s={12} c={copied ? T.brand : T.muted} />
              {copied ? "COPIED" : "COPY"}
            </button>
          </>
        )}
      </div>
    </div>
  );
});

const Markdown = memo(({ text }) => {
  if (!text) return null;
  const rawParts = text.split(/```/g);
  const parts = rawParts.map((part, i) => i % 2 === 0 ? formatSmartDashItems(part) : part);
  return parts.map((part, i) => {
    if (i % 2 === 1) { // Code block
      const lines = part.split("\n");
      let lang = lines[0].trim();
      let content = lines.slice(1).join("\n").trim();
      if (!content && lines.length > 0) { content = lines.join("\n").trim(); lang = ""; }

      return (
        <div key={i} style={{
          margin:"10px 0", background:"#040507", border:`1px solid ${T.border}`,
          borderRadius:6, overflow:"hidden", fontFamily:"'JetBrains Mono',monospace", fontSize:13,
        }}>
          {lang && (
            <div style={{padding:"4px 10px", background:T.surface, borderBottom:`1px solid ${T.border}33`, fontSize:11, color:T.textDim, textTransform:"uppercase", letterSpacing:"0.05em"}}>
              {lang}
            </div>
          )}
          <div style={{padding:"12px", color:T.text, whiteSpace:"pre-wrap", overflowWrap:"break-word", wordBreak:"break-word"}}>
            {content}
          </div>
        </div>
      );
    }

    // Process lists and bold text in standard text parts
    const lines = part.split("\n");
    return (
      <span key={i} style={{whiteSpace:"pre-wrap", overflowWrap:"break-word", wordBreak:"break-word"}}>
        {lines.map((line, li) => {
          const trimmed = line.trim();
          if (!trimmed && li > 0 && li < lines.length - 1) return <div key={li} style={{height: 12}} />;
          if (!trimmed) return <div key={li} />;

          const isListItem = trimmed.startsWith("- ") || trimmed.startsWith("* ");
          const isNumItem = /^\d+\.\s/.test(trimmed);
          const isHeader = trimmed.endsWith(":") && !isListItem && !isNumItem && trimmed.length < 80;

          // Support for math formulas, inline code, and **bold** text
          const formatInlineText = (txt) => {
            if (typeof txt !== "string" || !txt) return txt;

            if (txt.includes("$$")) {
              const parts = txt.split("$$");
              return parts.map((part, idx) => {
                if (idx % 2 === 1) {
                  return (
                    <span
                      key={`math-block-${idx}`}
                      style={{
                        display: "block",
                        margin: "8px 0",
                        padding: "8px 12px",
                        background: "#040507",
                        border: `1px solid ${T.brand}40`,
                        borderRadius: 6,
                        color: T.brandLight,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "0.02em"
                      }}
                    >
                      {cleanMathText(part.trim())}
                    </span>
                  );
                }
                return formatInlineText(part);
              });
            }

            if (txt.includes("`")) {
              const parts = txt.split("`");
              return parts.map((part, idx) => {
                if (idx % 2 === 1) {
                  return (
                    <code
                      key={`code-${idx}`}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        color: T.brandLight,
                        background: `${T.brand}15`,
                        border: `1px solid ${T.brand}30`,
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700
                      }}
                    >
                      {part}
                    </code>
                  );
                }
                return formatInlineText(part);
              });
            }

            if (txt.includes("$")) {
              const parts = txt.split("$");
              // Only treat as inline math if there are paired $ delimiters (odd number of split parts)
              if (parts.length > 1 && parts.length % 2 === 1) {
                return parts.map((part, idx) => {
                  if (idx % 2 === 1) {
                    return (
                      <span
                        key={`math-inline-${idx}`}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          color: T.brandLight,
                          background: `${T.brand}18`,
                          border: `1px solid ${T.brand}40`,
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.03em"
                        }}
                        title="Mathematical Formula"
                      >
                        {cleanMathText(part)}
                      </span>
                    );
                  }
                  return formatInlineText(part);
                });
              }
            }

            if (txt.includes("**")) {
              const segments = txt.split("**");
              return segments.map((seg, si) =>
                si % 2 === 1 ? (
                  <strong key={`bold-${si}`} style={{ color: T.textHi, fontWeight: 700 }}>
                    {seg}
                  </strong>
                ) : (
                  seg
                )
              );
            }

            return cleanMathText(txt);
          };

          let content = line;

          if (isListItem) {
            const bullet = trimmed.startsWith("- ") ? "- " : "* ";
            const rest = trimmed.substring(bullet.length);
            content = (
              <div style={{display:"flex", gap:12, marginBottom:8, paddingLeft:4, alignItems:"flex-start"}}>
                <div style={{width:6, height:6, borderRadius:"50%", background:T.brand, marginTop:7, flexShrink:0, boxShadow:`0 0 10px ${T.brand}60`}}/>
                <span style={{flex:1, color:T.text, lineHeight:1.6}}>{formatInlineText(rest)}</span>
              </div>
            );
          } else if (isNumItem) {
            const match = trimmed.match(/^(\d+\.\s)(.*)/);
            const num = match[1];
            const rest = match[2];
            content = (
              <div style={{display:"flex", gap:8, marginBottom:8, paddingLeft:2, alignItems:"flex-start"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900, color:T.brandLight, flexShrink:0, width:22}}>{num}</span>
                <span style={{flex:1, color:T.text, lineHeight:1.6}}>{formatInlineText(rest)}</span>
              </div>
            );
          } else if (isHeader) {
            content = (
              <div style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:900,
                color:T.brandLight, letterSpacing:"0.08em", marginTop:li===0?0:22, marginBottom:12,
                textTransform:"uppercase", borderBottom:`2px solid ${T.brand}25`,
                display:"inline-block", paddingBottom:4
              }}>{formatInlineText(trimmed)}</div>
            );
          } else {
            content = <div style={{lineHeight:1.6, color:T.textDim, marginBottom:4}}>{formatInlineText(line)}</div>;
          }

          return <div key={li}>{content}</div>;
        })}
      </span>
    );
  });
});
