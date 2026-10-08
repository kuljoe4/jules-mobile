const { readFileSync } = require('fs');

const file = readFileSync('src/components/activityFeed.jsx', 'utf8');
const search = "getActType";
const idx = file.indexOf(search);
console.log(file.substring(idx - 100, idx + 500));
