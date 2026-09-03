/**
 * CreatePRModal component for prompting the user to enter PR title and optional description
 * before submitting a GitHub Pull Request via the REST API.
 */
const CreatePRModal = ({ defaultTitle, defaultBody, repo, headBranch, baseBranch, aheadCommits = [], onClose, onSubmit, onCreateAndMerge, busy, error }) => {
  const [prTitle, setPrTitle] = useState(defaultTitle || "");
  const [prBody, setPrBody] = useState(defaultBody || "");
  const [localErr, setLocalErr] = useState(null);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prTitle.trim() || busy) return;
    if (headBranch && baseBranch && headBranch.trim().toLowerCase() === baseBranch.trim().toLowerCase()) {
      setLocalErr(`Cannot create Pull Request: Head branch ("${headBranch}") is identical to base branch ("${baseBranch}"). Please specify a feature branch.`);
      return;
    }
    setLocalErr(null);
    onSubmit({ title: prTitle.trim(), body: prBody.trim() });
  };

  const handleCreateAndMerge = (e) => {
    e?.preventDefault();
    if (!prTitle.trim() || busy) return;
    if (headBranch && baseBranch && headBranch.trim().toLowerCase() === baseBranch.trim().toLowerCase()) {
      setLocalErr(`Cannot create and merge: Head branch ("${headBranch}") is identical to base branch ("${baseBranch}").`);
      return;
    }
    setLocalErr(null);
    if (onCreateAndMerge) {
      onCreateAndMerge({ title: prTitle.trim(), body: prBody.trim() });
    } else {
      onSubmit({ title: prTitle.trim(), body: prBody.trim(), autoMerge: true });
    }
  };

  return (
    <Modal
      onClose={onClose}
      title="CREATE PULL REQUEST"
      subtitle={`Target: ${repo || "repository"} (${headBranch} → ${baseBranch})`}
      icon="git_pull"
      maxWidth={520}
      actions={
        <div style={{ display: "flex", gap: 10, width: "100%", flexWrap: "wrap" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "10px 14px", borderRadius: 8,
              border: `1px solid ${T.border}`, background: "transparent",
              color: T.muted, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer"
            }}
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prTitle.trim() || busy}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.brand}60`,
              background: T.brandDim, color: T.brandLight, fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: 900, cursor: (!prTitle.trim() || busy) ? "not-allowed" : "pointer",
              opacity: (!prTitle.trim() || busy) ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            {busy ? "WORKING..." : "CREATE PR"}
          </button>
          <button
            onClick={handleCreateAndMerge}
            disabled={!prTitle.trim() || busy}
            style={{
              flex: 1.2, padding: "10px", borderRadius: 8, border: "none",
              background: T.purple, color: "#000", fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11, fontWeight: 900, cursor: (!prTitle.trim() || busy) ? "not-allowed" : "pointer",
              opacity: (!prTitle.trim() || busy) ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: `0 4px 12px ${T.purple}30`
            }}
            title="Create Pull Request and merge immediately in 1 click"
            aria-label="Create Pull Request and merge immediately in 1 click"
          >
            {busy ? "MERGING..." : "⚡ CREATE & MERGE NOW"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(error || localErr) && (
          <div style={{ padding: "8px 12px", background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 6, color: T.red, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
            {localErr || error}
          </div>
        )}

        {aheadCommits && aheadCommits.length > 0 && (
          <div style={{
            background: T.surfaceHi, border: `1px solid ${T.borderHi}`, borderRadius: 8, padding: 12
          }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 800, color: T.brand, marginBottom: 8, letterSpacing: "0.08em" }}>
              AHEAD COMMITS TO BE MERGED ({aheadCommits.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
              {aheadCommits.map((c, i) => {
                const subject = c.title || (c.message || "").trim().split("\n")[0] || "Ahead commit";
                const desc = c.description || (c.message || "").trim().split("\n").slice(1).join("\n").trim();

                return (
                  <div key={c.sha || i} style={{ background: T.bg, padding: 8, borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: desc ? 4 : 0 }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color: T.purple }}>
                        {c.sha ? c.sha.slice(0, 7) : "commit"}
                      </span>
                      <span style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, fontWeight: 700, color: T.textHi, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {subject}
                      </span>
                    </div>
                    {desc && (
                      <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 11, color: T.textDim, lineHeight: 1.35, whiteSpace: "pre-wrap", opacity: 0.85 }}>
                        {desc.length > 200 ? desc.slice(0, 197) + "..." : desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: "0.08em" }}>
            PULL REQUEST TITLE
          </label>
          <input
            type="text"
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            placeholder="e.g. Add multi-patch diff support"
            aria-label="Pull request title"
            maxLength={200}
            required
            style={{
              width: "100%", background: T.surfaceHi, border: `1px solid ${T.borderHi}`,
              borderRadius: 6, padding: "10px 12px", color: T.text,
              fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, outline: "none"
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: "0.08em" }}>
            PR DESCRIPTION (OPTIONAL)
          </label>
          <textarea
            value={prBody}
            onChange={e => setPrBody(e.target.value)}
            placeholder="Describe the changes made in this session..."
            aria-label="Pull request description"
            rows={4}
            maxLength={2000}
            style={{
              width: "100%", background: T.surfaceHi, border: `1px solid ${T.borderHi}`,
              borderRadius: 6, padding: "10px 12px", color: T.text,
              fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 13, outline: "none", resize: "none"
            }}
          />
        </div>

        <div style={{
          padding: 12, borderRadius: 8, background: `${T.blue}0d`, border: `1px solid ${T.blue}20`,
          fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12, color: T.textDim, lineHeight: 1.4
        }}>
          ℹ️ Pull Request will be created directly on GitHub via API from <strong>{headBranch}</strong> into <strong>{baseBranch}</strong>.
        </div>
      </form>
    </Modal>
  );
};
