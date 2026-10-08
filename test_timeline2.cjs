const { readFileSync } = require('fs');

const file = readFileSync('src/components/activityFeed.jsx', 'utf8');
const search = "return (";
const idx = file.indexOf(search, file.indexOf("const TimelineEvent = memo(({ act,"));
console.log(file.substring(idx, idx + 500));
