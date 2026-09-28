const { performance } = require('perf_hooks');

// Mock window and caches
global.window = {};
global.navigator = {};

class MockCache {
  async keys() {
    return Array(100).fill().map((_, i) => `req${i}`);
  }
  async match(r) {
    // Simulate I/O delay using setTimeout
    return new Promise(resolve => setTimeout(() => {
      resolve({
        headers: {
          get: (name) => name === "content-length" ? "1024" : null
        }
      });
    }, 10)); // 10ms delay per request
  }
}

global.caches = {
  async keys() { return ['cache1', 'cache2']; },
  async open(key) { return new MockCache(); },
  async delete(key) { return true; }
};

async function getStorageInfoOld() {
  let cache = 0;
  if ("caches" in global) {
    const keys = await caches.keys();
    for (const key of keys) {
      const c = await caches.open(key);
      const reqs = await c.keys();
      for (const r of reqs) {
        const res = await c.match(r);
        if (res) {
          const cl = res.headers.get("content-length");
          if (cl) cache += parseInt(cl, 10);
        }
      }
    }
  }
  return cache;
}

async function getStorageInfoNew() {
  let cache = 0;
  if ("caches" in global) {
    const keys = await caches.keys();
    for (const key of keys) {
      const c = await caches.open(key);
      const reqs = await c.keys();
      const matches = await Promise.all(reqs.map(r => c.match(r)));
      for (const res of matches) {
        if (res) {
          const cl = res.headers.get("content-length");
          if (cl) cache += parseInt(cl, 10);
        }
      }
    }
  }
  return cache;
}

async function runBenchmark() {
  const t0 = performance.now();
  await getStorageInfoOld();
  const t1 = performance.now();
  const oldTime = t1 - t0;

  const t2 = performance.now();
  await getStorageInfoNew();
  const t3 = performance.now();
  const newTime = t3 - t2;

  console.log(`Baseline: ${oldTime.toFixed(2)} ms`);
  console.log(`Optimized: ${newTime.toFixed(2)} ms`);
  console.log(`Improvement: ${((oldTime - newTime) / oldTime * 100).toFixed(2)}% faster`);
}

runBenchmark();
