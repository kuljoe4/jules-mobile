const useScrollThreshold = (threshold = 40) => {
  const [scrolled, setScrolled] = useState(false);
  const onScroll = useCallback(e => {
    const s = e.target.scrollTop > threshold;
    if (s !== scrolled) setScrolled(s);
  }, [scrolled, threshold]);
  return [scrolled, onScroll];
};
