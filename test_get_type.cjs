const { readFileSync } = require('fs');

const file = readFileSync('src/components/activityFeed.jsx', 'utf8');
const search = "export const getActType = (a) => {";
const idx = file.indexOf(search);
console.log(file.substring(idx, idx + 500));
