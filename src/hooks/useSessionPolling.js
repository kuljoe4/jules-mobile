/**
 * useSessionPolling
 *
 * Extracted custom hook that encapsulates the polling, countdown timer, and refresh logic
 * for the SessionDetail view. It manages the effective interval state transitions, coordinates
 * the useAutoPoll lifecycle, and handles the manual handleRefresh action without polluting
 * the main component's state or render loops.
 */
const useSessionPolling = (
  session,
  pollInterval,
  loadSession,
  loadActivities,
  lastTsRef,
  isFinished,
  busy,
  setBusy,
  setErr,
  setJustUpdated
) => {
  const effectiveInterval = (isFinished && !busy) ? 0 : pollInterval;

  const countdown = useAutoPoll(
    effectiveInterval,
    useCallback(() => Promise.all([loadSession(), loadActivities(lastTsRef.current)]), [loadSession, loadActivities, lastTsRef])
  );

  const handleRefresh = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      await Promise.all([loadSession(), loadActivities(null)]);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2000);
    } catch (err) {
      setErr(err.message);
    } finally {
      setBusy(false);
    }
  }, [loadSession, loadActivities, setBusy, setErr, setJustUpdated]);

  return { countdown, handleRefresh };
};
