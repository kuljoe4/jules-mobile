import { LRUCache } from '../utils/cache.js';
import { isValidGitBranchName, isValidGithubRepoName, isValidGithubToken } from '../utils/validation.js';
import { getActivitiesSize } from '../utils/performance.js';
import { SafeStorage } from './storage.js';
import { GitHubApi } from './githubApi.js';

/**
 * GitHubTracker encapsulating all GitHub integrations, caches, background fetches,
 * and text-scraping to prevent "God Mode" and separate background external integrations
 * from the core UI rendering/logic inside index.html.
 */
const GitHubTracker = {
  // Caches
  PR_CACHE: new LRUCache(500),
  PR_INFO_CACHE: new LRUCache(500),
  GH_STATE_CACHE: new Map(),
  GH_IN_FLIGHT: new Set(),
  GH_BRANCH_STATE_CACHE: new Map(),
  GH_BRANCH_IN_FLIGHT: new Set(),
  GH_REPO_DEFAULT_BRANCH_CACHE: new Map(),
  GH_REPO_DEFAULT_BRANCH_IN_FLIGHT: new Set(),
  GH_DEPLOYMENT_STATE_CACHE: new Map(),
  GH_DEPLOYMENT_IN_FLIGHT: new Set(),
  CHECK_ACTIVITY_CACHE: new WeakMap(),
  CHECK_STATUS_ARRAY_CACHE: new WeakMap(),
  BRANCH_INFO_CACHE: new LRUCache(500),
  BRANCH_ACTIVITY_CACHE: new WeakMap(),
  DEPLOYMENT_INFO_CACHE: new LRUCache(500),
  PENDING_PR_PROPOSAL_CACHE: new LRUCache(500),

  // Regex Configurations
  GH_PR_RE: /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/pull\/(\d+)/,
  CHECK_URL_RE: /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/(?:actions\/runs|deployments|actions)\/\d*/,
  PUSH_RE: /push(?:ing|ed).* to (?:the |a )?([^\s\(\)\`]+)/i,
  BRANCH_RE: /branch (?:named )?([^\s\(\)\`]+)/i,
  CREATE_BRANCH_RE: /created.* branch ([^\s\(\)\`]+)/i,
  TREE_LINK_RE: /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/tree\/([a-zA-Z0-9\-_.]+)/,
  BRANCH_LINK_RE: /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/branches\/([a-zA-Z0-9\-_.]+)/,
  COMPARE_LINK_RE: /https:\/\/github\.com\/[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+\/compare\/[^\.]+\.\.\.([a-zA-Z0-9\-_.]+)/,
  PR_REPO_RE: /https:\/\/github\.com\/([a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+)\/pull/,

  // Internal Helpers
  getPrUrlAndNumber(pr) {
    if (!pr) return null;
    if (typeof pr === 'string') {
      const m = pr.match(this.GH_PR_RE);
      if (m) return { url: pr, number: m[1] };
    }
    if (typeof pr === 'object') {
      const url = pr.url || pr.pullRequestUrl || pr.prUrl || pr.htmlUrl || pr.html_url || pr.pr_url;
      if (url) {
        return { ...pr, url, number: pr.number || url.split("/").pop() };
      }
    }
    return null;
  },

  findInOutputs(outputs) {
    if (!outputs || !Array.isArray(outputs)) return null;
    for (let i = 0; i < outputs.length; i++) {
      const o = outputs[i];
      if (o.githubPullRequest) {
        const pr = this.getPrUrlAndNumber(o.githubPullRequest);
        if (pr) return pr;
      }
      if (o.pullRequest) {
        const pr = this.getPrUrlAndNumber(o.pullRequest);
        if (pr) return pr;
      }
      if (o.pr) {
        const pr = this.getPrUrlAndNumber(o.pr);
        if (pr) return pr;
      }
      const u = o.pullRequestUrl || o.prUrl || o.url || o.pr_url || o.htmlUrl || o.html_url;
      if (u && typeof u === 'string') return { url: u, number: u.split("/").pop() };
    }
    return null;
  },

  // OPTIMIZATION (Bolt): Cache PR proposal lookups including negative (null) hits using a composite key
  // combining session ID, activity count, and update/create timestamp (`${sid}:${actLen}:${ts}`).
  // Avoids redundant object property traversals and temporary array spread allocations (`[...outputs]`)
  // on every render pass, converting linear scans into instant O(1) cache hits.
  getPendingPRProposal(s, activities = []) {
    if (!s) return null;

    const sid = s.id || s.name || "temp";
    const actLen = Array.isArray(activities) ? activities.length : 0;
    const ts = s.updateTime || s.createTime || "";
    const cacheKey = `${sid}:${actLen}:${ts}`;

    if (sid !== "temp" && this.PENDING_PR_PROPOSAL_CACHE.has(cacheKey)) {
      return this.PENDING_PR_PROPOSAL_CACHE.get(cacheKey);
    }

    const checkOutputs = (outputs) => {
      if (!outputs || !Array.isArray(outputs)) return null;
      for (let j = 0; j < outputs.length; j++) {
        const o = outputs[j];
        if (o && o.pullRequest && typeof o.pullRequest === "object") {
          const pr = o.pullRequest;
          const url = pr.url || pr.pullRequestUrl || pr.prUrl || pr.htmlUrl || pr.html_url || pr.pr_url;
          if (!url && (pr.title || pr.description)) {
            return {
              title: pr.title || "",
              description: pr.description || pr.body || ""
            };
          }
        }
      }
      return null;
    };

    let result = checkOutputs(s.outputs);

    if (!result && activities && Array.isArray(activities)) {
      for (let i = activities.length - 1; i >= 0; i--) {
        const a = activities[i];
        if (!a) continue;

        result = checkOutputs(a.sessionCompleted?.outputs) || checkOutputs(a.progressUpdated?.outputs);
        if (result) break;
      }
    }

    if (sid !== "temp") {
      if (this.PENDING_PR_PROPOSAL_CACHE.size > 500) this.PENDING_PR_PROPOSAL_CACHE.clear();
      this.PENDING_PR_PROPOSAL_CACHE.set(cacheKey, result);
    }

    return result;
  },

  getPR(s) {
    if (!s) return null;
    const sid = s.id || s.name || "temp";
    const ts = s.updateTime || s.createTime || "";
    const outLen = Array.isArray(s.outputs) ? s.outputs.length : 0;
    const cacheKey = `${sid}:${ts}:${outLen}`;

    if (sid !== "temp" && this.PR_CACHE.has(cacheKey)) {
      return this.PR_CACHE.get(cacheKey);
    }

    let rawPr = this.findInOutputs(s.outputs) || s.githubPullRequest || s.pullRequest || s.sourceContext?.githubRepoContext?.pullRequest || s.github_pull_request || s.pr || s.prUrl || s.pullRequestUrl || s.htmlUrl || s.html_url;
    const pr = this.getPrUrlAndNumber(rawPr);
    if (pr) {
      if (sid !== "temp") this.PR_CACHE.set(cacheKey, pr);
      return pr;
    }

    let m = null;
    for (const key in s) {
      if (typeof s[key] === 'string') {
        m = s[key].match(this.GH_PR_RE);
        if (m) break;
      }
    }

    if (m) {
      const res = { url: m[0], number: m[1] };
      if (sid !== "temp") this.PR_CACHE.set(cacheKey, res);
      return res;
    }

    if (sid !== "temp") {
      this.PR_CACHE.set(cacheKey, null);
    }
    return null;
  },

  hasMergeEvidence(activities) {
    if (!activities || activities.length === 0) return false;

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!a) continue;

      const desc = (a.progressUpdated?.description || "").toLowerCase();
      const title = (a.progressUpdated?.title || "").toLowerCase();

      if (desc.includes("merged") ||
          desc.includes("pull request merged") ||
          title.includes("merged")) {
        return true;
      }
    }

    return false;
  },

  githubFetch(url, headers) {
    return GitHubApi.githubFetch(url, headers);
  },

  triggerGitHubFetch(url, force = false) {
    if (!force && this.GH_IN_FLIGHT.has(url)) return;

    const match = url.match(/https:\/\/github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)\/pull\/(\d+)/);
    if (!match) return;

    const [_, owner, repo, number] = match;
    const repoFull = `${owner}/${repo}`;
    if (!isValidGithubRepoName(repoFull)) return;

    this.GH_IN_FLIGHT.add(url);

    const token = SafeStorage.loadGithubToken();
    const headers = {
      "Accept": "application/vnd.github.v3+json"
    };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    this.githubFetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, headers)
      .then(prData => {
        let state = "open";
        if (prData.merged) state = "merged";
        else if (prData.state === "closed") state = "closed";

        const additions = prData.additions || 0;
        const deletions = prData.deletions || 0;
        const changedFiles = prData.changed_files || 0;
        const commitsCount = prData.commits || 0;
        const title = prData.title || "";
        const body = prData.body || "";
        const mergeable = prData.mergeable !== undefined ? prData.mergeable : null;
        const mergeableState = prData.mergeable_state || "";

        const baseRef = prData.base?.ref || "main";
        const headRef = prData.head?.ref || "main";
        const headSha = prData.head?.sha || headRef;

        // Security: URL-encode ref and commit SHA parameters to prevent REST API Endpoint Parameter Pollution
        // and URL Path Manipulation when fetching PR compare details, statuses, and check runs.
        const encBaseRef = encodeURIComponent(baseRef);
        const encHeadRef = encodeURIComponent(headRef);
        const encHeadSha = encodeURIComponent(headSha);

        const compareUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${encBaseRef}...${encHeadRef}`;
        const statusUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${encHeadSha}/status`;
        const checkRunsUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${encHeadSha}/check-runs`;
        const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/commits?per_page=10`;

        const catchErr = (err, fallback) => {
          const msg = err.message || "";
          if (msg.includes("403") || msg.includes("429") || msg.includes("422")) {
            return { _failed: true };
          }
          return fallback;
        };

        const fetchCompare = this.githubFetch(compareUrl, headers).catch(err => catchErr(err, null));
        const fetchStatus = this.githubFetch(statusUrl, headers).catch(err => catchErr(err, null));
        const fetchCheckRuns = this.githubFetch(checkRunsUrl, headers).catch(err => catchErr(err, null));
        const fetchCommits = this.githubFetch(commitsUrl, headers).catch(err => catchErr(err, []));

        return Promise.all([fetchCompare, fetchStatus, fetchCheckRuns, fetchCommits])
          .then(([compareData, statusData, checkRunsData, commitsData]) => {
            const isFailed = compareData?._failed || statusData?._failed || checkRunsData?._failed || commitsData?._failed || false;

            if (compareData?._failed) compareData = null;
            if (statusData?._failed) statusData = null;
            if (checkRunsData?._failed) checkRunsData = null;
            if (commitsData?._failed) commitsData = [];
            let ahead = 0;
            let behind = 0;
            let statusState = "identical";
            if (compareData) {
              ahead = compareData.ahead_by || 0;
              behind = compareData.behind_by || 0;
              statusState = compareData.status || "identical";
            }

            let finalState = null;
            let finalLabel = "";
            let checkCount = 0;
            let successCount = 0;
            let failureCount = 0;
            let pendingCount = 0;

            if (statusData && Array.isArray(statusData.statuses) && statusData.statuses.length > 0) {
              for (const s of statusData.statuses) {
                checkCount++;
                if (s.state === "success") successCount++;
                else if (s.state === "failure" || s.state === "error") failureCount++;
                else pendingCount++;
              }
            }

            if (checkRunsData && checkRunsData.check_runs) {
              for (const run of checkRunsData.check_runs) {
                checkCount++;
                if (run.status === "completed") {
                  if (run.conclusion === "success" || run.conclusion === "neutral") successCount++;
                  else if (run.conclusion === "failure" || run.conclusion === "timed_out" || run.conclusion === "action_required") failureCount++;
                  else successCount++;
                } else {
                  pendingCount++;
                }
              }
            }

            if (checkCount === 0) {
              finalState = "not_run";
              finalLabel = "NOT RUN";
            } else if (failureCount > 0) {
              finalState = "failure";
              finalLabel = `${successCount}/${checkCount} FAILED`;
            } else if (pendingCount > 0) {
              finalState = "pending";
              finalLabel = `${successCount}/${checkCount} RUNNING`;
            } else {
              finalState = "success";
              finalLabel = `${successCount}/${checkCount} PASSED`;
            }

            const commitsList = (Array.isArray(commitsData) ? commitsData : []).map(c => {
              const fullMsg = c.commit?.message || "";
              const lines = fullMsg.trim().split("\n");
              const title = lines[0] ? lines[0].trim() : "";
              const description = lines.slice(1).join("\n").trim();
              return {
                sha: c.sha ? c.sha.slice(0, 7) : "",
                message: fullMsg,
                title,
                description,
                author: c.commit?.author?.name || "",
                date: c.commit?.author?.date || ""
              };
            });

            const updatedInfo = {
              state,
              additions,
              deletions,
              changedFiles,
              commitsCount,
              title,
              body,
              commitsList,
              ahead,
              behind,
              statusState,
              mergeable,
              mergeableState,
              checks: finalState ? {
                state: finalState,
                label: finalLabel,
                url: checkRunsData?.check_runs?.[0]?.html_url || `https://github.com/${owner}/${repo}/actions`
              } : null,
              fetchedAt: Date.now(),
              failed: isFailed
            };

            const existing = GitHubTracker.GH_STATE_CACHE.get(url);
            if (!existing || (existing.state !== state && (state === "merged" || state === "closed"))) {
              GitHubTracker.GH_BRANCH_STATE_CACHE.clear();
              GitHubTracker.BRANCH_INFO_CACHE.clear();
            }

            GitHubTracker.GH_STATE_CACHE.set(url, updatedInfo);
            GitHubTracker.GH_IN_FLIGHT.delete(url);
            GitHubTracker.PR_INFO_CACHE.clear();

            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { url, ...updatedInfo } }));
            }
          });
      })
      .catch(err => {
        GitHubTracker.GH_IN_FLIGHT.delete(url);
        GitHubTracker.GH_STATE_CACHE.set(url, {
          state: "open",
          additions: 0,
          deletions: 0,
          changedFiles: 0,
          commitsCount: 0,
          title: "",
          body: "",
          commitsList: [],
          ahead: 0,
          behind: 0,
          statusState: "identical",
          checks: null,
          fetchedAt: Date.now(),
          failed: true,
          errorMsg: err.message
        });
        GitHubTracker.PR_INFO_CACHE.clear();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { url, failed: true } }));
        }
      });
  },

  triggerRepoDefaultBranchFetch(repo, force = false) {
    if (!repo || !isValidGithubRepoName(repo)) return;
    if (!force && this.GH_REPO_DEFAULT_BRANCH_IN_FLIGHT.has(repo)) return;

    this.GH_REPO_DEFAULT_BRANCH_IN_FLIGHT.add(repo);

    const token = SafeStorage.loadGithubToken();
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    this.githubFetch(`https://api.github.com/repos/${repo}`, headers)
      .then(repoData => {
        const defaultBranch = repoData.default_branch || "main";
        this.GH_REPO_DEFAULT_BRANCH_CACHE.set(repo, defaultBranch);
        this.GH_REPO_DEFAULT_BRANCH_IN_FLIGHT.delete(repo);
        this.BRANCH_INFO_CACHE.clear();
        window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { repo, defaultBranch } }));
      })
      .catch(err => {
        this.GH_REPO_DEFAULT_BRANCH_IN_FLIGHT.delete(repo);
        this.GH_REPO_DEFAULT_BRANCH_CACHE.set(repo, "main");
        this.BRANCH_INFO_CACHE.clear();
      });
  },

  triggerGitHubDeploymentFetch(rawRepo, force = false) {
    if (!rawRepo) return;
    let repo = rawRepo.trim().replace(/^sources\/github\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    if (!isValidGithubRepoName(repo)) return;
    if (!force && this.GH_DEPLOYMENT_IN_FLIGHT.has(repo)) return;

    this.GH_DEPLOYMENT_IN_FLIGHT.add(repo);

    const token = SafeStorage.loadGithubToken();
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    const deploymentsUrl = `https://api.github.com/repos/${repo}/deployments?per_page=5`;

    this.githubFetch(deploymentsUrl, headers)
      .then(deployments => {
        if (!Array.isArray(deployments) || deployments.length === 0) {
          const info = { deployment: null, fetchedAt: Date.now() };
          this.GH_DEPLOYMENT_STATE_CACHE.set(repo, info);
          this.GH_DEPLOYMENT_IN_FLIGHT.delete(repo);
          this.BRANCH_INFO_CACHE.clear();
          return;
        }

        const latest = deployments[0];
        const statusUrl = `https://api.github.com/repos/${repo}/deployments/${latest.id}/statuses`;

        return this.githubFetch(statusUrl, headers)
          .then(statuses => {
            const latestStatus = (Array.isArray(statuses) && statuses.length > 0) ? statuses[0] : null;
            const state = latestStatus?.state || "queued";
            let label = "DEPLOYING";
            if (state === "success") label = "DEPLOYED";
            else if (state === "failure" || state === "error") label = "DEPLOY FAILED";
            else if (state === "in_progress" || state === "queued" || state === "pending") label = "DEPLOYING";

            const deploymentInfo = {
              id: latest.id,
              environment: latest.environment || "github-pages",
              state,
              label,
              environmentUrl: latestStatus?.environment_url || latest.environment_url || null,
              targetUrl: latestStatus?.target_url || latest.statuses_url || `https://github.com/${repo}/deployments`,
              updatedAt: latestStatus?.created_at || latest.created_at || null,
              fetchedAt: Date.now()
            };

            this.GH_DEPLOYMENT_STATE_CACHE.set(repo, deploymentInfo);
            this.GH_DEPLOYMENT_IN_FLIGHT.delete(repo);
            this.BRANCH_INFO_CACHE.clear();
            window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { repo, deployment: deploymentInfo } }));
          });
      })
      .catch(err => {
        this.GH_DEPLOYMENT_IN_FLIGHT.delete(repo);
        this.GH_DEPLOYMENT_STATE_CACHE.set(repo, { deployment: null, failed: true, fetchedAt: Date.now() });
      });
  },

  getDeploymentInfo(rawRepo, force = false) {
    if (!rawRepo) return null;
    let repo = rawRepo.trim().replace(/^sources\/github\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    if (!isValidGithubRepoName(repo)) return null;

    const cached = this.GH_DEPLOYMENT_STATE_CACHE.get(repo);
    // If it's a negative cache hit (null), or if it failed, increase TTL to 5 minutes to avoid spamming
    const ttl = (cached && (cached.deployment === null || cached.failed)) ? 5 * 60 * 1000 : 30 * 1000;
    if (!force && cached && (Date.now() - cached.fetchedAt < ttl)) {
      return cached.deployment === null ? null : cached;
    }

    this.triggerGitHubDeploymentFetch(repo, force);
    return (cached && cached.deployment !== null) ? cached : null;
  },

  async deleteBranch(repo, branch) {
    const { cleanRepo, cleanBranch } = await GitHubApi.deleteBranch(repo, branch);

    this.GH_BRANCH_STATE_CACHE.clear();
    this.BRANCH_INFO_CACHE.clear();
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { repo: cleanRepo, deletedBranch: cleanBranch } }));
    return true;
  },

  triggerGitHubBranchFetch(repo, base, working, force = false) {
    if (!repo || !base || !working) return;
    if (!isValidGithubRepoName(repo)) return;
    if (!isValidGitBranchName(base) || !isValidGitBranchName(working)) return;
    const encBase = encodeURIComponent(base);
    const encWorking = encodeURIComponent(working);
    const key = `${repo}:${base}:${working}`;
    if (!force && this.GH_BRANCH_IN_FLIGHT.has(key)) return;

    this.GH_BRANCH_IN_FLIGHT.add(key);

    const token = SafeStorage.loadGithubToken();
    const headers = {
      "Accept": "application/vnd.github.v3+json"
    };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    const compareUrl = `https://api.github.com/repos/${repo}/compare/${encBase}...${encWorking}`;
    const statusUrl = `https://api.github.com/repos/${repo}/commits/${encWorking}/status`;
    const checkRunsUrl = `https://api.github.com/repos/${repo}/commits/${encWorking}/check-runs`;
    const owner = repo.split("/")[0] || "";
    const pullsUrl = `https://api.github.com/repos/${repo}/pulls?head=${encodeURIComponent(owner)}:${encWorking}&state=all`;

    const catchErr = (err, fallback) => {
      const msg = err.message || "";
      if (msg.includes("403") || msg.includes("429") || msg.includes("422")) {
        return { _failed: true };
      }
      return fallback;
    };

    const fetchCompare = this.githubFetch(compareUrl, headers).catch(err => catchErr(err, null));
    const fetchStatus = this.githubFetch(statusUrl, headers).catch(err => catchErr(err, null));
    const fetchCheckRuns = this.githubFetch(checkRunsUrl, headers).catch(err => catchErr(err, null));
    const fetchPulls = this.githubFetch(pullsUrl, headers).catch(err => catchErr(err, []));

    Promise.all([fetchCompare, fetchStatus, fetchCheckRuns, fetchPulls])
      .then(([compareData, statusData, checkRunsData, pullsData]) => {
        const isFailed = compareData?._failed || statusData?._failed || checkRunsData?._failed || pullsData?._failed || false;

        if (compareData?._failed) compareData = null;
        if (statusData?._failed) statusData = null;
        if (checkRunsData?._failed) checkRunsData = null;
        if (pullsData?._failed) pullsData = [];
        let ahead = 0;
        let behind = 0;
        let statusState = "identical";
        if (compareData) {
          ahead = compareData.ahead_by || 0;
          behind = compareData.behind_by || 0;
          statusState = compareData.status || "identical";
        }

        let finalState = null;
        let finalLabel = "";
        let checkCount = 0;
        let successCount = 0;
        let failureCount = 0;
        let pendingCount = 0;

            if (statusData && Array.isArray(statusData.statuses) && statusData.statuses.length > 0) {
              for (const s of statusData.statuses) {
            checkCount++;
                if (s.state === "success") successCount++;
                else if (s.state === "failure" || s.state === "error") failureCount++;
                else pendingCount++;
          }
        }

        if (checkRunsData && checkRunsData.check_runs) {
          for (const run of checkRunsData.check_runs) {
            checkCount++;
            if (run.status === "completed") {
              if (run.conclusion === "success" || run.conclusion === "neutral") successCount++;
              else if (run.conclusion === "failure" || run.conclusion === "timed_out" || run.conclusion === "action_required") failureCount++;
              else successCount++;
            } else {
              pendingCount++;
            }
          }
        }

        if (checkCount === 0) {
          finalState = "not_run";
          finalLabel = "NOT RUN";
        } else if (failureCount > 0) {
          finalState = "failure";
          finalLabel = `${successCount}/${checkCount} FAILED`;
        } else if (pendingCount > 0) {
          finalState = "pending";
          finalLabel = `${successCount}/${checkCount} RUNNING`;
        } else {
          finalState = "success";
          finalLabel = `${successCount}/${checkCount} PASSED`;
        }

        const branchCommits = (compareData?.commits || []).map(c => {
          const fullMsg = c.commit?.message || "";
          const lines = fullMsg.trim().split("\n");
          const title = lines[0] ? lines[0].trim() : "";
          const description = lines.slice(1).join("\n").trim();
          return {
            sha: c.sha ? c.sha.slice(0, 7) : "",
            message: fullMsg,
            title,
            description,
            author: c.commit?.author?.name || "",
            date: c.commit?.author?.date || "",
            source: "compare"
          };
        });

        let livePR = null;
        if (Array.isArray(pullsData) && pullsData.length > 0) {
          const prObj = pullsData[0];
          livePR = {
            url: prObj.html_url || prObj.url,
            number: prObj.number,
            state: prObj.merged_at ? "merged" : (prObj.state || "open"),
            title: prObj.title || "",
            body: prObj.body || "",
            ahead,
            behind
          };
        }

        const updatedInfo = {
          ahead,
          behind,
          statusState,
          commits: branchCommits,
          checks: finalState ? {
            state: finalState,
            label: finalLabel,
            url: checkRunsData?.check_runs?.[0]?.html_url || `https://github.com/${repo}/actions`
          } : null,
          livePR,
          fetchedAt: Date.now(),
          failed: isFailed
        };

        GitHubTracker.GH_BRANCH_STATE_CACHE.set(key, updatedInfo);
        GitHubTracker.GH_BRANCH_IN_FLIGHT.delete(key);
        GitHubTracker.BRANCH_INFO_CACHE.clear();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { key, ...updatedInfo } }));
        }
      })
      .catch(err => {
        GitHubTracker.GH_BRANCH_IN_FLIGHT.delete(key);
        GitHubTracker.GH_BRANCH_STATE_CACHE.set(key, {
          ahead: 0,
          behind: 0,
          statusState: "identical",
          checks: null,
          fetchedAt: Date.now(),
          failed: true,
          errorMsg: err.message
        });
        GitHubTracker.BRANCH_INFO_CACHE.clear();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { key, failed: true } }));
        }
      });
  },

  async createPullRequest(params) {
    const data = await GitHubApi.createPullRequest(params);
    if (data.html_url) {
      this.GH_STATE_CACHE.delete(data.html_url);
      this.triggerGitHubFetch(data.html_url, true);
    }
    return data;
  },

  async mergeBranch(params) {
    const { data, repo } = await GitHubApi.mergeBranch(params);

    this.GH_BRANCH_STATE_CACHE.clear();
    this.BRANCH_INFO_CACHE.clear();
    this.PR_INFO_CACHE.clear();
    this.PENDING_PR_PROPOSAL_CACHE.clear();

    if (typeof window !== "undefined") {
      let head = (params.head || "").trim().replace(/^refs\/heads\//, "");
      let base = (params.base || "main").trim().replace(/^refs\/heads\//, "");
      window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { repo, mergedBranch: head, intoBase: base } }));
    }

    return data;
  },

  async createAndMergePR({ repo, head, base = "main", title, body, mergeMethod = "merge" }) {
    const pr = await this.createPullRequest({ repo, head, base, title, body });
    if (!pr || !pr.html_url) {
      throw new Error("Pull Request was created but HTML URL was not returned.");
    }
    const mergeRes = await this.mergePullRequest(pr.html_url, mergeMethod);
    return { pr, mergeRes };
  },

  async mergePullRequest(url, mergeMethod = "merge") {
    const { data } = await GitHubApi.mergePullRequest(url, mergeMethod);

    this.PR_INFO_CACHE.clear();
    this.PENDING_PR_PROPOSAL_CACHE.clear();
    this.GH_BRANCH_STATE_CACHE.clear();
    this.BRANCH_INFO_CACHE.clear();
    const existing = this.GH_STATE_CACHE.get(url) || {};
    const updatedInfo = {
      ...existing,
      state: "merged",
      fetchedAt: Date.now(),
      failed: false
    };
    this.GH_STATE_CACHE.set(url, updatedInfo);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("gh-pr-updated", { detail: { url, ...updatedInfo } }));
    this.triggerGitHubFetch(url, true);
    return data;
  },

  getPRInfo(s, activities = [], force = false) {
    if (!s) return null;

    const sid = s.id || s.name || "temp";
    const actLen = activities.length;
    const size = getActivitiesSize(activities);
    const cacheKey = `${sid}:${actLen}:${size}:${s.updateTime || s.createTime || ""}`;

    if (!force && sid !== "temp" && this.PR_INFO_CACHE.has(cacheKey)) {
      const cached = this.PR_INFO_CACHE.get(cacheKey);
      if (cached && cached.expiresAt && Date.now() < cached.expiresAt) {
        return cached;
      } else if (cached) {
        this.PR_INFO_CACHE.delete(cacheKey);
      }
    }

    const prOnSession = this.getPR(s);
    let pr = prOnSession;

    if (!pr && activities && activities.length > 0) {
      for (let i = activities.length - 1; i >= 0; i--) {
        const a = activities[i];
        let actPR = this.findInOutputs(a.sessionCompleted?.outputs) || this.findInOutputs(a.progressUpdated?.outputs);
        if (!actPR) {
          const rawActPR = a.sessionCompleted?.outputs?.find(o => o.githubPullRequest)?.githubPullRequest ||
                           a.progressUpdated?.outputs?.find(o => o.githubPullRequest)?.githubPullRequest ||
                           a.sessionCompleted?.githubPullRequest || a.progressUpdated?.githubPullRequest ||
                           a.sessionCompleted?.pullRequest || a.progressUpdated?.pullRequest;
          actPR = this.getPrUrlAndNumber(rawActPR);
        }
        if (actPR) {
          pr = actPR;
          break;
        }

        const desc = a.progressUpdated?.description || a.userMessaged?.userMessage || a.agentMessaged?.agentMessage || a.description || "";
        const title = a.progressUpdated?.title || a.title || "";
        const reason = a.sessionFailed?.reason || "";
        const match = desc.match(this.GH_PR_RE);
        if (!match) {
          const matchTitle = title.match(this.GH_PR_RE);
          if (matchTitle) {
            pr = { url: matchTitle[0], number: matchTitle[1] };
            break;
          }
          const matchReason = reason.match(this.GH_PR_RE);
          if (matchReason) {
            pr = { url: matchReason[0], number: matchReason[1] };
            break;
          }
        } else {
          pr = { url: match[0], number: match[1] };
          break;
        }
      }
    }

    if (!pr) {
      return null;
    }

    const isMergedFallback = this.hasMergeEvidence(activities);
    let state = isMergedFallback ? "merged" : "open";
    let additions = 0, deletions = 0, changedFiles = 0, commitsCount = 0;
    let prTitle = "", prBody = "", commitsList = [];
    let ahead = 0, behind = 0, statusState = "identical", checks = null;
    let failed = false;

    const ghCached = this.GH_STATE_CACHE.get(pr.url);
    const ttl = (ghCached && ghCached.state === "open" && !ghCached.failed) ? 30 * 1000 : 5 * 60 * 1000;
    let fetchedAt = null;
    if (!force && ghCached && (Date.now() - ghCached.fetchedAt < ttl)) {
      state = ghCached.state;
      additions = ghCached.additions;
      deletions = ghCached.deletions;
      changedFiles = ghCached.changedFiles;
      commitsCount = ghCached.commitsCount;
      prTitle = ghCached.title;
      prBody = ghCached.body;
      commitsList = ghCached.commitsList;
      ahead = ghCached.ahead || 0;
      behind = ghCached.behind || 0;
      statusState = ghCached.statusState || "identical";
      checks = ghCached.checks || null;
      failed = ghCached.failed || false;
      fetchedAt = ghCached.fetchedAt;
    } else {
      this.triggerGitHubFetch(pr.url, force);
    }

    const result = {
      ...pr,
      state,
      additions,
      deletions,
      changedFiles,
      commitsCount,
      title: prTitle,
      body: prBody,
      commitsList,
      ahead,
      behind,
      statusState,
      checks,
      fetchedAt,
      failed,
      expiresAt: Date.now() + (5 * 60 * 1000)
    };

    if (sid !== "temp") {
      if (this.PR_INFO_CACHE.size > 500) this.PR_INFO_CACHE.clear();
      this.PR_INFO_CACHE.set(cacheKey, result);
    }

    return result;
  },

  getCheckStatus(activities = []) {
    if (!activities || !Array.isArray(activities)) return null;
    const cachedResult = this.CHECK_STATUS_ARRAY_CACHE.get(activities);
    if (cachedResult !== undefined) return cachedResult;

    let status = null;
    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!a) continue;

      if (!this.CHECK_ACTIVITY_CACHE.has(a)) {
        let actStatus = null;
        const pu = a.progressUpdated;
        if (pu) {
          const desc = (pu.description || "").toLowerCase();
          const title = (pu.title || "").toLowerCase();

          const isSignal = desc.includes("check") || desc.includes("workflow") || desc.includes("deploy") || desc.includes("action") ||
                           title.includes("check") || title.includes("workflow") || title.includes("deploy");

          if (isSignal) {
            if (desc.includes("failed") || desc.includes("failure") || desc.includes("error")) {
              actStatus = { state: "failure", label: desc.includes("deploy") ? "DEPLOY FAILED" : "CHECKS FAILED" };
            } else if (desc.includes("running") || desc.includes("pending") || desc.includes("started") || desc.includes("progress")) {
              actStatus = { state: "pending", label: desc.includes("deploy") ? "DEPLOYING" : "CHECKS RUNNING" };
            } else if (desc.includes("passed") || desc.includes("success") || desc.includes("completed") || desc.includes("verified")) {
              actStatus = { state: "success", label: desc.includes("deploy") ? "DEPLOYED" : "CHECKS PASSED" };
            }

            const urlMatch = (pu.description || "").match(this.CHECK_URL_RE);
            if (urlMatch && actStatus) actStatus.url = urlMatch[0];
          }
        }
        this.CHECK_ACTIVITY_CACHE.set(a, actStatus);
      }

      const actStatus = this.CHECK_ACTIVITY_CACHE.get(a);
      if (actStatus) {
        status = actStatus;
      }
    }
    this.CHECK_STATUS_ARRAY_CACHE.set(activities, status);
    return status;
  },

  getBranchInfo(s, activities = [], force = false) {
    if (!s) return null;
    const sid = s.id || s.name || "temp";
    const actLen = activities.length;
    const size = getActivitiesSize(activities);
    const cacheKey = `${sid}:${actLen}:${size}:${s.updateTime || s.createTime || ""}`;
    if (!force && sid !== "temp" && this.BRANCH_INFO_CACHE.has(cacheKey)) return this.BRANCH_INFO_CACHE.get(cacheKey);

    let repo = s.sourceContext?.source?.replace("sources/github/","");
    if (!repo || repo.startsWith("sources/")) {
      const pr = this.getPR(s);
      if (pr && pr.url) {
        const m = pr.url.match(this.PR_REPO_RE);
        if (m) repo = m[1];
      }
    }

    const fetchedDefaultBranch = repo ? this.GH_REPO_DEFAULT_BRANCH_CACHE.get(repo) : null;
    if (repo && !fetchedDefaultBranch) {
      this.triggerRepoDefaultBranchFetch(repo);
    }

    const context = s.sourceContext?.githubRepoContext;
    const base = context?.startingBranch || fetchedDefaultBranch || "main";

    let working = null;

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!a) continue;

      if (!this.BRANCH_ACTIVITY_CACHE.has(a)) {
        let pushBranch = null;
        const desc1 = a.progressUpdated?.description || "";
        const m1 = desc1.match(this.PUSH_RE) || desc1.match(this.BRANCH_RE) || desc1.match(this.CREATE_BRANCH_RE);
        if (m1) {
          const bname = m1[1].replace(/\.$/, "").replace(/^['"`]+|['"`]+$/g, "");
          if (bname !== "main" && bname !== "master") {
            pushBranch = bname;
          }
        }

        const desc2 = a.progressUpdated?.description || a.userMessaged?.userMessage || a.agentMessaged?.agentMessage || a.description || "";
        const title2 = a.progressUpdated?.title || a.title || "";

        let treeBranch = null;
        const m2 = desc2.match(this.TREE_LINK_RE) || title2.match(this.TREE_LINK_RE);
        if (m2) {
          treeBranch = m2[1];
        }

        let compareBranch = null;
        const m3 = desc2.match(this.BRANCH_LINK_RE) || desc2.match(this.COMPARE_LINK_RE) || title2.match(this.BRANCH_LINK_RE) || title2.match(this.COMPARE_LINK_RE);
        if (m3) {
          compareBranch = m3[1];
        }

        this.BRANCH_ACTIVITY_CACHE.set(a, { pushBranch, treeBranch, compareBranch });
      }
    }

    for (let i = 0; i < activities.length; i++) {
      const a = activities[i];
      if (!a) continue;
      const cached = this.BRANCH_ACTIVITY_CACHE.get(a);
      if (cached && cached.pushBranch) {
        working = cached.pushBranch;
      }
    }

    if (!working) {
      let linkMatch = null;
      const sTexts = [s.title || "", s.prompt || ""];
      for (const t of sTexts) {
        linkMatch = t.match(this.TREE_LINK_RE);
        if (linkMatch) { working = linkMatch[1]; break; }
      }

      if (!working) {
        for (let i = 0; i < activities.length; i++) {
          const a = activities[i];
          if (!a) continue;
          const cached = this.BRANCH_ACTIVITY_CACHE.get(a);
          if (cached && cached.treeBranch) {
            working = cached.treeBranch;
            break;
          }
        }
      }

      if (!working) {
        for (const t of sTexts) {
          linkMatch = t.match(this.BRANCH_LINK_RE) || t.match(this.COMPARE_LINK_RE);
          if (linkMatch) { working = linkMatch[1]; break; }
        }
        if (!working) {
          for (let i = 0; i < activities.length; i++) {
            const a = activities[i];
            if (!a) continue;
            const cached = this.BRANCH_ACTIVITY_CACHE.get(a);
            if (cached && cached.compareBranch) {
              working = cached.compareBranch;
              break;
            }
          }
        }
      }
    }

    const repoUrl = repo && !repo.startsWith("sources/") && isValidGithubRepoName(repo) ? `https://github.com/${repo}` : null;

    let ahead = 0;
    let behind = 0;
    let statusState = "identical";
    let commits = [];
    let checks = null;
    let livePR = null;
    let checksSource = "working";
    let failed = false;
    let fetchedAt = null;

    const activeWorking = working || base;
    if (sid !== "temp" && repo && base) {
      if (activeWorking && activeWorking !== base) {
        const bKey = `${repo}:${base}:${activeWorking}`;
        const bCached = this.GH_BRANCH_STATE_CACHE.get(bKey);
        const bTtl = bCached?.failed ? 5 * 60 * 1000 : 30 * 1000;
        if (!force && bCached && (Date.now() - bCached.fetchedAt < bTtl)) {
          ahead = bCached.ahead || 0;
          behind = bCached.behind || 0;
          statusState = bCached.statusState || "identical";
          commits = bCached.commits || [];
          checks = bCached.checks || null;
          livePR = bCached.livePR || null;
          fetchedAt = bCached.fetchedAt;
          failed = bCached.failed || false;
        } else {
          this.triggerGitHubBranchFetch(repo, base, activeWorking, force);
        }
      }

      // Fallback: If working branch has no checks available, check base (default) branch checks
      if (!checks && base) {
        const defaultKey = `${repo}:${base}:${base}`;
        const defaultCached = this.GH_BRANCH_STATE_CACHE.get(defaultKey);
        const defaultTtl = defaultCached?.failed ? 5 * 60 * 1000 : 30 * 1000;
        if (defaultCached && (Date.now() - defaultCached.fetchedAt < defaultTtl)) {
          checks = defaultCached.checks || null;
          if (checks) checksSource = "base";
          if (!fetchedAt) fetchedAt = defaultCached.fetchedAt;
        } else {
          this.triggerGitHubBranchFetch(repo, base, base, force);
        }
      }
    }

    const deployment = repo ? this.getDeploymentInfo(repo, force) : null;

    // Activity-based Commit Extraction Fallback
    // If remote commits list is empty AND working branch is distinct from base,
    // build fallback commit objects from session activities
    if (activeWorking && activeWorking !== base && (!commits || commits.length === 0) && activities && activities.length > 0) {
      const fallbackCommits = [];
      const seenMsgs = new Set();

      for (let i = activities.length - 1; i >= 0; i--) {
        const a = activities[i];
        if (!a) continue;

        const pu = a.progressUpdated;
        const titleText = (pu?.title || "").trim();
        const descText = (pu?.description || "").trim();

        if (titleText || descText) {
          const isPush = descText.toLowerCase().includes("push") || descText.toLowerCase().includes("branch") || titleText.toLowerCase().includes("commit") || titleText.toLowerCase().includes("push");
          const hasPatch = Array.isArray(a.artifacts) && a.artifacts.some(art => art.changeSet?.gitPatch);

          if (isPush || hasPatch) {
            const fullMsg = descText || titleText;
            if (!seenMsgs.has(fullMsg)) {
              seenMsgs.add(fullMsg);
              const lines = fullMsg.split("\n");
              const commitTitle = lines[0].trim();
              const commitDesc = lines.slice(1).join("\n").trim();

              fallbackCommits.push({
                sha: (a.id || "").slice(-7) || "ahead",
                message: fullMsg,
                title: commitTitle,
                description: commitDesc,
                author: "Jules",
                date: a.createTime || "",
                source: "activity"
              });
            }
          }
        }
      }

      if (fallbackCommits.length > 0) {
        commits = fallbackCommits;
      }
    }

    const res = {
      base,
      working: activeWorking,
      repo: repoUrl ? repo : null,
      repoUrl,
      isNew: activeWorking && activeWorking !== base,
      ahead,
      behind,
      statusState,
      commits,
      checks,
      livePR,
      checksSource,
      deployment,
      fetchedAt,
      failed
    };
    if (sid !== "temp") {
      if (this.BRANCH_INFO_CACHE.size > 500) this.BRANCH_INFO_CACHE.clear();
      this.BRANCH_INFO_CACHE.set(cacheKey, res);
    }
    return res;
  }
};

