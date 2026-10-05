import { SafeStorage } from './storage.js';
import { isValidGitBranchName, isValidGithubRepoName, isValidGithubToken } from '../utils/validation.js';

export const GitHubApi = {
  async fetchRepoData(repo) {
    const token = SafeStorage.loadGithubToken();
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }
    return this.githubFetch(`https://api.github.com/repos/${repo}`, headers);
  },

  async fetchDeploymentData(repo) {
    const token = SafeStorage.loadGithubToken();
    const headers = { "Accept": "application/vnd.github.v3+json" };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    const deploymentsUrl = `https://api.github.com/repos/${repo}/deployments?per_page=5`;
    const deployments = await this.githubFetch(deploymentsUrl, headers);

    let statuses = null;
    if (Array.isArray(deployments) && deployments.length > 0) {
      const latest = deployments[0];
      const statusUrl = `https://api.github.com/repos/${repo}/deployments/${latest.id}/statuses`;
      statuses = await this.githubFetch(statusUrl, headers);
    }
    return { deployments, statuses };
  },

  async fetchBranchData(repo, base, working) {
    const token = SafeStorage.loadGithubToken();
    const headers = {
      "Accept": "application/vnd.github.v3+json"
    };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    const encBase = encodeURIComponent(base);
    const encWorking = encodeURIComponent(working);

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

    const [compareData, statusData, checkRunsData, pullsData] = await Promise.all([
      fetchCompare, fetchStatus, fetchCheckRuns, fetchPulls
    ]);

    return { compareData, statusData, checkRunsData, pullsData };
  },

  async fetchPullRequestData(owner, repo, number) {
    const token = SafeStorage.loadGithubToken();
    const headers = {
      "Accept": "application/vnd.github.v3+json"
    };
    if (token && isValidGithubToken(token)) {
      headers["Authorization"] = `token ${token}`;
    }

    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
    const prData = await this.githubFetch(prUrl, headers);

    const baseRef = prData.base?.ref || "main";
    const headRef = prData.head?.ref || "main";
    const headSha = prData.head?.sha || headRef;

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

    const [compareData, statusData, checkRunsData, commitsData] = await Promise.all([
      fetchCompare, fetchStatus, fetchCheckRuns, fetchCommits
    ]);

    return {
      prData,
      compareData,
      statusData,
      checkRunsData,
      commitsData
    };
  },

  githubFetch(url, headers) {
    const controller = new AbortController();
    const timeoutMs = SafeStorage.loadApiTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { headers, signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          if ((res.status === 403 || res.status === 429) && res.headers.get("x-ratelimit-remaining") === "0") {
            const resetTime = res.headers.get("x-ratelimit-reset");
            const resetDate = resetTime ? new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString() : "soon";
            if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("gh-rate-limited", { detail: { resetAt: resetDate } }));
          }
          throw new Error(`Status ${res.status}`);
        }
        return res.json();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          throw new Error(`GitHub API request timed out after ${timeoutMs}ms`);
        }
        throw err;
      });
  },

  async deleteBranch(repo, branch) {
    let cleanRepo = (repo || "").trim().replace(/^sources\/github\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    let cleanBranch = (branch || "").trim().replace(/^refs\/heads\//, "");

    if (!cleanRepo || !isValidGithubRepoName(cleanRepo)) {
      throw new Error("Invalid repository format for branch deletion");
    }
    if (!cleanBranch || !isValidGitBranchName(cleanBranch)) {
      throw new Error("Invalid branch name for deletion");
    }

    const PROTECTED_BRANCHES = new Set(["main", "master", "develop", "trunk", "gh-pages", "production"]);
    if (PROTECTED_BRANCHES.has(cleanBranch.toLowerCase())) {
      throw new Error(`Deletion of protected primary branch '${cleanBranch}' is strictly prohibited.`);
    }

    const token = SafeStorage.loadGithubToken();
    if (!token || !isValidGithubToken(token)) {
      throw new Error("GitHub Token required to delete branch. Please set your token in Settings.");
    }

    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `token ${token}`
    };

    const encBranch = encodeURIComponent(cleanBranch);
    const apiUrl = `https://api.github.com/repos/${cleanRepo}/git/refs/heads/${encBranch}`;
    const controller = new AbortController();
    const timeoutMs = SafeStorage.loadApiTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(apiUrl, {
        method: "DELETE",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Failed to delete branch (Status ${res.status})`);
      }

      return { cleanRepo, cleanBranch };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  async createPullRequest(params) {
    let { repo: rawRepo, head: rawHead, base: rawBase = "main", title, body } = params;
    let repo = (rawRepo || "").trim().replace(/^sources\/github\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    let head = (rawHead || "").trim().replace(/^refs\/heads\//, "");
    let base = (rawBase || "main").trim().replace(/^refs\/heads\//, "");

    if (!repo || !isValidGithubRepoName(repo)) {
      throw new Error(`Invalid GitHub repository format ("${rawRepo || repo}"). Expected "owner/repo".`);
    }
    if (!head || !isValidGitBranchName(head)) {
      throw new Error(`Invalid head branch name ("${rawHead || head}").`);
    }
    if (base && !isValidGitBranchName(base)) {
      throw new Error(`Invalid base branch name ("${rawBase || base}").`);
    }
    if (head.toLowerCase() === base.toLowerCase()) {
      throw new Error(`Head branch ("${head}") cannot be identical to base branch ("${base}"). Please specify a feature branch.`);
    }
    const token = SafeStorage.loadGithubToken();
    if (!token || !isValidGithubToken(token)) {
      throw new Error("GitHub Token required to create PR. Please set your token in Settings.");
    }

    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "Authorization": `token ${token}`
    };

    const apiUrl = `https://api.github.com/repos/${repo}/pulls`;
    const controller = new AbortController();
    const timeoutMs = SafeStorage.loadApiTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const cleanTitle = (typeof title === "string" ? title : "").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, 250);
    const cleanBody = (typeof body === "string" ? body : "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 10000);
    const finalTitle = cleanTitle || `Merge changes from ${head}`;
    const finalBody = cleanBody || "Created via Jules Mobile Client";

    const repoOwner = repo.split("/")[0] || "";
    const qualifiedHead = head.includes(":") ? head : (repoOwner ? `${repoOwner}:${head}` : head);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: finalTitle,
          head: qualifiedHead,
          base: base || "main",
          body: finalBody
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        let errDetail = data.message || `Failed to create PR (Status ${res.status})`;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          const formattedErrors = data.errors
            .map(e => e.message ? e.message : (e.field ? `${e.field}: ${e.code}` : JSON.stringify(e)))
            .join("; ");
          errDetail = `${data.message || "Validation Failed"}: ${formattedErrors}`;
        }
        throw new Error(errDetail);
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  async mergeBranch(params) {
    let { repo: rawRepo, base: rawBase = "main", head: rawHead, commitMessage } = params;
    let repo = (rawRepo || "").trim().replace(/^sources\/github\//, "").replace(/\.git$/, "").replace(/\/$/, "");
    let base = (rawBase || "main").trim().replace(/^refs\/heads\//, "");
    let head = (rawHead || "").trim().replace(/^refs\/heads\//, "");

    if (!repo || !isValidGithubRepoName(repo)) {
      throw new Error(`Invalid GitHub repository format ("${rawRepo || repo}"). Expected "owner/repo".`);
    }
    if (!head || !isValidGitBranchName(head)) {
      throw new Error(`Invalid head branch name ("${rawHead || head}").`);
    }
    if (!base || !isValidGitBranchName(base)) {
      throw new Error(`Invalid base branch name ("${rawBase || base}").`);
    }
    if (head.toLowerCase() === base.toLowerCase()) {
      throw new Error(`Head branch ("${head}") cannot be identical to base branch ("${base}").`);
    }

    const token = SafeStorage.loadGithubToken();
    if (!token || !isValidGithubToken(token)) {
      throw new Error("GitHub Token required to merge branch. Please set your token in Settings.");
    }

    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "Authorization": `token ${token}`
    };

    const apiUrl = `https://api.github.com/repos/${repo}/merges`;
    const controller = new AbortController();
    const timeoutMs = SafeStorage.loadApiTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const cleanMsg = (typeof commitMessage === "string" ? commitMessage : "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim().slice(0, 2000);
    const finalMsg = cleanMsg || `Merge branch '${head}' into '${base}'`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          base,
          head,
          commit_message: finalMsg
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to merge branch (Status ${res.status})`);
      }

      return { data, repo };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  },

  async mergePullRequest(url, mergeMethod = "merge") {
    const match = url.match(/https:\/\/github\.com\/([a-zA-Z0-9\-_.]+)\/([a-zA-Z0-9\-_.]+)\/pull\/(\d+)/);
    if (!match) throw new Error("Invalid GitHub Pull Request URL");

    const [_, owner, repo, number] = match;
    const repoFull = `${owner}/${repo}`;
    if (!isValidGithubRepoName(repoFull)) {
      throw new Error("Invalid GitHub repository format in URL");
    }

    const validMethods = new Set(["merge", "squash", "rebase"]);
    const safeMergeMethod = validMethods.has(mergeMethod) ? mergeMethod : "merge";

    const token = SafeStorage.loadGithubToken();
    if (!token || !isValidGithubToken(token)) {
      throw new Error("GitHub Token required to merge PR. Please set your token in Settings.");
    }

    const headers = {
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "Authorization": `token ${token}`
    };

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/merge`;
    const controller = new AbortController();
    const timeoutMs = SafeStorage.loadApiTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify({ merge_method: safeMergeMethod }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Failed to merge PR (Status ${res.status})`);
      }

      return { data };
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
};
