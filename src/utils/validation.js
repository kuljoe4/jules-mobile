// ─── Validation Helpers ──────────────────────────────────────────────────────
export const isValidGoogleApiKey = (key) => {
  if (typeof key !== "string") return false;
  const regex = /^[\x21-\x7E]+$/;
  return regex.test(key);
};

export const isValidGithubToken = (token) => {
  if (!token) return true;
  if (typeof token !== "string") return false;
  const regex = /^[\x21-\x7E]+$/;
  return regex.test(token);
};

// Security: Validates GitHub repository identifiers to prevent path traversal (..), REST API endpoint
// manipulation, null-byte/control-character injection, downstream command flag injection, and .git suffix manipulation.
export const isValidGithubRepoName = (repo) => {
  if (!repo || typeof repo !== "string") return false;
  if (repo.length > 200) return false;
  if (/[\x00-\x1F\x7F]/.test(repo) || /\s/.test(repo)) return false;
  if (repo.includes("..") || repo.includes("//")) return false;
  const parts = repo.split("/");
  if (parts.length !== 2) return false;
  const [owner, name] = parts;
  if (!owner || !name) return false;
  if (owner.startsWith(".") || owner.startsWith("-") || owner.endsWith(".") || owner.endsWith("-")) return false;
  if (name.startsWith(".") || name.startsWith("-") || name.endsWith(".") || name.endsWith("-")) return false;
  if (name.endsWith(".git")) return false;
  return /^[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+$/.test(repo);
};

// Security: Validates session identifier strings to prevent REST API Endpoint Parameter Pollution,
// URL Path Manipulation, and Control Character / Null-Byte Injection.
export const isValidSessionId = (id) => {
  if (!id || typeof id !== "string") return false;
  if (id.length > 250) return false;
  if (/[\x00-\x1F\x7F]/.test(id)) return false;
  if (/\s/.test(id) || id.includes("..") || id.includes("//")) return false;
  if (id.includes("?") || id.includes("#")) return false;
  if (id.startsWith("/") || id.endsWith("/")) return false;
  return /^[a-zA-Z0-9\-_./:]+$/.test(id);
};

export const isValidGitBranchName = (name) => {
  if (!name) return true;
  if (typeof name !== "string") return false;
  if (name.length > 250) return false;
  // Security: Reject ASCII control characters (0x00-0x1F, 0x7F) including null bytes to prevent null-byte injection.
  if (/[\x00-\x1F\x7F]/.test(name)) return false;
  // Git branch names cannot start with a hyphen '-' (mitigating down-stream command argument/flag injection)
  // or start/end with a dot '.' (per standard git reference naming safety).
  if (name.startsWith("-") || name.startsWith(".") || name.endsWith(".")) return false;
  if (name.startsWith("/") || name.endsWith("/") || name.includes("//") || /\s/.test(name)) return false;
  if (name.includes("..")) return false;
  const invalidChars = /[~^:\?\*\[\\\#\%]|@\{/;
  if (invalidChars.test(name)) return false;
  if (name.endsWith(".lock")) return false;
  if (name === "@") return false;
  return true;
};

// Security: Sanitizes and validates dynamic link URLs to prevent Client-Side Cross-Site Scripting (XSS),
// protocol scheme injection, null-byte/control-character injection, and whitespace manipulation in anchor tags.
export const safeUrl = (url) => {
  if (!url || typeof url !== "string") return "#";
  if (/[\x00-\x1F\x7F]/.test(url) || /\s/.test(url)) return "#";
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch (e) {}
  return "#";
};

// Security: Validates and sanitizes media MIME types to restrict allowed formats to explicit image/video types.
// Prevents MIME-type injection and execution of untrusted data payloads.
export const ALLOWED_MEDIA_MIMES = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
  "video/webm", "video/mp4", "video/ogg"
]);

export const safeMediaMimeType = (mimeType) => {
  if (mimeType && ALLOWED_MEDIA_MIMES.has(mimeType.toLowerCase().trim())) {
    return mimeType.toLowerCase().trim();
  }
  return "image/png";
};

// Security: Sanitizes base64 media payload strings by stripping invalid non-base64 characters.
export const safeMediaBase64 = (data) => {
  if (typeof data !== "string") return "";
  return data.replace(/[^A-Za-z0-9+/=]/g, "");
};

// Security: Validates storage dictionary keys to prevent Prototype Pollution, Object property shadowing
// (e.g. toString / valueOf override crashes), and control character / null-byte injection.
export const FORBIDDEN_STORAGE_KEYS = new Set([
  "__proto__", "constructor", "prototype", "toString", "valueOf",
  "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString"
]);

export const isValidStorageKey = (key) => {
  if (!key || typeof key !== "string") return false;
  if (key.length > 250) return false;
  if (/[\x00-\x1F\x7F]/.test(key)) return false;
  if (FORBIDDEN_STORAGE_KEYS.has(key)) return false;
  return true;
};

// Security: Strips dangerous keys (__proto__, constructor, prototype, etc.) from plain objects
// to prevent Prototype Pollution and object property shadowing attacks.
export const sanitizeObjectKeys = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  const clean = {};
  const keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (isValidStorageKey(key)) {
      clean[key] = obj[key];
    }
  }
  return clean;
};
