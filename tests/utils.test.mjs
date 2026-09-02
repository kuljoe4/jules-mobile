import assert from 'node:assert/strict';
import { LRUCache } from '../src/utils/cache.js';
import {
  isValidGitBranchName,
  isValidGithubRepoName,
  isValidGithubToken,
  isValidGoogleApiKey,
  isValidSessionId,
  safeMediaBase64,
  safeMediaMimeType,
  safeUrl,
} from '../src/utils/validation.js';
import { cleanMathText, fmtBytes, fmtChars, formatSmartDashItems, safeSlice } from '../src/utils/format.js';
import { fmtAgo, fmtDuration, fmtTime, parseDateMs } from '../src/utils/date.js';
import { GitHubTracker, getPR, getPRInfo, getBranchInfo, getCheckStatus, getDeploymentInfo, createPullRequest, deleteBranch } from '../src/services/githubTracker.js';
import { fastDeepEqual, getActivitiesSize, getApproxBytes, getPatchFileCount, getPayloadBreakdown } from '../src/utils/performance.js';
import { parseUnidiffPatch, getWorkingSet } from '../src/utils/workingSet.js';

if (typeof globalThis.localStorage === 'undefined') {
  const storageMap = new Map();
  globalThis.localStorage = {
    getItem: (key) => storageMap.has(key) ? storageMap.get(key) : null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: (key) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };
}

import { SafeStorage } from '../src/services/storage.js';

assert.equal(isValidGoogleApiKey('AIzaSyFakeKeyFormVerificationTesting123'), true);
assert.equal(isValidGoogleApiKey('bad key with spaces'), false);
assert.equal(isValidGithubToken(''), true);
assert.equal(isValidGithubToken('ghp_validAsciiToken123'), true);
assert.equal(isValidGithubToken('bad token'), false);

assert.equal(isValidGithubRepoName('owner/repo'), true);
assert.equal(isValidGithubRepoName('org-name/my.repo_123'), true);
assert.equal(isValidGithubRepoName(''), false);
assert.equal(isValidGithubRepoName(null), false);
assert.equal(isValidGithubRepoName('owner/repo?inject=1'), false);
assert.equal(isValidGithubRepoName('owner/repo#frag'), false);
assert.equal(isValidGithubRepoName('invalid-repo-without-slash'), false);
assert.equal(isValidGithubRepoName('a/'.repeat(150)), false);
assert.equal(isValidGithubRepoName('../repo'), false);
assert.equal(isValidGithubRepoName('owner/..'), false);
assert.equal(isValidGithubRepoName('owner\x00/repo'), false);
assert.equal(isValidGithubRepoName('owner /repo'), false);
assert.equal(isValidGithubRepoName('-owner/repo'), false);
assert.equal(isValidGithubRepoName('owner/-repo'), false);
assert.equal(isValidGithubRepoName('owner./repo'), false);
assert.equal(isValidGithubRepoName('owner/repo.git'), false);

assert.equal(isValidSessionId('123456789'), true);
assert.equal(isValidSessionId('sessions/123456789'), true);
assert.equal(isValidSessionId('sess-123-abc_def'), true);
assert.equal(isValidSessionId('123e4567-e89b-12d3-a456-426614174000'), true);
assert.equal(isValidSessionId(''), false);
assert.equal(isValidSessionId(null), false);
assert.equal(isValidSessionId('sess?inject=1'), false);
assert.equal(isValidSessionId('sess#frag'), false);
assert.equal(isValidSessionId('../path/traversal'), false);
assert.equal(isValidSessionId('sess//double'), false);
assert.equal(isValidSessionId('/leading/slash'), false);
assert.equal(isValidSessionId('trailing/slash/'), false);
assert.equal(isValidSessionId('sess\x00nullbyte'), false);
assert.equal(isValidSessionId('sess\nnewline'), false);
assert.equal(isValidSessionId('a'.repeat(300)), false);

assert.equal(isValidGitBranchName('feature/mobile-refactor'), true);
assert.equal(isValidGitBranchName('-danger'), false);
assert.equal(isValidGitBranchName('feature//double'), false);
assert.equal(isValidGitBranchName('bad lock.lock'), false);
assert.equal(isValidGitBranchName('release.lock'), false);
assert.equal(isValidGitBranchName('branch?query=1'), false);
assert.equal(isValidGitBranchName('branch#fragment'), false);
assert.equal(isValidGitBranchName('branch\x00nullbyte'), false);
assert.equal(isValidGitBranchName('branch\x07bell'), false);
assert.equal(isValidGitBranchName('branch\x1funit'), false);
assert.equal(isValidGitBranchName('branch\x7fdel'), false);

