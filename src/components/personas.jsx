const React = window.React || globalThis.React;

const MultiPersonaPicker = ({ personas, selectedIds, onToggle, style: s = {} }) => {
  const scrollRef = React.useRef(null);
  const clickPrevented = React.useRef(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;

    const onWheel = (e) => {
      try {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          const canScrollLeft = el.scrollLeft > 0;
          const canScrollRight = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth;

          if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
            e.preventDefault();
            el.scrollLeft += e.deltaY;
          }
        }
      } catch (err) {
        console.error("[MultiPersonaPicker] onWheel error:", err);
      }
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      clickPrevented.current = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeftStart = el.scrollLeft;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (e.pointerType === 'touch') return;

      try {
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.5;
        if (Math.abs(walk) > 5) {
          clickPrevented.current = true;
          el.scrollLeft = scrollLeftStart - walk;
        }
      } catch (err) {
        console.error("[MultiPersonaPicker] onPointerMove error:", err);
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        clickPrevented.current = false;
      }, 50);
    };

    const onPointerLeave = () => {
      isDragging = false;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  const handleToggle = (id, e) => {
    try {
      if (clickPrevented.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onToggle(id);
    } catch (err) {
      console.error("[MultiPersonaPicker] handleToggle error:", err);
    }
  };

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label="Focus roles selection"
      style={{
        display: "flex", gap: 5, overflowX: "auto", padding: "2px 2px",
        scrollbarWidth: "none", WebkitOverflowScrolling: "touch",
        ...s
      }}
    >
      {personas.map(p => {
        const isSelected = selectedIds.has(p.id);
        return (
          <button
            key={p.id}
            onClick={(e) => handleToggle(p.id, e)}
            title={`Toggle focus role: ${p.label}${isSelected ? " (Selected)" : ""}`}
            aria-label={`Toggle focus role: ${p.label}`}
            aria-pressed={isSelected ? "true" : "false"}
            style={{
              flexShrink: 0, minHeight: 36, padding: "0 14px", borderRadius: 20,
              background: isSelected ? `${p.color}20` : T.surfaceHi,
              border: `1px solid ${isSelected ? p.color : T.border}`,
              color: isSelected ? p.color : T.muted,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
              fontWeight: isSelected ? 800 : 500, letterSpacing: "0.05em",
              cursor: "pointer", transition: "all .15s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
              boxShadow: "none",
            }}
          >
            {isSelected && <span style={{ width: 4, height: 4, borderRadius: "50%", background: p.color }} />}
            {p.label}
          </button>
        );
      })}
    </div>
  );
};

const ExpandablePersonaPrompt = ({ prompt, limit = 120 }) => {
  const [expanded, setExpanded] = React.useState(false);
  const promptLength = React.useMemo(() => Array.from(prompt || "").length, [prompt]);
  const isLong = promptLength > limit;

  if (!isLong) {
    return (
      <div style={{fontSize:13, color:T.textDim, lineHeight:1.5, fontFamily:"'IBM Plex Sans',sans-serif", whiteSpace: "pre-wrap", wordBreak: "break-word"}}>
        {prompt}
      </div>
    );
  }

  const displayedText = expanded ? prompt : safeSlice(prompt, limit);

  return (
    <div style={{fontSize:13, color:T.textDim, lineHeight:1.5, fontFamily:"'IBM Plex Sans',sans-serif"}}>
      <span style={{whiteSpace: "pre-wrap", wordBreak: "break-word"}}>{displayedText}</span>
      {!expanded && <span style={{color: T.dim}}>...</span>}
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded ? "true" : "false"}
        aria-label={expanded ? "Show less system prompt" : "Show full system prompt"}
        title={expanded ? "Show less system prompt" : "Show full system prompt"}
        style={{
          background: "none",
          border: "none",
          color: T.brand,
          cursor: "pointer",
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          fontWeight: 800,
          padding: "0 0 0 6px",
          letterSpacing: "0.05em",
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          transition: "color .15s ease",
          outline: "none"
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.brandLight}
        onMouseLeave={e => e.currentTarget.style.color = T.brand}
      >
        {expanded ? "SEE LESS" : "SEE MORE"}
      </button>
    </div>
  );
};
