const useAutoPoll = (interval, fn) => {
  const [countdown, setCountdown] = useState(0);
  const nextRefAt = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!interval || interval <= 0) {
      setCountdown(0);
      return;
    }

    let active = true;
    let timer = null;
    let intv = null;

    const run = async () => {
      if (!active) return;

      const nextAt = Date.now() + interval;
      nextRefAt.current = nextAt;
      setCountdown(Math.ceil(interval / 1000));

      timer = setTimeout(async () => {
        if (!active) return;
        try { await fnRef.current(); } catch (err) { console.error("Poll failed", err); }
        if (active) run();
      }, interval);
    };

    run();

    intv = setInterval(() => {
      if (active) {
        const remaining = Math.max(0, Math.ceil((nextRefAt.current - Date.now()) / 1000));
        setCountdown(remaining);
      }
    }, 1000);

    const handleResume = () => {
      if (active && document.visibilityState === "visible") {
        try { fnRef.current(); } catch (err) { console.error("Poll on resume failed", err); }
      }
    };
    window.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);

    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(intv);
      window.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
    };
  }, [interval]);

  return countdown;
};