const ghPrRe = /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/pull\/(\d+)/;
assert.equal(ghPrRe.test('https://github.com/owner/repo/pull/123'), true);
assert.equal(ghPrRe.test('https://github.com/owner?inject=1/repo/pull/123'), false);
assert.equal(ghPrRe.test('https://github.com/owner/repo#frag/pull/123'), false);

assert.equal(safeUrl('https://github.com/example/repo'), 'https://github.com/example/repo');
assert.equal(safeUrl('javascript:alert(1)'), '#');
assert.equal(safeMediaMimeType(' IMAGE/PNG '), 'image/png');
assert.equal(safeMediaMimeType('text/html'), 'image/png');
assert.equal(safeMediaBase64('abc!@#/+=123'), 'abc/+=123');

const cache = new LRUCache(2);
cache.set('a', 1);
cache.set('b', 2);
assert.equal(cache.get('a'), 1);
cache.set('c', 3);
assert.equal(cache.has('b'), false);
assert.equal(cache.size, 2);

assert.equal(fmtBytes(0.5), '512B');
assert.equal(fmtChars(1200), '1.2kc');
assert.equal(safeSlice('a😊b', 2), 'a😊');
assert.equal(parseDateMs('2026-08-25T00:00:00.000Z'), Date.parse('2026-08-25T00:00:00.000Z'));
assert.equal(fmtDuration(90_000), '1m');
assert.equal(typeof fmtAgo(Date.now() - 5000), 'string');
assert.equal(typeof fmtTime(Date.now()), 'string');

assert.equal(cleanMathText('\\text{Entry/Exit Authorized} = (\\text{Required}_1 \\text{ AND } \\dots)'), 'Entry/Exit Authorized = (Required_1  AND  …)');
assert.equal(cleanMathText('/quad \nOpportunity Score = (Momentum Score \\times w_{momentum})'), 'Opportunity Score = (Momentum Score × w_momentum)');
assert.equal(cleanMathText('Completed Close > Fast EMA \\quad AND \\quad Completed Close > Slow EMA'), 'Completed Close > Fast EMA   AND   Completed Close > Slow EMA');
assert.equal(cleanMathText('squad quadratic'), 'squad quadratic');

// Test formatSmartDashItems smart dash itemization
const dashInput1 = "Fix bugs and improve UI - Mobile-first layout adjustments - Pre-commit check verification (range 1-10).";
const dashExpected1 = "Fix bugs and improve UI\n- Mobile-first layout adjustments\n- Pre-commit check verification (range 1-10).";
assert.equal(formatSmartDashItems(dashInput1), dashExpected1);

const dashInput2 = "1. *Audit and enhance UI/UX.* - Inspect components - Ensure 100% WCAG 2.1 compliance.";
const dashExpected2 = "1. *Audit and enhance UI/UX.*\n- Inspect components\n- Ensure 100% WCAG 2.1 compliance.";
assert.equal(formatSmartDashItems(dashInput2), dashExpected2);

const dashInput3 = "Overall details: - First sub item - Second sub item; i.e.: - Third sub item";
const dashExpected3 = "Overall details:\n- First sub item\n- Second sub item; i.e.:\n- Third sub item";
assert.equal(formatSmartDashItems(dashInput3), dashExpected3);

// Test GitHubTracker PR Caching (positive and negative hits)
const sessNoPR = { id: 'sess-no-pr-1', createTime: '2026-08-25T10:00:00Z', outputs: [] };
assert.equal(getPR(sessNoPR), null);
// Verify negative hit is stored in PR_CACHE
const keyNoPR = 'sess-no-pr-1:2026-08-25T10:00:00Z:0';
assert.equal(GitHubTracker.PR_CACHE.has(keyNoPR), true);
assert.equal(GitHubTracker.PR_CACHE.get(keyNoPR), null);

