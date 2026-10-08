const { readFileSync } = require('fs');
const code = readFileSync('src/components/activityFeed.jsx', 'utf8');

// I need to see if options is an array
// Let's use the actual extractOptions on this reason text.
// "Jules was unable to complete the task."
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

  // ... (rest of extractOptions logic)
  // Let's just run it locally on the specific failure message

  return options;
}

const reason = "Jules was unable to complete the task.";
console.log("Extracted options:", extractOptions(reason));
