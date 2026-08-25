import assert from 'node:assert/strict';
import { LRUCache } from '../src/utils/cache.js';
import {
  isValidGitBranchName,
  isValidGithubToken,
  isValidGoogleApiKey,
  safeMediaBase64,
  safeMediaMimeType,
  safeUrl,
} from '../src/utils/validation.js';
import { fmtBytes, fmtChars, safeSlice } from '../src/utils/format.js';
import { fmtDuration, parseDateMs } from '../src/utils/date.js';

assert.equal(isValidGoogleApiKey('AIzaSyFakeKeyFormVerificationTesting123'), true);
assert.equal(isValidGoogleApiKey('bad key with spaces'), false);
assert.equal(isValidGithubToken(''), true);
assert.equal(isValidGithubToken('ghp_validAsciiToken123'), true);
assert.equal(isValidGithubToken('bad token'), false);

assert.equal(isValidGitBranchName('feature/mobile-refactor'), true);
assert.equal(isValidGitBranchName('-danger'), false);
assert.equal(isValidGitBranchName('feature//double'), false);
assert.equal(isValidGitBranchName('bad lock.lock'), false);
assert.equal(isValidGitBranchName('release.lock'), false);

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

console.log('Utility tests passed');