const sessWithPR = { id: 'sess-pr-1', createTime: '2026-08-25T10:00:00Z', outputs: [{ githubPullRequest: 'https://github.com/owner/repo/pull/42' }] };
const prRes = getPR(sessWithPR);
assert.deepEqual(prRes, { url: 'https://github.com/owner/repo/pull/42', number: '42' });
const keyWithPR = 'sess-pr-1:2026-08-25T10:00:00Z:1';
assert.equal(GitHubTracker.PR_CACHE.has(keyWithPR), true);

// Cache invalidation on updateTime change
const sessUpdated = { ...sessNoPR, updateTime: '2026-08-25T11:00:00Z' };
assert.equal(getPR(sessUpdated), null);
const keyUpdated = 'sess-no-pr-1:2026-08-25T11:00:00Z:0';
assert.equal(GitHubTracker.PR_CACHE.has(keyUpdated), true);

// Test SafeStorage session list caching
assert.deepEqual(SafeStorage.loadSessionsList(), []);
const testSessions = [{ id: 's1', title: 'Test Session 1', state: 'COMPLETED' }];
SafeStorage.saveSessionsList(testSessions);
assert.deepEqual(SafeStorage.loadSessionsList(), testSessions);

// Test SafeStorage followup draft session ID validation
assert.equal(SafeStorage.saveFollowupDraft('valid-sess-123', 'draft text'), true);
assert.equal(SafeStorage.loadFollowupDraft('valid-sess-123'), 'draft text');
assert.equal(SafeStorage.clearFollowupDraft('valid-sess-123'), true);
assert.equal(SafeStorage.loadFollowupDraft('valid-sess-123'), '');

// Test rejection of invalid session IDs in SafeStorage followup draft helpers
assert.equal(SafeStorage.saveFollowupDraft('../path/traversal', 'invalid'), false);
assert.equal(SafeStorage.loadFollowupDraft('../path/traversal'), '');
assert.equal(SafeStorage.clearFollowupDraft('../path/traversal'), false);
assert.equal(SafeStorage.saveFollowupDraft('sess\x00nullbyte', 'invalid'), false);
assert.equal(SafeStorage.loadFollowupDraft('sess\x00nullbyte'), '');

// Test localStorage draft key scanning session ID validation logic
const mockScanDrafts = (storage) => {
  const map = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && key.startsWith("jac_draft_") && !key.startsWith("jac_drafts_box")) {
      const val = storage.getItem(key);
      if (val && val.trim()) {
        const id = key.slice("jac_draft_".length);
        if (isValidSessionId(id)) {
          map[id] = true;
        }
      }
    }
  }
  return map;
};

const mockStore = new Map([
  ["jac_draft_valid-sess-1", "draft text"],
  ["jac_draft_../invalid-path", "bad text"],
  ["jac_draft_sess\x00nullbyte", "bad text"],
  ["jac_draft_sess?query=1", "bad text"],
  ["jac_draft_valid-sess-2", "draft text 2"],
]);
const fakeLocalStorage = {
  length: mockStore.size,
  key: (i) => Array.from(mockStore.keys())[i],
  getItem: (k) => mockStore.get(k) || null,
};
const scanned = mockScanDrafts(fakeLocalStorage);
assert.equal(scanned["valid-sess-1"], true);
assert.equal(scanned["valid-sess-2"], true);
assert.equal(scanned["../invalid-path"], undefined);
assert.equal(scanned["sess\x00nullbyte"], undefined);
assert.equal(scanned["sess?query=1"], undefined);

// Test GitHubTracker.triggerGitHubFetch validation for invalid repo names
const invalidRepoPrUrl = `https://github.com/${'a/'.repeat(150)}/pull/1`;
GitHubTracker.triggerGitHubFetch(invalidRepoPrUrl);
assert.equal(GitHubTracker.GH_IN_FLIGHT.has(invalidRepoPrUrl), false);

// Test GitHubTracker.mergePullRequest validation for invalid repo names and token
await assert.rejects(
  async () => {
    await GitHubTracker.mergePullRequest('https://github.com/../invalid/pull/1');
  },
  { message: 'Invalid GitHub repository format in URL' }
);

// Test fastDeepEqual
assert.equal(fastDeepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] }), true);
assert.equal(fastDeepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 4] }), false);
assert.equal(fastDeepEqual(null, null), true);
assert.equal(fastDeepEqual(1, '1'), false);

