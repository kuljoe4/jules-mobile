// Signal that Babel compilation is done and React is about to mount
if (window.__splashMsg) __splashMsg("MOUNTING APP…", "building component tree · " + __splashElapsed(), 90);

// Strict dependency check before proceeding
(function checkDeps() {
  const deps = { React: typeof React, ReactDOM: typeof ReactDOM };
  console.log('[Boot] Checking dependencies:', deps);
  if (deps.React === 'undefined' || deps.ReactDOM === 'undefined') {
    throw new Error('Critical dependencies missing: ' + JSON.stringify(deps));
  }
})();

const { useState, useEffect, useRef, useCallback, useMemo, memo } = React;
