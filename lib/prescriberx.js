import "server-only";
import {
  getPrescriberxBaseUrl,
  getPrescriberxToken,
  isPrescriberxConfigured,
} from "./prescriberxConfig";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);
const DEFAULT_TIMEOUT_MS = 25000;

export { isPrescriberxConfigured };

function getConfig() {
  const baseUrl = getPrescriberxBaseUrl();
  const token = getPrescriberxToken();

  if (!baseUrl || !token || !isPrescriberxConfigured()) {
    const err = new Error("PrescribeRx is not configured.");
    err.code = "PRESCRIBERX_NOT_CONFIGURED";
    throw err;
  }

  return { baseUrl, token };
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

function authenticatedHeaders(method, extraHeaders) {
  const { token } = getConfig();
  const headers = new Headers(extraHeaders);

  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");

  if (WRITE_METHODS.has(String(method || "GET").toUpperCase())) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
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
  const { baseUrl } = getConfig();
  const { json, headers: extraHeaders, timeoutMs, ...rest } = options;
  const method = String(rest.method || "GET").toUpperCase();
  const headers = authenticatedHeaders(method, extraHeaders);
  const timeout = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;

  const init = { ...rest, method, headers, cache: "no-store" };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }
  if (!init.signal && timeout > 0 && typeof AbortSignal !== "undefined" && AbortSignal.timeout) {
    init.signal = AbortSignal.timeout(timeout);
  }

  return fetch(joinUrl(baseUrl, path), init);
}
