/**
 * 🛡️ Warden: Extracted Mobile Navigation State
 *
 * What: Extracted mobile drawer and layout state variables (`mobileDrawerOpen`, `drawerClosing`, `mobileScreen`, `desktopView`) and their manipulation functions into this dedicated custom hook.
 * Why: `JulesClient` was exhibiting "God Mode" behavior by directly mixing complex UI event listeners (like the Escape key drawer close behavior) and mobile-specific layout states with global application state logic.
 * Impact: Reduces the responsibility footprint of `JulesClient`, adhering to the Single Responsibility Principle (SRP).
 */
const useNavigation = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const [drawerClosing, setDrawerClosing] = useState(false);
  const [mobileScreen, setMobileRaw] = useState("detail");
  const [desktopView, setDesktop] = useState("empty");

  const closeMobileDrawer = useCallback(() => {
    if (!mobileDrawerOpen || drawerClosing) return;
    setDrawerClosing(true);
    setTimeout(() => {
      setMobileDrawerOpen(false);
      setDrawerClosing(false);
    }, 220);
  }, [mobileDrawerOpen, drawerClosing]);

  const openMobileDrawer = useCallback(() => {
    setDrawerClosing(false);
    setMobileDrawerOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        closeMobileDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen, closeMobileDrawer]);

  const setMobile = useCallback(s => {
    setMobileRaw(s);
  }, []);

  return {
    mobileDrawerOpen,
    setMobileDrawerOpen,
    drawerClosing,
    mobileScreen,
    desktopView,
    setDesktop,
    setMobile,
    closeMobileDrawer,
    openMobileDrawer
  };
};
