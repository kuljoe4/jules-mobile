/**
 * PayloadBreakdownModal component for displaying categorized payload byte sizes,
 * visual stacked bar chart, itemized code patch details, and debug log export.
 */
import { copyToClipboard } from "../utils/format.js";

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

    copyToClipboard(JSON.stringify(logData, null, 2)).then((success) => {
      if (success) {
        setCopiedDebug(true);
        setTimeout(() => setCopiedDebug(false), 2000);
      }
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
