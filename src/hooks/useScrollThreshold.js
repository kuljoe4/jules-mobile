// OPTIMIZATION (Bolt / UI/UX): Implement hysteresis bounds (upper threshold and lower reset threshold)
// to eliminate scroll-feedback loops where collapsing header elements alter scrollTop and trigger
// rapid back-and-forth header flickering during scrolling.
const useScrollThreshold = (threshold = 60, hysteresis = 40) => {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback(e => {
    const y = e.target ? e.target.scrollTop : 0;
    if (!scrolled && y > threshold) {
      setScrolled(true);
    } else if (scrolled && y < (threshold - hysteresis)) {
      setScrolled(false);
    }
  }, [scrolled, threshold, hysteresis]);
  return [scrolled, onScroll];
};
