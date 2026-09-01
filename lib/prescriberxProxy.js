import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { randomUUID } from "crypto";
import { authOptions } from "./authOptions";
import { isPrescriberxConfigured, prescriberxFetch } from "./prescriberx";
import { clientIpFromRequest } from "./accessRequestRateLimit";
import { isSandboxIntake, productionConfigError } from "./prescriberxConfig";
import { assertProductionIntegrationIdentity } from "./prescriberxIdentity";

export { isSandboxIntake };

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const rateBuckets = new Map();
const MAX_JSON_BYTES = 256 * 1024;

export function asText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function asId(value) {
  const text = asText(value);
  return text && UUID_RE.test(text) ? text : null;
}

export function unwrapPrescriberxData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }
  return payload;
}

export function publicMessage(value) {
  const text = asText(value);
  if (!text) return null;
  if (
    /prescriberx|prescribe-rx|bearer|authorization|wholesale|api[_-]?key|token|sanctum/i.test(
      text
    )
  ) {
    return null;
  }
  return text.slice(0, 400);
}

export function requestIdFromPayload(payload) {
  const id = asText(payload?.meta?.request_id);
  return id && id.length <= 80 ? id : null;
}

function defaultMessage(error) {
  switch (error) {
    case "not_configured":
      return "This service is not available yet.";
    case "unauthorized":
      return "Please sign in to continue.";
    case "forbidden":
      return "This request is not allowed.";
    case "not_found":
      return "That item is no longer available.";
    case "conflict":
      return "This request could not be updated. Contact us if you need a change.";
    case "invalid":
      return "Please review your information and try again.";
    case "payment_failed":
      return "Payment could not be completed. No duplicate charge will be attempted automatically.";
    case "rate_limited":
      return "Too many requests. Please wait a moment and try again.";
    case "payload_too_large":
      return "This request is too large.";
    case "unavailable":
    default:
      return "We could not complete this request. Please try again.";
  }
}

export function jsonError(error, status, message, extra = {}) {
  const body = {
    error,
    message: message || defaultMessage(error),
  };
  if (extra.request_id) body.request_id = extra.request_id;
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}

export function jsonOk(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function errorFromUpstreamStatus(status, payload) {
  const request_id = requestIdFromPayload(payload);
  switch (status) {
    case 400:
      return jsonError("invalid", 400, undefined, { request_id });
    case 401:
      return jsonError("unavailable", 503, undefined, { request_id });
    case 402:
      return jsonError("payment_failed", 402, undefined, { request_id });
    case 403:
      return jsonError("forbidden", 403, undefined, { request_id });
    case 404:
      return jsonError("not_found", 404, undefined, { request_id });
    case 409:
      return jsonError("conflict", 409, undefined, { request_id });
    case 422:
      return jsonError("invalid", 422, undefined, { request_id });
    case 429:
      return jsonError("rate_limited", 429, undefined, { request_id });
    default:
      return jsonError("unavailable", 502, undefined, { request_id });
  }
}

export async function requireMemberSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      session: null,
      response: jsonError("unauthorized", 401),
    };
  }
  return { session, response: null };
}

export function rateLimitRequest(request, { windowMs, max, name }) {
  const ip = clientIpFromRequest(request);
  const key = `${name}:${ip}`;
  const now = Date.now();
  const recent = (rateBuckets.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    return jsonError("rate_limited", 429);
  }
  recent.push(now);
  rateBuckets.set(key, recent);
  return null;
}

export function rejectIfTooLarge(request) {
  const raw = request.headers.get("content-length");
  const n = raw ? Number(raw) : NaN;
  if (Number.isFinite(n) && n > MAX_JSON_BYTES) {
    return jsonError("payload_too_large", 413);
  }
  return null;
}

export async function prescriberxJson(path, options = {}) {
  if (!isPrescriberxConfigured() || productionConfigError()) {
    return { ok: false, response: jsonError("not_configured", 503) };
  }

  const identity = await assertProductionIntegrationIdentity();
  if (!identity.ok) {
    return { ok: false, response: jsonError(identity.code || "not_configured", 503) };
  }

  let response;
  try {
    response = await prescriberxFetch(path, { cache: "no-store", ...options });
  } catch {
    return { ok: false, response: jsonError("unavailable", 502) };
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      payload,
      response: errorFromUpstreamStatus(response.status, payload),
    };
  }

  return { ok: true, status: response.status, payload };
}

export function newIdempotencyKey() {
  return randomUUID();
}
