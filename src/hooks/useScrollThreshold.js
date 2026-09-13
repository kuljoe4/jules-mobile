// OPTIMIZATION (Bolt / UI/UX): Implement hysteresis bounds and minimum scrollable height checks
// to eliminate scroll feedback loops and prevent header flickering on short scroll containers where
// collapsing header elements shrink scrollHeight and force scrollTop clamping to 0.
const useScrollThreshold = (threshold = 60, hysteresis = 40, minScrollable = 180) => {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback(e => {
    const el = e.target;
    if (!el) return;
    const y = el.scrollTop;
    const scrollable = el.scrollHeight - el.clientHeight;

    // Do NOT trigger header collapse if the content does not have enough scrollable height
    // to collapse without clamping scrollTop back to 0.
    if (scrollable < minScrollable) {
      if (scrolled) setScrolled(false);
      return;
    }

    if (!scrolled && y > threshold) {
      setScrolled(true);
    } else if (scrolled && y < (threshold - hysteresis)) {
      setScrolled(false);
    }
  }, [scrolled, threshold, hysteresis, minScrollable]);

  return [scrolled, onScroll];
};
