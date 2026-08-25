class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("Uncaught component error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: "100vh", background: "#07090c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ width: 60, height: 60, background: T.redDim, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Ic n="x" s={30} c={T.red} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 10 }}>APPLICATION CRASHED</div>
          <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: T.textDim, marginBottom: 30, maxWidth: 400 }}>
            An unexpected error occurred in the UI. You can try to reload or perform a hard reset if the issue persists.
          </div>
          <div style={{ background: "#040507", border: `1px solid ${T.border}`, borderRadius: 8, padding: 12, marginBottom: 30, width: "100%", maxWidth: 500, overflow: "auto", maxHeight: 200 }}>
            <pre style={{ margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.red, textAlign: "left" }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Btn onClick={() => location.reload()} sm>RELOAD APP</Btn>
            <Btn onClick={() => handleEmergencyReset()} sm color={T.red} outline>HARD RESET</Btn>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
