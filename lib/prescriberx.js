import "server-only";
import {
  getPrescriberxBaseUrl,
  hasLoginCredentials,
  isPrescriberxConfigured,
} from "./prescriberxConfig";
import {
  getPrescriberxAccessToken,
  invalidatePrescriberxAccessToken,
} from "./prescriberxToken";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);
const DEFAULT_TIMEOUT_MS = 25000;

export { isPrescriberxConfigured };

function requireBaseUrl() {
  const baseUrl = getPrescriberxBaseUrl();
  if (!baseUrl || !isPrescriberxConfigured()) {
    const err = new Error("PrescribeRx is not configured.");
    err.code = "PRESCRIBERX_NOT_CONFIGURED";
    throw err;
  }
  return baseUrl;
}

function joinUrl(baseUrl, path) {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) {
    const err = new Error("Absolute upstream URLs are not allowed.");
    err.code = "PRESCRIBERX_INVALID_PATH";
    throw err;
  }
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function requestHeaders(method, extraHeaders, token) {
  const headers = new Headers(extraHeaders);
  headers.set("Accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (WRITE_METHODS.has(String(method || "GET").toUpperCase())) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

function buildInit(options, method, headers) {
  const { json, timeoutMs, headers: _ignored, ...rest } = options;
  const timeout = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const init = { ...rest, method, headers, cache: "no-store" };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }
  if (!init.signal && timeout > 0 && typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(timeout);
  }
  return init;
}

/**
 * Server-only authenticated request to PrescribeRx.
 * Never import from client code. Never log the token or Authorization header.
 *
 * @param {string} path pathname (e.g. "/catalog") — not an absolute URL
 * @param {RequestInit & { json?: unknown, timeoutMs?: number }} [options]
 * @returns {Promise<Response>}
 */
export async function prescriberxFetch(path, options = {}) {
  const baseUrl = requireBaseUrl();
  const method = String(options.method || "GET").toUpperCase();
  const url = joinUrl(baseUrl, path);

  let token = await getPrescriberxAccessToken();
  let response = await fetch(url, buildInit(options, method, requestHeaders(method, options.headers, token)));

  if (response.status === 401 && hasLoginCredentials()) {
    invalidatePrescriberxAccessToken();
    token = await getPrescriberxAccessToken();
    response = await fetch(url, buildInit(options, method, requestHeaders(method, options.headers, token)));
  }

  return response;
}
