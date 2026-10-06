const fs = require('fs');

// Patch Settings
let settingsCode = fs.readFileSync('src/components/settings.jsx', 'utf8');
const settingsSearch = `<SettingsSelect label="Cache Expiry"`;
const settingsJSX = `<SettingsSelect label="Time Gap Highlight" value={appSettings.gapThreshold} options={GAP_THRESHOLD_OPTIONS} onChange={v => appSettings.setGapThreshold(Number(v))} desc="Highlight largest gaps within this timeframe." />
              `;
settingsCode = settingsCode.replace(settingsSearch, settingsJSX + settingsSearch);
fs.writeFileSync('src/components/settings.jsx', settingsCode);

// Patch SessionList
let sessionListCode = fs.readFileSync('src/components/sessionList.jsx', 'utf8');
// add gapThreshold to props destructured
sessionListCode = sessionListCode.replace(
  'sessionSort, setSessionSort, onBulkDelete, onBulkArchive, onBulkUnarchive, onBulkIgnore, onBulkPause, onBulkResume }) => {',
  'sessionSort, setSessionSort, onBulkDelete, onBulkArchive, onBulkUnarchive, onBulkIgnore, onBulkPause, onBulkResume, gapThreshold = 18 }) => {'
);
sessionListCode = sessionListCode.replace(
  'const threshold18h = Date.now() - (18 * 60 * 60 * 1000);',
  'const threshold = Date.now() - (gapThreshold * 60 * 60 * 1000);'
);
sessionListCode = sessionListCode.replace(
  'if (t1 < threshold18h && t2 < threshold18h) {',
  'if (t1 < threshold && t2 < threshold) {'
);
sessionListCode = sessionListCode.replace(
  '// Only consider gaps where at least one of the adjacent sessions is within the last 18 hours',
  '// Only consider gaps where at least one of the adjacent sessions is within the configurable gapThreshold'
);
// replace dependency array of gapInfo to include gapThreshold
sessionListCode = sessionListCode.replace(
  '}, [filtered]);',
  '}, [filtered, gapThreshold]);'
);
fs.writeFileSync('src/components/sessionList.jsx', sessionListCode);

// Patch JulesClient to pass down gapThreshold
let julesCode = fs.readFileSync('src/components/JulesClient.jsx', 'utf8');
julesCode = julesCode.replace(
  '<SessionList sessions={sessions}',
  '<SessionList gapThreshold={appSettings.gapThreshold} sessions={sessions}'
);
fs.writeFileSync('src/components/JulesClient.jsx', julesCode);
