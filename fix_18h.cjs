const fs = require('fs');
let code = fs.readFileSync('src/components/sessionList.jsx', 'utf8');

const oldThreshold = 'const threshold24h = Date.now() - (24 * 60 * 60 * 1000);';
const newThreshold = 'const threshold18h = Date.now() - (18 * 60 * 60 * 1000);';
code = code.replace(oldThreshold, newThreshold);

const oldCondition = 'if (t1 < threshold24h && t2 < threshold24h) {';
const newCondition = 'if (t1 < threshold18h && t2 < threshold18h) {';
code = code.replace(oldCondition, newCondition);

const oldComment = '// Only consider gaps where at least one of the adjacent sessions is within the last 24 hours';
const newComment = '// Only consider gaps where at least one of the adjacent sessions is within the last 18 hours';
code = code.replace(oldComment, newComment);

fs.writeFileSync('src/components/sessionList.jsx', code);
