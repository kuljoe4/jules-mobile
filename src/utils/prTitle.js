/**
 * Utility functions for generating smart Pull Request / direct merge commit titles and bodies.
 */

import { getPendingPRProposal } from '../services/githubTracker.js';

export function getSmartTitle(session, b, activities = [], ignoreProposal = false) {
  const proposal = ignoreProposal ? null : (b?.pendingPRProposal || (typeof getPendingPRProposal === 'function' ? getPendingPRProposal(session, activities) : null));
  let rawTitle = "";

  if (proposal && proposal.title) {
    rawTitle = proposal.title;
  } else if (!ignoreProposal && b?.commits && b.commits.length > 0 && b.commits[0].source !== "activity") {
    const firstTitle = b.commits[0].title || (b.commits[0].message || "").split("\n")[0].trim();
    if (firstTitle && firstTitle.length >= 3) {
      rawTitle = b.commits.length === 1 ? firstTitle : `${firstTitle} (+${b.commits.length - 1} more commits)`;
    }
  }

  if (!rawTitle) {
    const summary = session?.outputs?.find(o => o?.sessionSummary)?.sessionSummary?.summary;
    if (summary) {
      const line = summary.split("\n")[0].trim().replace(/^#+\s*/, "").replace(/^Session Summary:\s*/i, "");
      if (line && line.length >= 3) {
        rawTitle = line;
      }
    }
  }

  if (!rawTitle && session?.prompt) {
    const promptLine = session.prompt.split("\n")[0].trim();
    if (promptLine && promptLine.length >= 3) {
      rawTitle = promptLine;
    }
  }

  if (!rawTitle && session?.title && session.title !== "New Session") {
    rawTitle = session.title;
  }

  if (!rawTitle) {
    rawTitle = `Merge changes from ${b?.working || "feature branch"}`;
  }

  // Security: Sanitize title to prevent control character / null-byte injection, multiline newline injection, and payload bloat.
  const cleanTitle = (typeof rawTitle === "string" ? rawTitle : "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanTitle.length > 250 ? cleanTitle.slice(0, 247) + "..." : cleanTitle;
}

export function getSmartBody(session, b, activities = [], ignoreProposal = false) {
  const proposal = ignoreProposal ? null : (b?.pendingPRProposal || (typeof getPendingPRProposal === 'function' ? getPendingPRProposal(session, activities) : null));
  let rawBody = "";

  if (proposal && (proposal.description || proposal.title)) {
    rawBody = proposal.description || proposal.title;
  } else {
    const summary = session?.outputs?.find(o => o?.sessionSummary)?.sessionSummary?.summary;
    if (summary) {
      rawBody = summary;
    } else if (session?.prompt) {
      rawBody = `### Prompt\n${session.prompt}`;
    }
  }

  if (!ignoreProposal && b?.commits && b.commits.length > 0 && b.commits[0].source !== "activity") {
    const commitLogs = b.commits.map(c => `- ${c.sha ? `[${c.sha.slice(0, 7)}] ` : ""}${c.title || (c.message || "").split("\n")[0]}`).join("\n");
    const commitSection = `### Ahead Commits\n\n${commitLogs}\n\nCreated via Jules Mobile Client`;
    rawBody = rawBody ? `${rawBody}\n\n${commitSection}` : commitSection;
  } else if (!rawBody) {
    rawBody = "Created via Jules Mobile Client";
  }

  // Security: Sanitize body to prevent control character / null-byte injection while preserving multiline formatting (\n, \r, \t).
  const cleanBody = (typeof rawBody === "string" ? rawBody : "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();

  return cleanBody.length > 10000 ? cleanBody.slice(0, 9997) + "..." : cleanBody;
}
