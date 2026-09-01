/**
 * CreatePRModal component for prompting the user to enter PR title and optional description
 * before submitting a GitHub Pull Request via the REST API.
 */
const CreatePRModal = ({ defaultTitle, defaultBody, repo, headBranch, baseBranch, onClose, onSubmit, busy, error }) => {
  const [prTitle, setPrTitle] = useState(defaultTitle || "");
  const [prBody, setPrBody] = useState(defaultBody || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prTitle.trim() || busy) return;
    onSubmit({ title: prTitle.trim(), body: prBody.trim() });
  };

  return (
    <Modal
      onClose={onClose}
      title="CREATE PULL REQUEST"
      subtitle={`Target: ${repo || "repository"} (${headBranch} → ${baseBranch})`}
      icon="git_pull"
      maxWidth={520}
      actions={
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1, padding: "10px", borderRadius: 8,
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
              flex: 1, padding: "10px", borderRadius: 8, border: "none",
              background: T.brand, color: "#000", fontFamily: "'JetBrains Mono',monospace",
              fontSize: 12, fontWeight: 900, cursor: (!prTitle.trim() || busy) ? "not-allowed" : "pointer",
              opacity: (!prTitle.trim() || busy) ? 0.6 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6
            }}
          >
            {busy ? "CREATING PR..." : "CREATE PULL REQUEST"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && (
          <div style={{ padding: "8px 12px", background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 6, color: T.red, fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
            {error}
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
