let quotaRetryAfter = 0;
let lastQuotaError = null;
const QUOTA_ERROR_CODES = [429, 403];

async function apiCall(apiKey, path, opts={}) {
  const cleanKey = typeof apiKey === "string" ? apiKey.trim() : "";
  // Defensive validation of API key format
  if (cleanKey && !isValidGoogleApiKey(cleanKey)) {
    throw new Error("Invalid API key.");
  }
  const now = Date.now();
  if (quotaRetryAfter > now) {
    const waitSec = Math.ceil((quotaRetryAfter - now) / 1000);
    const err = new Error(`Quota or temporary service error. Please wait ${waitSec}s before retrying.`);
    err.status = 503;
    throw err;
  }

  const {
    attempts = 3,
    retryDelayMultiplier = 500,
    timeout,
    _label,
    onProgress,
    body: rawBody,
    headers: customHeaders = {},
    signal: optsSignal,
    method = "GET",
    ...restFetchOpts
  } = opts;

  const url = `${BASE}${path}`;
  const body = rawBody ? JSON.stringify(rawBody) : undefined;
  const headers = {
    ...(cleanKey ? { "x-goog-api-key": cleanKey } : {}),
    ...(customHeaders || {})
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  // Estimate outgoing bytes (method + url + headers + body)
  const outBytes = method.length + url.length + JSON.stringify(headers).length + (body?.length || 0);

  let res;
  const maxAttempts = attempts;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    // Implement a defensive request timeout to prevent client resource exhaustion and hanging socket connections
    const controller = new AbortController();
    const timeoutMs = timeout || loadApiTimeout(); // default configured timeout
    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    let removeAbortListener = null;
    if (optsSignal) {
      if (optsSignal.aborted) {
        controller.abort();
      } else {
        const onAbort = () => controller.abort();
        optsSignal.addEventListener('abort', onAbort);
        removeAbortListener = () => optsSignal.removeEventListener('abort', onAbort);
      }
    }

    try {
      res = await fetch(url, { ...restFetchOpts, method, headers, body, signal: controller.signal });
      if (removeAbortListener) removeAbortListener();
      clearTimeout(timeoutId);
      break; // Success! Exit retry loop
    } catch (err) {
      if (removeAbortListener) removeAbortListener();
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        if (timedOut) {
          throw new Error(`API request timed out after ${timeoutMs}ms`);
        }
        const abortErr = new Error("The user aborted a request.");
        abortErr.name = "AbortError";
        throw abortErr;
      }

      if (err instanceof TypeError) {
        console.error(`[apiCall] Fetch failed with TypeError on attempt ${attempt} for ${url}:`, err);
        if (attempt < maxAttempts) {
          // Robust connection waiter: if offline, wait up to 10s for connection to recover
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            console.warn("[apiCall] Device is offline. Waiting up to 10s for network connection...");
            await new Promise(resolve => {
              let resolved = false;
              const onOnline = () => {
                if (resolved) return;
                resolved = true;
                window.removeEventListener("online", onOnline);
                clearTimeout(offlineTimeout);
                resolve();
              };
              window.addEventListener("online", onOnline);
              const offlineTimeout = setTimeout(() => {
                if (resolved) return;
                resolved = true;
                window.removeEventListener("online", onOnline);
                resolve();
              }, 10000);
            });
          }

          const delay = attempt * retryDelayMultiplier;
          console.warn(`[apiCall] Transient network failure on attempt ${attempt}. Retrying in ${delay}ms...`, err);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error("Network or CORS request failed. Please check your network connection, API key validity, or if CORS restrictions are active.");
      }
      throw err;
    }
  }

  let text = "";
  let headerSize = 0;
  res.headers.forEach((v, k) => headerSize += k.length + v.length + 4);

  if (onProgress && res.body) {
    const reader = res.body.getReader();
    const contentLength = +res.headers.get("Content-Length") || 0;
    let receivedLength = 0;
    const chunks = [];

    while (true) {
      const {done, value} = await reader.read();
      if (done) {
        // Guarantee 100% progress completion at the end of stream
        onProgress({ loaded: receivedLength, total: receivedLength });
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      onProgress({ loaded: receivedLength, total: contentLength });
    }

    const all = new Uint8Array(receivedLength);
    let pos = 0;
    for (let c of chunks) { all.set(c, pos); pos += c.length; }
    text = new TextDecoder().decode(all);
  } else {
    text = await res.text();
  }

  const inBytes = headerSize + new TextEncoder().encode(text).length;
  NET.record(_label || path, inBytes / 1024, outBytes / 1024, res.status);

  if (!res.ok) {
    let msg = text;
    try { msg = JSON.parse(text)?.error?.message || text; } catch {}

    const isQuotaError = res.status === 429 || (res.status === 403 && /quota|limit|exceeded|exhausted/i.test(msg));
    if (isQuotaError) {
      const retryAfterHeader = res.headers.get('Retry-After');
      const parsed = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
      const waitSec = Number.isFinite(parsed) ? parsed : 60;
      quotaRetryAfter = Date.now() + (waitSec * 1000);
      lastQuotaError = { status: res.status, msg, at: new Date() };

      try {
        window.dispatchEvent(new CustomEvent('quota-error', {
          detail: { retryAfter: quotaRetryAfter, msg, status: res.status }
        }));
      } catch (e) {
        console.error("Failed to dispatch quota-error event:", e);
      }
    }

    throw new Error(`${res.status}: ${msg}`);
  }

  // Reset quota on success
  quotaRetryAfter = 0;
  return text ? JSON.parse(text) : {};
}
