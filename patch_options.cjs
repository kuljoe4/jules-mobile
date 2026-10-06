const fs = require('fs');

let optionsCode = fs.readFileSync('src/config/options.js', 'utf8');
optionsCode += `
const GAP_THRESHOLD_OPTIONS = [
  { label: "12h", val: 12 },
  { label: "18h", val: 18 },
  { label: "24h", val: 24 },
  { label: "48h", val: 48 },
];
const DEFAULT_GAP_THRESHOLD = 18;
`;
fs.writeFileSync('src/config/options.js', optionsCode);

let facadeCode = fs.readFileSync('src/services/settingsFacade.js', 'utf8');
facadeCode = facadeCode.replace(
  'function loadLimit() { return SafeStorage.loadLimit(); }',
  'function loadLimit() { return SafeStorage.loadLimit(); }\n\nfunction loadGapThreshold() { return SafeStorage.loadGapThreshold(); }\nfunction saveGapThreshold(v) { SafeStorage.saveGapThreshold(v); }'
);
fs.writeFileSync('src/services/settingsFacade.js', facadeCode);

let storageCode = fs.readFileSync('src/services/storage.js', 'utf8');
storageCode = storageCode.replace(
  'loadLimit: () => parseInt(window.localStorage.getItem("jac_limit") || DEFAULT_LIMIT, 10),',
  'loadLimit: () => parseInt(window.localStorage.getItem("jac_limit") || DEFAULT_LIMIT, 10),\n  loadGapThreshold: () => parseInt(window.localStorage.getItem("jac_gap_threshold") || DEFAULT_GAP_THRESHOLD, 10),\n  saveGapThreshold: (v) => window.localStorage.setItem("jac_gap_threshold", v),'
);
fs.writeFileSync('src/services/storage.js', storageCode);

let hooksCode = fs.readFileSync('src/hooks/useAppSettings.js', 'utf8');
hooksCode = hooksCode.replace(
  'const [sessionLimit, setSessionLimitRaw] = useState(loadLimit);',
  'const [sessionLimit, setSessionLimitRaw] = useState(loadLimit);\n  const [gapThreshold, setGapThresholdRaw] = useState(loadGapThreshold);'
);
hooksCode = hooksCode.replace(
  'const setSessionLimit = useCallback(v => {',
  'const setGapThreshold = useCallback(v => {\n    saveGapThreshold(v);\n    setGapThresholdRaw(v);\n  }, []);\n\n  const setSessionLimit = useCallback(v => {'
);
hooksCode = hooksCode.replace(
  'sessionLimit, setSessionLimit,',
  'sessionLimit, setSessionLimit,\n    gapThreshold, setGapThreshold,'
);
fs.writeFileSync('src/hooks/useAppSettings.js', hooksCode);
