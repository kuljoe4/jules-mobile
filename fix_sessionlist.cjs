const fs = require('fs');
let code = fs.readFileSync('src/components/sessionList.jsx', 'utf8');

// Ah, `filtered` is undefined when `gapInfo` evaluates because `gapInfo` is defined at the top but `filtered` is defined later.
// Let's move gapInfo hook below filtered definition

const hookLogic = `
  // Compute maximum time gap between adjacent sessions
  const gapInfo = useMemo(() => {
    if (!filtered || filtered.length < 2) return null;
    let maxGap = 0;
    let maxGapIndex = -1;

    for (let i = 0; i < filtered.length - 1; i++) {
      const s1 = filtered[i];
      const s2 = filtered[i + 1];
      const t1 = parseDateMs(s1.updateTime || s1.createTime);
      const t2 = parseDateMs(s2.updateTime || s2.createTime);
      const gap = Math.abs(t1 - t2);
      if (gap > maxGap && gap > 1000 * 60 * 60) {
        maxGap = gap;
        maxGapIndex = i;
      }
    }

    if (maxGapIndex !== -1) {
      return {
        index: maxGapIndex,
        gapMs: maxGap,
        duration: typeof fmtDuration === 'function' ? fmtDuration(maxGap) : Math.floor(maxGap/(1000*60*60)) + 'h'
      };
    }
    return null;
  }, [filtered]);
`;

// Remove existing gapInfo
const gapInfoRegex = /\/\/ Compute maximum time gap between adjacent sessions[\s\S]*?const gapInfo = useMemo\(\(\) => \{[\s\S]*?\}, \[filtered\]\);/g;
code = code.replace(gapInfoRegex, '');

// Find where filtered is declared and insert after it
const filteredRegex = /const filtered = useMemo\(\(\) => \{[\s\S]*?\}, \[filter, baseFiltered, draftsMap, activitiesMap\]\);/;
const match = code.match(filteredRegex);

if (match) {
  const insertIndex = code.indexOf(match[0]) + match[0].length;
  code = code.slice(0, insertIndex) + '\n' + hookLogic + code.slice(insertIndex);
} else {
  console.log("Could not find filtered declaration!");
}

fs.writeFileSync('src/components/sessionList.jsx', code);
