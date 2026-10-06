const fs = require('fs');
let code = fs.readFileSync('src/components/sessionList.jsx', 'utf8');

// Locate gapInfo loop
const oldLoopBody = `
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
`;

const newLoopBody = `
    const threshold24h = Date.now() - (24 * 60 * 60 * 1000);

    for (let i = 0; i < filtered.length - 1; i++) {
      const s1 = filtered[i];
      const s2 = filtered[i + 1];
      const t1 = parseDateMs(s1.updateTime || s1.createTime);
      const t2 = parseDateMs(s2.updateTime || s2.createTime);

      // Only consider gaps where at least one of the adjacent sessions is within the last 24 hours
      if (t1 < threshold24h && t2 < threshold24h) {
        continue;
      }

      const gap = Math.abs(t1 - t2);
      if (gap > maxGap && gap > 1000 * 60 * 60) { // Still require at least 1 hr to be a "gap"
        maxGap = gap;
        maxGapIndex = i;
      }
    }
`;

code = code.replace(oldLoopBody, newLoopBody);
fs.writeFileSync('src/components/sessionList.jsx', code);
