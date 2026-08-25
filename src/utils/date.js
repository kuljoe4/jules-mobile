const DATE_MS_CACHE = new Map();
export const parseDateMs = (dateVal) => {
  if (!dateVal) return 0;
  if (typeof dateVal === 'number') return dateVal;
  if (dateVal instanceof Date) return dateVal.getTime();
  if (typeof dateVal !== 'string') {
    return new Date(dateVal).getTime() || 0;
  }
  let cached = DATE_MS_CACHE.get(dateVal);
  if (cached !== undefined) return cached;
  const ms = new Date(dateVal).getTime() || 0;
  if (DATE_MS_CACHE.size > 2000) {
    DATE_MS_CACHE.clear();
  }
  DATE_MS_CACHE.set(dateVal, ms);
  return ms;
};

export const fmtDuration = ms => {
  const d = Math.abs(ms);
  if (d < 60000) return `${Math.floor(d / 1000)}s`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m`;
  return `${Math.floor(d / 86400000)}d`;
};
const fmtAgo = ts => { const d=Date.now()-ts; if(d<60000)return`${Math.floor(d/1000)}s ago`; if(d<3600000)return`${Math.floor(d/60000)}m ago`; if(d<86400000)return`${Math.floor(d/3600000)}h ago`; return`${Math.floor(d/86400000)}d ago`; };
const fmtTime = ts => new Date(parseDateMs(ts)).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
const pctFromState = s => ({QUEUED:5,PLANNING:20,AWAITING_PLAN_APPROVAL:35,IN_PROGRESS:65,AWAITING_USER_FEEDBACK:60,COMPLETED:100,FAILED:30,PAUSED:50}[s]||0);
const getActType = a =>
  a.planGenerated?"planGenerated":a.planApproved?"planApproved":
  a.userMessaged?"userMessaged":a.agentMessaged?"agentMessaged":
  a.progressUpdated?"progressUpdated":a.sessionCompleted?"sessionCompleted":
  a.sessionFailed?"sessionFailed":"system";
const getActKey = a => a.id || a.name || `ts-${a.createTime}`;

// ─── PWA install hook ─────────────────────────────────────────────────────────
