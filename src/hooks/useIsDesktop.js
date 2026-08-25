function useIsDesktop() {
  // Capture initial state to avoid layout shift on rotation for "auto" mode
  // unless the threshold is significantly crossed (e.g. tablet/desktop vs phone)
  const [v, setV] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const h = () => {
      // Only switch if we cross the major "tablet/desktop" threshold
      // 1024px is a safe bet for "not a phone in portrait"
      const current = window.innerWidth >= 1024;
      setV(prev => {
        // If we were mobile and stayed under 1024, or were desktop and stayed over 768, keep it.
        // This provides some hysteresis and stability.
        if (prev && window.innerWidth < 768) return false;
        if (!prev && window.innerWidth >= 1024) return true;
        return prev;
      });
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return v;
}

// ─── Icon paths ───────────────────────────────────────────────────────────────
