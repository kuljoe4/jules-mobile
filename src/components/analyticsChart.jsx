import { sanitizeErrorMessage } from "../services/api.js";
import { SafeStorage } from '../services/storage.js';

const AnalyticsChart = ({ getSessions }) => {
  const { useState, useEffect, useMemo, useRef } = window.React || globalThis.React;
  const [sessions, setSessions] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Attempt to load sessions from whatever context or storage function is passed down
    if (getSessions) {
      setSessions(getSessions());
    } else {
      try {
        setSessions(SafeStorage.loadSessionsList());
      } catch (err) {
        console.error("Failed to load sessions for analytics", sanitizeErrorMessage(err.message || String(err)));
      }
    }
  }, [getSessions]);

  const scheduledPromptText = `As a world-class UI/UX Designer, Senior Frontend Engineer, Backend Systems Architect, and Lead Research Scientist:

Analyze the historical execution logs and performance metrics of our autonomous coding agents (e.g., Bolt, Sentinel, Palette).
Evaluate their impact across the following dimensions:
1. Aesthetic elegance and intuitive flow improvements.
2. Adherence to WCAG 2.1 accessibility standards.
3. Component modularity, React best practices, and responsive excellence.
4. Backend API robustness, scalability, and database optimization.

Generate a comprehensive trend chart and metric report detailing how the application's overall quality and performance have improved or declined over time as a direct result of these agents' interventions. Recommend targeted optimizations to address any identified declines.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scheduledPromptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Group by persona if they exist
  const personaStats = useMemo(() => {
    const stats = {};
    sessions.forEach(s => {
      // Jules mobile uses state instead of status
      const isCompleted = s.state === "COMPLETED";
      const isFailed = s.state === "FAILED";

      // The persona might be stored in focusRoles or systemRole (it's often focusRoles in Jules apps)
      const personas = s.focusRoles || s.personas || [];

      if (personas && Array.isArray(personas) && personas.length > 0) {
        personas.forEach(pId => {
          if (!stats[pId]) stats[pId] = { total: 0, completed: 0, failed: 0 };
          stats[pId].total++;
          if (isCompleted) stats[pId].completed++;
          if (isFailed) stats[pId].failed++;
        });
      } else {
        if (!stats["none"]) stats["none"] = { total: 0, completed: 0, failed: 0 };
        stats["none"].total++;
        if (isCompleted) stats["none"].completed++;
        if (isFailed) stats["none"].failed++;
      }
    });
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [sessions]);

  return (
    <div style={{ padding: 20, background: T.surface, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'JetBrains Mono',monospace", color: T.text, fontSize: 14, margin: 0 }}>
          AGENT IMPACT ANALYTICS
        </h2>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.dim }}>
          {sessions.length} SESSIONS ANALYZED
        </div>
      </div>

      {personaStats.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 11, color: T.textDim, fontFamily: "'JetBrains Mono',monospace", marginBottom: 12 }}>
            PERFORMANCE BY AGENT/PERSONA
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {personaStats.map(([pId, st]) => {
              const successRate = st.total > 0 ? Math.round((st.completed / st.total) * 100) : 0;
              const barColor = successRate > 80 ? "#34d399" : successRate > 50 ? T.amber : T.red;
              return (
                <div key={pId} style={{ background: T.surfaceHi, padding: 12, borderRadius: 8, border: `1px solid ${T.borderHi}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                    <span style={{ color: T.brandLight, fontWeight: 700 }}>{(pId || "none").toUpperCase()}</span>
                    <span style={{ color: T.textDim }}>{st.completed} / {st.total} ({successRate}%)</span>
                  </div>
                  <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${successRate}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: 16, background: T.surfaceHi, borderRadius: 8, border: `1px solid ${T.borderHi}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 11, color: T.dim, fontFamily: "'JetBrains Mono',monospace", margin: 0 }}>
            SCHEDULED PROMPT EXPORT
          </h3>
          <button
            onClick={handleCopy}
            aria-label={copied ? "Copied to clipboard" : "Copy prompt to clipboard"}
            title={copied ? "Copied to clipboard" : "Copy prompt to clipboard"}
            style={{
              padding: "4px 8px", borderRadius: 4, background: copied ? `${T.brand}20` : T.surface,
              border: `1px solid ${copied ? T.brand : T.border}`, color: copied ? T.brand : T.textDim,
              fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, cursor: "pointer"
            }}
          >
            {copied ? "COPIED ✓" : "COPY PROMPT"}
          </button>
        </div>
        <textarea
          readOnly
          value={scheduledPromptText}
          aria-label="Optimized scheduled prompt for backend apps"
          style={{
            width: "100%", height: 160, background: T.bg, border: `1px solid ${T.border}`,
            color: T.brandLight, padding: 12, borderRadius: 6, fontFamily: "'JetBrains Mono',monospace",
            fontSize: 11, lineHeight: 1.5, resize: "none", boxSizing: "border-box"
          }}
        />
        <p style={{ fontSize: 11, color: T.textDim, marginTop: 12, fontFamily: "'IBM Plex Sans',sans-serif", lineHeight: 1.4 }}>
          This prompt combines UX, Performance, Accessibility, and Backend architecture priorities. Copy and paste it into your other applications with a backend to schedule recurring metrics and agent impact analysis charts.
        </p>
      </div>
    </div>
  );
};
