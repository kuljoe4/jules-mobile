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
import { cleanMathText, fmtBytes, fmtChars, safeSlice } from '../src/utils/format.js';
import { fmtAgo, fmtDuration, fmtTime, parseDateMs } from '../src/utils/date.js';
import { GitHubTracker, getPR } from '../src/services/githubTracker.js';

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

console.log('Utility tests passed');
