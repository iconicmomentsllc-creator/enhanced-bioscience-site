import "server-only";
import { isProductionEnvironment } from "./prescriberxConfig";
import { prescriberxFetch } from "./prescriberx";

/** Client, Sales Organization, Client Provider, Client Admin */
const ALLOWED_USER_TYPES = new Set([2, 6, 9, 10]);

let cache = { at: 0, ok: false, code: null };

export function isAllowedIntegrationIdentity(user) {
  const type = user && user.user_type;
  return ALLOWED_USER_TYPES.has(type);
}

/**
 * Production only: reject Patient, Provider, and admin/API tokens.
 * Sandbox may use a limited demo token; do not probe identity there.
 */
export async function assertProductionIntegrationIdentity() {
  if (!isProductionEnvironment()) return { ok: true };

  const now = Date.now();
  if (cache.at && now - cache.at < 60_000) {
    return cache.ok ? { ok: true } : { ok: false, code: cache.code || "not_configured" };
  }

  try {
    const response = await prescriberxFetch("/auth/me", { method: "GET" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      cache = { at: now, ok: false, code: "not_configured" };
      return { ok: false, code: "not_configured" };
    }
    const user = payload?.data?.user || payload?.user || {};
    if (!isAllowedIntegrationIdentity(user)) {
      cache = { at: now, ok: false, code: "not_configured" };
      return { ok: false, code: "not_configured" };
    }
    cache = { at: now, ok: true, code: null };
    return { ok: true };
  } catch {
    cache = { at: now, ok: false, code: "unavailable" };
    return { ok: false, code: "unavailable" };
  }
}
