const QuotaTimeline = ({ todayCount, plan }) => {
  const [now, setNow] = useState(Date.now());
  const [zoomHours, setZoomHours] = useState(12); // Default 12h window

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);

  const windowStart = now - (zoomHours / 2) * 3600000;
  const windowEnd = now + (zoomHours / 2) * 3600000;
  const totalWidth = zoomHours * 3600000;

  const getPos = (ts) => ((ts - windowStart) / totalWidth) * 100;

  const events = [
    ...(todayCount.recentResets || []).map(r => ({ ts: r.ts, type: "recent" })),
    ...(todayCount.upcomingResets || []).map(r => ({ ts: r.ts, type: "upcoming" })),
  ].filter(e => e.ts >= windowStart && e.ts <= windowEnd)
   .sort((a, b) => a.ts - b.ts);

  // Pinch-to-zoom support
  const touchStartDist = useRef(null);
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDist.current = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const ratio = touchStartDist.current / dist;
      const nextZoom = Math.max(1, Math.min(24, zoomHours * ratio));
      setZoomHours(nextZoom);
      touchStartDist.current = dist;
    }
  };

  // Smart Collision Avoidance (Staggered Height)
  const labelSlots = events.map(e => ({ ...e, pos: getPos(e.ts) }));
  labelSlots.forEach((e, i) => {
    const isNearNow = Math.abs(e.pos - 50) < 12;
    const prev = labelSlots[i-1];

    // Base offsets: Stagger top/bottom unless near NOW (where we only stack bottom)
    let v = isNearNow ? 20 : (i % 2 === 0 ? -18 : 18);

    if (prev && Math.abs(e.pos - prev.pos) < 15) {
      // Collision detected with previous label
      if (isNearNow) {
        // Near center 'NOW' marker: Stack deeply downwards
        // Hierarchical offsets: 20, 38, 56...
        let collisionCount = 0;
        for (let j = i - 1; j >= 0; j--) {
          if (Math.abs(e.pos - labelSlots[j].pos) < 15 && Math.abs(labelSlots[j].pos - 50) < 12) collisionCount++;
          else break;
        }
        v = 20 + (collisionCount * 20);
      } else {
        // Outside center: Try to flip or push further
        if (Math.sign(v) === Math.sign(prev.vOffset)) {
          v = prev.vOffset + (20 * Math.sign(v));
        }
      }
    }
    e.vOffset = v;
  });

  const zoomH = Math.round(zoomHours);

  return (
    <div style={{ marginTop: 24, marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim, fontWeight: 800, letterSpacing: "0.05em" }}>
        <span>-{zoomH/2}H</span>
        <span style={{ color: T.brand, opacity: 0.8 }}>NOW</span>
        <span>+{zoomH/2}H</span>
      </div>

      <div
        style={{ position: "relative", height: 60, display: "flex", alignItems: "center", touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Track */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: T.border, borderRadius: 1 }} />
        <div style={{ position: "absolute", left: 0, width: "50%", height: 2, background: `linear-gradient(to right, transparent, ${T.brand}40)`, borderRadius: 1 }} />

        {/* Graduation Markers */}
        {Array.from({ length: zoomH + 1 }).map((_, h) => (
          <div key={h} style={{
            position: "absolute", left: `${(h / zoomH) * 100}%`, top: "50%",
            width: 1, height: h % (zoomH > 12 ? 4 : 2) === 0 ? 8 : 4, background: T.border,
            transform: "translateY(-50%)", opacity: 0.5
          }} />
        ))}

        {/* Events */}
        {labelSlots.map((e, i) => {
          const color = e.type === "recent" ? T.brand : T.amber;
          const labelDir = e.vOffset > 0 ? "top" : "bottom";

          return (
            <div key={i} style={{
              position: "absolute", left: `${e.pos}%`, top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex", flexDirection: "column", alignItems: "center",
              zIndex: 2, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%", background: color,
                boxShadow: `0 0 10px ${color}80`, border: `1.5px solid ${T.bg}`
              }} />
              <div style={{
                position: "absolute", [labelDir]: Math.abs(e.vOffset),
                whiteSpace: "nowrap",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: color, fontWeight: 800,
                opacity: 0.95, letterSpacing: "0.02em",
                background: T.bg, padding: "2px 4px", borderRadius: 3,
                boxShadow: `0 0 6px ${T.bg}`, border: `1px solid ${color}30`
              }}>
                {fmtTime(e.ts)}
              </div>
            </div>
          );
        })}

        {/* Current Time Marker */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%", background: T.brand,
            boxShadow: `0 0 20px ${T.brand}`, animation: "dot 1.5s infinite",
            border: `2px solid ${T.bg}`, cursor: "help"
          }} title="Current Time" />
          <div style={{
            position: "absolute", bottom: 18, whiteSpace: "nowrap",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.brand, fontWeight: 900,
            background: T.bg, padding: "2px 6px", borderRadius: 4, border: `1px solid ${T.brand}`,
            boxShadow: `0 0 10px ${T.brand}30`
          }}>
            {fmtTime(now)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ flex: 1, display: "flex", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.brand }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim, fontWeight: 700 }}>RECOVERED</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.amber }} />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.dim, fontWeight: 700 }}>UPCOMING</span>
          </div>
        </div>

        {/* Zoom Control */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.surfaceHi, padding: "4px 8px", borderRadius: 20, border: `1px solid ${T.border}` }}>
          <button
            onClick={() => setZoomHours(h => Math.min(24, h + 2))}
            disabled={zoomHours >= 24}
            title={zoomHours >= 24 ? "Maximum zoom range reached (24H)" : "Zoom out"}
            aria-label={zoomHours >= 24 ? "Maximum zoom range reached (24H)" : "Zoom out"}
            style={{ background: "none", border: "none", color: zoomHours >= 24 ? T.dim : T.muted, cursor: zoomHours >= 24 ? "not-allowed" : "pointer", display: "flex", opacity: zoomHours >= 24 ? 0.4 : 1 }}
          >
             <Ic n="plus" s={10} c={zoomHours >= 24 ? T.dim : T.muted} style={{ transform: "rotate(45deg)" }} />
          </button>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: T.brand, fontWeight: 800, minWidth: 24, textAlign: "center" }}>
            {Math.round(zoomHours)}H
          </span>
          <button
            onClick={() => setZoomHours(h => Math.max(1, h - 2))}
            disabled={zoomHours <= 1}
            title={zoomHours <= 1 ? "Minimum zoom range reached (1H)" : "Zoom in"}
            aria-label={zoomHours <= 1 ? "Minimum zoom range reached (1H)" : "Zoom in"}
            style={{ background: "none", border: "none", color: zoomHours <= 1 ? T.dim : T.muted, cursor: zoomHours <= 1 ? "not-allowed" : "pointer", display: "flex", opacity: zoomHours <= 1 ? 0.4 : 1 }}
          >
             <Ic n="plus" s={10} c={zoomHours <= 1 ? T.dim : T.muted} />
          </button>
        </div>
      </div>
      {todayCount.upcomingResets?.length > 0 && (
        <div style={{ marginTop: 16, textAlign: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: T.amber, fontWeight: 700, letterSpacing: "0.03em", opacity: 0.8 }}>
          NEXT RECOVERY IN {fmtDuration(todayCount.upcomingResets[0].ts - now).toUpperCase()}
        </div>
      )}
    </div>
  );
};
