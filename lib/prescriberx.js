import "server-only";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);

export function isPrescriberxConfigured() {
  return Boolean(
    process.env.PRESCRIBERX_BASE_URL?.trim() &&
      process.env.PRESCRIBERX_TOKEN?.trim()
  );
}

function getConfig() {
  const baseUrl = process.env.PRESCRIBERX_BASE_URL?.trim().replace(/\/+$/, "");
  const token = process.env.PRESCRIBERX_TOKEN?.trim();

  if (!baseUrl || !token) {
    const err = new Error("PrescribeRx is not configured.");
    err.code = "PRESCRIBERX_NOT_CONFIGURED";
    throw err;
  }

  return { baseUrl, token };
}

function joinUrl(baseUrl, path) {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
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
 * Reads PRESCRIBERX_BASE_URL and PRESCRIBERX_TOKEN. Never import from client code.
 *
 * @param {string} path pathname (e.g. "/orders") or absolute URL
 * @param {RequestInit & { json?: unknown }} [options]
 * @returns {Promise<Response>}
 */
export async function prescriberxFetch(path, options = {}) {
  const { baseUrl } = getConfig();
  const { json, headers: extraHeaders, ...rest } = options;
  const method = String(rest.method || "GET").toUpperCase();
  const headers = authenticatedHeaders(method, extraHeaders);

  const init = { ...rest, method, headers };
  if (json !== undefined) {
    init.body = JSON.stringify(json);
  }

  return fetch(joinUrl(baseUrl, path), init);
}
