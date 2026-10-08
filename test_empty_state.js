const { readFileSync } = require('fs');

const file = readFileSync('src/components/activityFeed.jsx', 'utf8');
const search = "sessionFailed";
const idx = file.lastIndexOf(search);
console.log(file.substring(idx - 50, idx + 1000));
