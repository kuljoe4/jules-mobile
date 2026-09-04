/**
 * Utility functions for generating smart Pull Request / direct merge commit titles and bodies.
 */

import { getPendingPRProposal } from '../services/githubTracker.js';

export function getSmartTitle(session, b, activities = []) {
  const proposal = b?.pendingPRProposal || (typeof getPendingPRProposal === 'function' ? getPendingPRProposal(session, activities) : null);
  if (proposal && proposal.title) {
    return proposal.title;
  }

  if (b?.commits && b.commits.length > 0 && b.commits[0].source !== "activity") {
    const firstTitle = b.commits[0].title || (b.commits[0].message || "").split("\n")[0].trim();
    if (firstTitle && firstTitle.length >= 3) {
      return b.commits.length === 1 ? firstTitle : `${firstTitle} (+${b.commits.length - 1} more commits)`;
    }
  }

  const summary = session?.outputs?.find(o => o?.sessionSummary)?.sessionSummary?.summary;
  if (summary) {
    const line = summary.split("\n")[0].trim().replace(/^#+\s*/, "").replace(/^Session Summary:\s*/i, "");
    if (line && line.length >= 3) {
      return line.length > 100 ? line.slice(0, 97) + "..." : line;
    }
  }

  if (session?.prompt) {
    const promptLine = session.prompt.split("\n")[0].trim();
    if (promptLine) {
      return promptLine.length > 100 ? promptLine.slice(0, 97) + "..." : promptLine;
    }
  }

  if (session?.title) {
    return session.title.length > 100 ? session.title.slice(0, 97) + "..." : session.title;
  }

  return `Merge changes from ${b?.working || "feature branch"}`;
}

export function getSmartBody(session, b, activities = []) {
  const proposal = b?.pendingPRProposal || (typeof getPendingPRProposal === 'function' ? getPendingPRProposal(session, activities) : null);
  if (proposal && (proposal.description || proposal.title)) {
    return proposal.description || proposal.title;
  }

  if (b?.commits && b.commits.length > 0 && b.commits[0].source !== "activity") {
    const commitLogs = b.commits.map(c => `- ${c.sha ? `[${c.sha}] ` : ""}${c.title || c.message}`).join("\n");
    return `### Ahead Commits\n\n${commitLogs}\n\nCreated via Jules Mobile Client`;
  }

  const summary = session?.outputs?.find(o => o?.sessionSummary)?.sessionSummary?.summary;
  if (summary) return summary;

  return session?.prompt ? `### Prompt\n${session.prompt}` : "";
}
