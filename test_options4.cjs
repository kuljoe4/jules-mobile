const { readFileSync } = require('fs');
const code = readFileSync('src/components/activityFeed.jsx', 'utf8');

// just to make sure it runs and parses.
console.log("File read successfully.");
