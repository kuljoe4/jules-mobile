const { readFileSync } = require('fs');

const file = readFileSync('src/components/activityFeed.jsx', 'utf8');
const search = "const type = getActType(act);";
const idx = file.indexOf(search);
console.log(file.substring(idx - 200, idx + 500));
