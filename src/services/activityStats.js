function cleanupActivityStats(validIds) {
  try {
    const stats = SafeStorage.loadActStats();
    const validSet = new Set(validIds);
    let changed = false;
    for (const id in stats) {
      if (!validSet.has(id)) {
        delete stats[id];
        changed = true;
      }
    }
    if (changed) {
      SafeStorage.saveActStats(stats);
      window.dispatchEvent(new CustomEvent("jac_stats_updated", { detail: stats }));
    }
  } catch {}
}

function loadDraft() { return SafeStorage.loadDraft(); }
function loadRepoStats() { return SafeStorage.loadRepoStats(); }
function incRepoStat(name) { SafeStorage.incRepoStat(name); }
function loadLastSource() { return SafeStorage.loadLastSource(); }
function saveLastSource(name) { SafeStorage.saveLastSource(name); }
function loadLastBranches() { return SafeStorage.loadLastBranches(); }
function saveLastBranch(source, branch) { SafeStorage.saveLastBranch(source, branch); }
function saveDraft(d) { SafeStorage.saveDraft(d); }
function clearDraft() { SafeStorage.clearDraft(); }

function loadDraftsBox() { return SafeStorage.loadDraftsBox(); }
function saveDraftToBox(draft) { return SafeStorage.saveDraftToBox(draft); }
function deleteDraftFromBox(id) { SafeStorage.deleteDraftFromBox(id); }
function clearDraftsBox() { SafeStorage.clearDraftsBox(); }

/**
 * React custom hook `useNewSessionFlow` extracts and encapsulates all state management,
 * repository and branch fetching/sorting, fuzzy filtering, and multi-tiered template
 * auto-saving lifecycles from the NewSession component. This separates background orchestration,
 * data flows, and persistence concerns from layout rendering to resolve "God Mode" complexity.
 */
