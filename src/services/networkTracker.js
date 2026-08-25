function getBucketCategory(label, path) {
  const p = (path || "").toLowerCase();
  const l = (label || "").toLowerCase();

  if (p.includes("/activities") || l.includes("activities")) {
    return "Session Polling & Activities";
  }
  if (p.includes(":sendmessage") || l.includes("sendmessage") || p.includes(":approveplan") || l.includes("approveplan")) {
    return "Chat & User Messages";
  }
  if (p === "/sessions" || p.startsWith("/sessions?") || l.includes("sessions") || l.includes("supp ")) {
    return "Sessions List Sync";
  }
  if (p.includes("/sources") || l.includes("sources") || l.includes("list sources")) {
    return "Repo & Branch Queries";
  }
  return "Session Metadata & Actions";
}

// ─── Network tracker ──────────────────────────────────────────────────────────
function makeNetTracker() {
  const initial = SafeStorage.loadNetStats();

  const sessionStart = Date.now();
  let sessionUsage = { in: 0, out: 0 };
  let stats = initial;
  let log = [];
  const subs = [];

  if (!stats.overallBuckets) stats.overallBuckets = {};
  if (!stats.dailyBuckets) stats.dailyBuckets = {};

  const save = () => {
    SafeStorage.saveNetStats(stats);
  };

  const getUsage = () => {
    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];
    const monthKey = todayKey.slice(0, 7);

    const today = stats.daily[todayKey] || { in: 0, out: 0 };
    const month = { in: 0, out: 0 };
    Object.entries(stats.daily).forEach(([date, val]) => {
      if (date.startsWith(monthKey)) {
        month.in += val.in || 0;
        month.out += val.out || 0;
      }
    });

    const sessionDurationMs = now.getTime() - sessionStart;
    const h = Math.floor(sessionDurationMs / 3600000);
    const m = Math.floor((sessionDurationMs % 3600000) / 60000);
    const s = Math.floor((sessionDurationMs % 60000) / 1000);
    const duration = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;

    return { today, month, overall: stats.overall, session: sessionUsage, duration };
  };

  const getBuckets = () => {
    const now = new Date();
    const todayKey = now.toISOString().split("T")[0];
    const monthKey = todayKey.slice(0, 7);

    const bucketsToday = {};
    const bucketsMonth = {};
    const bucketsOverall = {};

    const categories = [
      "Session Polling & Activities",
      "Sessions List Sync",
      "Repo & Branch Queries",
      "Chat & User Messages",
      "Session Metadata & Actions"
    ];

    categories.forEach(c => {
      bucketsToday[c] = { in: 0, out: 0, total: 0 };
      bucketsMonth[c] = { in: 0, out: 0, total: 0 };
      bucketsOverall[c] = { in: 0, out: 0, total: 0 };
    });

    if (stats.overallBuckets) {
      Object.entries(stats.overallBuckets).forEach(([cat, val]) => {
        const c = categories.includes(cat) ? cat : "Session Metadata & Actions";
        bucketsOverall[c].in += val.in || 0;
        bucketsOverall[c].out += val.out || 0;
        bucketsOverall[c].total += (val.in || 0) + (val.out || 0);
      });
    }

    if (stats.dailyBuckets) {
      Object.entries(stats.dailyBuckets).forEach(([date, dayBuckets]) => {
        const isToday = (date === todayKey);
        const isMonth = date.startsWith(monthKey);

        if (dayBuckets) {
          Object.entries(dayBuckets).forEach(([cat, val]) => {
            const c = categories.includes(cat) ? cat : "Session Metadata & Actions";
            if (isToday) {
              bucketsToday[c].in += val.in || 0;
              bucketsToday[c].out += val.out || 0;
              bucketsToday[c].total += (val.in || 0) + (val.out || 0);
            }
            if (isMonth) {
              bucketsMonth[c].in += val.in || 0;
              bucketsMonth[c].out += val.out || 0;
              bucketsMonth[c].total += (val.in || 0) + (val.out || 0);
            }
          });
        }
      });
    }

    // Fallback if empty but overall stats exist
    const hasOverall = Object.values(bucketsOverall).some(b => b.total > 0);
    if (!hasOverall && (stats.overall.in > 0 || stats.overall.out > 0)) {
      bucketsOverall["Session Polling & Activities"] = {
        in: stats.overall.in,
        out: stats.overall.out,
        total: stats.overall.in + stats.overall.out
      };
      const todayTotal = (stats.daily[todayKey]?.in || 0) + (stats.daily[todayKey]?.out || 0);
      if (todayTotal > 0) {
        bucketsToday["Session Polling & Activities"] = {
          in: stats.daily[todayKey].in,
          out: stats.daily[todayKey].out,
          total: todayTotal
        };
      }
      let monthIn = 0, monthOut = 0;
      Object.entries(stats.daily).forEach(([date, val]) => {
        if (date.startsWith(monthKey)) {
          monthIn += val.in || 0;
          monthOut += val.out || 0;
        }
      });
      if (monthIn + monthOut > 0) {
        bucketsMonth["Session Polling & Activities"] = {
          in: monthIn,
          out: monthOut,
          total: monthIn + monthOut
        };
      }
    }

    const computeShares = (buckets) => {
      const totalAll = Object.values(buckets).reduce((sum, b) => sum + b.total, 0);
      return Object.entries(buckets).map(([name, data]) => {
        const pct = totalAll > 0 ? (data.total / totalAll) * 100 : 0;
        return { name, ...data, pct };
      }).sort((a, b) => b.total - a.total);
    };

    return {
      today: computeShares(bucketsToday),
      month: computeShares(bucketsMonth),
      overall: computeShares(bucketsOverall)
    };
  };

  const notify = () => {
    const usage = getUsage();
    const buckets = getBuckets();
    subs.forEach(f => f({
      ...usage,
      buckets,
      total: usage.overall.in + usage.overall.out,
      totalIn: usage.overall.in,
      totalOut: usage.overall.out,
      log: [...log]
    }));
  };

  return {
    record(label, bytesIn, bytesOut, status) {
      const now = new Date();
      const todayKey = now.toISOString().split("T")[0];
      const category = getBucketCategory(label, label);

      if (!stats.daily[todayKey]) stats.daily[todayKey] = { in: 0, out: 0 };
      stats.daily[todayKey].in += bytesIn;
      stats.daily[todayKey].out += bytesOut;
      stats.overall.in += bytesIn;
      stats.overall.out += bytesOut;
      sessionUsage.in += bytesIn;
      sessionUsage.out += bytesOut;

      if (!stats.overallBuckets) stats.overallBuckets = {};
      if (!stats.overallBuckets[category]) stats.overallBuckets[category] = { in: 0, out: 0 };
      stats.overallBuckets[category].in += bytesIn;
      stats.overallBuckets[category].out += bytesOut;

      if (!stats.dailyBuckets) stats.dailyBuckets = {};
      if (!stats.dailyBuckets[todayKey]) stats.dailyBuckets[todayKey] = {};
      if (!stats.dailyBuckets[todayKey][category]) stats.dailyBuckets[todayKey][category] = { in: 0, out: 0 };
      stats.dailyBuckets[todayKey][category].in += bytesIn;
      stats.dailyBuckets[todayKey][category].out += bytesOut;

      // Keep only last 60 days of daily stats
      const dailyKeys = Object.keys(stats.daily).sort();
      if (dailyKeys.length > 60) {
        const oldestKey = dailyKeys[0];
        delete stats.daily[oldestKey];
        if (stats.dailyBuckets) delete stats.dailyBuckets[oldestKey];
      }

      log.unshift({ id: Math.random(), label, bytesIn, bytesOut, status, ts: now.getTime() });
      if (log.length > 80) log.length = 80;

      save();
      notify();
    },
    subscribe(fn) { subs.push(fn); return () => { const i = subs.indexOf(fn); if (i > -1) subs.splice(i, 1); }; },
    snapshot() {
      const usage = getUsage();
      const buckets = getBuckets();
      return {
        ...usage,
        buckets,
        total: usage.overall.in + usage.overall.out,
        totalIn: usage.overall.in,
        totalOut: usage.overall.out,
        log: [...log]
      };
    },
  };
}
const NET = makeNetTracker();
