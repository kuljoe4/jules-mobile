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

export const safeUrl = (url) => {
  if (!url) return "#";
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
