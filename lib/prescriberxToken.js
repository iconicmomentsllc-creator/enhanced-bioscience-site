import "server-only";
import {
  getPrescriberxBaseUrl,
  getPrescriberxDeviceName,
  getPrescriberxEmail,
  getPrescriberxPassword,
  getPrescriberxToken,
  hasLoginCredentials,
  isPrescriberxConfigured,
} from "./prescriberxConfig";

const TOKEN_SKEW_MS = 60 * 1000;
const MISSING_EXPIRY_TTL_MS = 45 * 60 * 1000;
const LOGIN_TIMEOUT_MS = 25000;

let cache = { token: "", expiresAtMs: 0 };
let inflight = null;

export function isPrescriberxTokenFresh(expiresAtMs, now = Date.now(), skewMs = TOKEN_SKEW_MS) {
  return Number.isFinite(expiresAtMs) && expiresAtMs - skewMs > now;
}

export function parseLoginExpiresAtMs(raw, now = Date.now()) {
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return now + MISSING_EXPIRY_TTL_MS;
}

export function tokenFromLoginPayload(payload) {
  if (!payload || typeof payload !== "object") return "";
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const token = typeof data.token === "string" ? data.token.trim() : "";
  return token;
}

export function expiresAtFromLoginPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  return typeof data.expires_at === "string" ? data.expires_at : null;
}

export function invalidatePrescriberxAccessToken() {
  cache = { token: "", expiresAtMs: 0 };
}

function joinUrl(baseUrl, path) {
  if (/^https?:\/\//i.test(path)) {
    const err = new Error("Absolute upstream URLs are not allowed.");
    err.code = "PRESCRIBERX_INVALID_PATH";
    throw err;
  }
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function notConfigured() {
  const err = new Error("PrescribeRx is not configured.");
  err.code = "PRESCRIBERX_NOT_CONFIGURED";
  return err;
}

function sanitizedLoginErrorField(payload) {
  if (!payload || typeof payload !== "object") return null;
  const raw =
    (typeof payload.error === "string" && payload.error) ||
    (typeof payload.message === "string" && payload.message) ||
    (payload.data && typeof payload.data.error === "string" && payload.data.error) ||
    (payload.data && typeof payload.data.message === "string" && payload.data.message) ||
    null;
  if (!raw) return null;
  const trimmed = raw.trim().slice(0, 200);
  if (/bearer\s+[a-z0-9._|-]+|authorization:\s+\S+/i.test(trimmed)) {
    return "[redacted]";
  }
  return trimmed.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted]");
}

function logLoginAttempt({ status, json, error }) {
  console.info("[prescriberx]", {
    endpoint: "POST /auth/login",
    status,
    json,
    error: error || null,
  });
}

async function loginAndCache() {
  const baseUrl = getPrescriberxBaseUrl();
  const email = getPrescriberxEmail();
  const password = getPrescriberxPassword();
  const deviceName = getPrescriberxDeviceName();
  if (!baseUrl || !email || !password || !deviceName) {
    throw notConfigured();
  }

  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");

  const init = {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      email,
      password,
      device_name: deviceName,
    }),
  };
  if (typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(LOGIN_TIMEOUT_MS);
  }

  let response;
  try {
    response = await fetch(joinUrl(baseUrl, "/auth/login"), init);
  } catch {
    logLoginAttempt({ status: 0, json: false, error: "network_or_timeout" });
    const err = new Error("PrescribeRx login failed.");
    err.code = "PRESCRIBERX_AUTH_FAILED";
    throw err;
  }

  const raw = await response.text();
  let payload = null;
  let wasJson = false;
  try {
    payload = JSON.parse(raw);
    wasJson = Boolean(payload) && typeof payload === "object";
  } catch {
    wasJson = false;
  }

  const publicError = sanitizedLoginErrorField(payload);
  const token = tokenFromLoginPayload(payload);
  logLoginAttempt({
    status: response.status,
    json: wasJson,
    error: publicError || (!response.ok || !token ? (token ? null : "missing_token") : null),
  });

  if (!response.ok || !token) {
    const err = new Error("PrescribeRx login failed.");
    err.code = "PRESCRIBERX_AUTH_FAILED";
    throw err;
  }

  cache = {
    token,
    expiresAtMs: parseLoginExpiresAtMs(expiresAtFromLoginPayload(payload)),
  };
  return token;
}

/**
 * Server-only access token for PrescribeRx.
 * Prefers POST /auth/login when login env vars are set; otherwise PRESCRIBERX_TOKEN.
 * Never log the token, password, or Authorization header.
 */
export async function getPrescriberxAccessToken() {
  if (!isPrescriberxConfigured()) {
    throw notConfigured();
  }

  if (hasLoginCredentials()) {
    if (isPrescriberxTokenFresh(cache.expiresAtMs) && cache.token) {
      return cache.token;
    }
    if (!inflight) {
      inflight = loginAndCache().finally(() => {
        inflight = null;
      });
    }
    return inflight;
  }

  const fallback = getPrescriberxToken();
  if (fallback) return fallback;
  throw notConfigured();
}