// Test performance byte calculation and payload breakdown
const sampleChangeSet = {
  gitPatch: {
    unidiffPatch: "--- a/src/app.js\n+++ b/src/app.js\n@@ -1,3 +1,4 @@\n+// change\n"
  }
};
assert.equal(getPatchFileCount(sampleChangeSet), 1);

const sampleActivities = [
  {
    id: "act-1",
    createTime: "2026-08-25T12:00:00Z",
    artifacts: [{ changeSet: sampleChangeSet }]
  },
  {
    id: "act-2",
    createTime: "2026-08-25T12:01:00Z",
    progressUpdated: { description: "CI check passed successfully", title: "Run checks" }
  }
];

const totalSize = getActivitiesSize(sampleActivities);
assert.equal(typeof totalSize, "number");
assert.equal(totalSize > 0, true);

const breakdown = getPayloadBreakdown(sampleActivities);
assert.equal(breakdown.patchCount, 1);
assert.equal(breakdown.topPatches.length, 1);

// Test parseUnidiffPatch and getWorkingSet
const parsedGroups = parseUnidiffPatch(sampleChangeSet.gitPatch.unidiffPatch);
assert.equal(parsedGroups.length, 1);
assert.equal(parsedGroups[0].file, "src/app.js");

const mockSession = {
  id: "sess-ws-1",
  prompt: "Fix bug in `src/app.js` and `src/utils.js`",
  sourceContext: { source: "sources/github/owner/repo", githubRepoContext: { startingBranch: "main" } }
};
const workingSetFiles = getWorkingSet(mockSession, sampleActivities);
assert.equal(workingSetFiles.includes("src/app.js"), true);

// Test getCheckStatus signal extraction & fail-closed behavior
const checkStatus = getCheckStatus(sampleActivities);
assert.deepEqual(checkStatus, { state: "success", label: "CHECKS PASSED" });

const failingCheckActivities = [
  {
    id: "act-fail-1",
    createTime: "2026-08-25T12:05:00Z",
    progressUpdated: { description: "Checks completed with failures", title: "CI workflow" }
  }
];
const failCheckStatus = getCheckStatus(failingCheckActivities);
assert.deepEqual(failCheckStatus, { state: "failure", label: "CHECKS FAILED" });

// Test getDeploymentInfo repository input validation
assert.equal(getDeploymentInfo(""), null);
assert.equal(getDeploymentInfo("invalid-repo-without-slash"), null);
assert.equal(getDeploymentInfo("../invalid/path"), null);

// Test getPRInfo fallback with activities
const prInfo = getPRInfo(mockSession, sampleActivities);
assert.equal(prInfo, null);

// Test createPullRequest parameter validation
await assert.rejects(
  async () => {
    await createPullRequest({ repo: "owner/repo", head: "-invalid-branch", base: "main" });
  },
  { message: 'Invalid head branch name ("-invalid-branch").' }
);

await assert.rejects(
  async () => {
    await createPullRequest({ repo: "owner/repo", head: "feature", base: "bad branch with spaces" });
  },
  { message: 'Invalid base branch name ("bad branch with spaces").' }
);

// Test deleteBranch parameter validation
await assert.rejects(
  async () => {
    await deleteBranch("owner/repo", "../invalid");
  },
  { message: "Invalid branch name for deletion" }
);

// Test single-pass quota calculation partitioning logic
const now = Date.now();
const mockRegistry = {
  "sess-active-1": new Date(now - 1 * 3600000).toISOString(),
  "sess-active-2": new Date(now - 5 * 3600000).toISOString(),
  "sess-old-1": new Date(now - 25 * 3600000).toISOString(),
  "sess-old-2": new Date(now - 30 * 3600000).toISOString(),
};

const windowStart = now - 24 * 3600000;
const entries = Object.entries(mockRegistry);
const allKnown = [];
const recentlyDone = [];

for (let i = 0; i < entries.length; i++) {
  const [id, time] = entries[i];
  const ts = parseDateMs(time);
  if (ts >= windowStart) {
    allKnown.push({ id, ts });
  } else {
    recentlyDone.push({ id, ts });
  }
}

assert.equal(allKnown.length, 2);
assert.equal(recentlyDone.length, 2);

console.log('Utility tests passed');
