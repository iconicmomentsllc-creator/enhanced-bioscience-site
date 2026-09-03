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

  const response = await fetch(joinUrl(baseUrl, "/auth/login"), init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error("PrescribeRx login failed.");
    err.code = "PRESCRIBERX_AUTH_FAILED";
    throw err;
  }

  const token = tokenFromLoginPayload(payload);
  if (!token) {
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
