const { readFileSync } = require('fs');
const code = readFileSync('src/components/activityFeed.jsx', 'utf8');

function extractOptions(text) {
  if (!text) return [];
  const options = [];

  const proceedRegexes = [
    /\b(?:would you like to|ready to|should we) (?:proceed|continue)\b/i,
    /\b(?:what|how) (?:should|do) (?:we|i) (?:proceed|continue|do next)\b/i,
    /\bare you ready to (?:proceed|continue)\b/i
  ];

  if (proceedRegexes.some(r => r.test(text))) {
    options.push("Proceed");
  }

  const conversationalMatch = text.match(/(?:Should I|Would you like me to|Do you want me to) ([^,?.!]+)(?:, or| or) ([^?.!]+)\?/i);
  if (conversationalMatch) {
    let opt1 = conversationalMatch[1].trim();
    let opt2 = conversationalMatch[2].trim();
    opt1 = opt1.charAt(0).toUpperCase() + opt1.slice(1);
    opt2 = opt2.charAt(0).toUpperCase() + opt2.slice(1);
    if (!options.includes(opt1)) options.push(opt1);
    if (!options.includes(opt2)) options.push(opt2);
  }

  const conversationalMatch3 = text.match(/Does this sound (?:good|like|okay|correct)/i);
  if (conversationalMatch3) {
      if (!options.includes("Yes, proceed")) options.push("Yes, proceed");
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const allLists = [];
  let currentList = [];
  let hasIntro = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Look for phrases that introduce options
    const isIntro = /(?:options|would you like|choose|proceed|follow up|next steps|how would you like|please select|here are some options|you can|shall we|what to do|let me know|are you ready)/i.test(lowerLine);

    // Match standard Markdown list items (*, -, 1.)
    const m = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
    if (m) {
      let item = m[1].trim();
      item = item.replace(/\*\*(.+?)\*\*/g, '$1'); // strip bold
      item = item.replace(/`(.+?)`/g, '$1');      // strip inline code
      if (item.length > 0 && item.length < 150) {
         currentList.push(item);
      }
    } else {
      // If we were building a list and it ended
      if (currentList.length > 0) {
        allLists.push({ items: currentList, hasIntro });
        currentList = [];
        hasIntro = false;
      }
      if (isIntro) {
        hasIntro = true;
      } else {
           hasIntro = false;
      }
    }
  }
  // Add any trailing list
  if (currentList.length > 0) {
    allLists.push({ items: currentList, hasIntro });
  }

  // Pick the most likely options list
  let selectedList = [];
  if (allLists.length > 0) {
    const listsWithIntro = allLists.filter(l => l.hasIntro);
    if (listsWithIntro.length > 0) {
      // Prefer the last list that had an intro
      selectedList = listsWithIntro[listsWithIntro.length - 1].items;
    } else {
      // Otherwise, see if the very last list in the message is at the very end
      const lastList = allLists[allLists.length - 1].items;
      let linesAfter = 0;
      let inLastList = false;
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const m = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
        if (m) {
          inLastList = true;
        } else if (inLastList) {
          break; // Exited the list backwards
        } else {
          linesAfter++;
        }
      }
      // If the list is within the last 3 lines, it's likely a summary of options
      if (linesAfter <= 3) {
        selectedList = lastList;
      }
    }
  }

  // 5. Merge list items into our options
  if (selectedList.length > 0) {
    for (let item of selectedList) {
      item = item.charAt(0).toUpperCase() + item.slice(1); // capitalize first letter
      if (item.toLowerCase() === "proceed") {
         if (!options.includes("Proceed")) options.push("Proceed");
      } else {
         if (!options.includes(item)) options.push(item);
      }
    }
  }

  // 6. Deduplicate case-insensitively
  let finalOptions = [];
  const lowerFinals = new Set();
  for (const opt of options) {
      const l = opt.toLowerCase();
      if (!lowerFinals.has(l)) {
          lowerFinals.add(l);
          finalOptions.push(opt);
      }
  }

  // 7. Cleanup: If we extracted specific options (from a list or "A or B" match),
  // drop generic "Proceed" unless it was explicitly part of the selected list.
  if (finalOptions.includes("Proceed") && finalOptions.length > 1) {
    const proceedInList = selectedList.some(item => item.toLowerCase() === 'proceed');
    if (!proceedInList) {
        finalOptions = finalOptions.filter(opt => opt !== "Proceed");
    }
  }

  // Handle conversational Yes/No correctly (don't mix generic Yes proceed with other specific ones)
  if (finalOptions.includes("Yes, proceed") && finalOptions.length > 1) {
    finalOptions = finalOptions.filter(opt => opt !== "Yes, proceed");
  }

  return finalOptions;
}

const text = `I have analyzed the provided trade diagnostic trace and explored the codebase. Here is a summary of my progress:

1. **Diagnostic Tool Improvements:** I updated frontend/src/utils/tradeDiagnostics.js to compute expectedSl based on Math.max(activeIdx, achievedMilestoneIdx) instead of blindly trusting activeIdx. I also updated maxRR to use Math.max(stored peak, live R) in both the diagnostic tool and the TradeDetailContent.jsx UI component, ensuring that live price spikes are accurately reflected.
2. **Engine Broadcaster Delta Suppression:** I added close_attempts and close_blocked to the delta suppression checks in engine-broadcaster.service.ts so the frontend actually receives updates when these values change.
3. **Identified the Root Causes:**
    - isExitSignalOverrideActive calls checkExitSignals dynamically on every tick, which has a side effect and adds CPU weight.
    - When exit_signals_override_ratchet triggers, it completely cancels the SL rather than tightening it.
    - close_attempts counts every attempt (before the request is made) and never resets on recovery, eventually hitting the ceiling and blocking closes permanently.

How would you like me to proceed? Should I implement the rolling window / reset-on-recovery for close_attempts, fix the isExitSignalOverrideActive side-effect and SL cancellation, or prioritize outputting the root cause verdict as requested in your initial prompt?`;

console.log("Extracted options:", extractOptions(text));