/**
 * Backward-compatible barrel wrappers that delegate to the centralized GitHubTracker service.
 * This decouples GitHub REST API queries, caching, and text-scraping from the main UI file scope.
 */
const getPR = (s) => GitHubTracker.getPR(s);
const getPRInfo = (s, activities = [], force = false) => GitHubTracker.getPRInfo(s, activities, force);
const getBranchInfo = (s, activities = [], force = false) => GitHubTracker.getBranchInfo(s, activities, force);
const getCheckStatus = (activities = []) => GitHubTracker.getCheckStatus(activities);
const getDeploymentInfo = (repo, force = false) => GitHubTracker.getDeploymentInfo(repo, force);
const getPrUrlAndNumber = (pr) => GitHubTracker.getPrUrlAndNumber(pr);
const createPullRequest = (params) => GitHubTracker.createPullRequest(params);
const mergePullRequest = (url, mergeMethod) => GitHubTracker.mergePullRequest(url, mergeMethod);
const mergeBranch = (params) => GitHubTracker.mergeBranch(params);
const createAndMergePR = (params) => GitHubTracker.createAndMergePR(params);
const deleteBranch = (repo, branch) => GitHubTracker.deleteBranch(repo, branch);
const getPendingPRProposal = (s, activities = []) => GitHubTracker.getPendingPRProposal(s, activities);

export { GitHubTracker, getPR, getPRInfo, getBranchInfo, getCheckStatus, getDeploymentInfo, getPrUrlAndNumber, createPullRequest, mergePullRequest, mergeBranch, createAndMergePR, deleteBranch, getPendingPRProposal };
