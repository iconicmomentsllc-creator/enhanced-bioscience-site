const { test } = require("node:test");
const assert = require("node:assert/strict");

const TOKEN_SKEW_MS = 60 * 1000;
const MISSING_EXPIRY_TTL_MS = 45 * 60 * 1000;

function isPrescriberxTokenFresh(expiresAtMs, now, skewMs = TOKEN_SKEW_MS) {
  return Number.isFinite(expiresAtMs) && expiresAtMs - skewMs > now;
}

function parseLoginExpiresAtMs(raw, now) {
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return now + MISSING_EXPIRY_TTL_MS;
}

function tokenFromLoginPayload(payload) {
  if (!payload || typeof payload !== "object") return "";
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const token = typeof data.token === "string" ? data.token.trim() : "";
  return token;
}

test("cached login tokens refresh before expires_at", () => {
  const now = Date.parse("2026-09-03T18:00:00.000Z");
  const expires = Date.parse("2026-09-03T18:00:30.000Z");
  assert.equal(isPrescriberxTokenFresh(expires, now), false);
  assert.equal(isPrescriberxTokenFresh(now + 10 * 60 * 1000, now), true);
});

test("reads token and expires_at from the documented login payload shape", () => {
  const now = Date.parse("2026-09-03T12:00:00.000Z");
  const payload = {
    success: true,
    data: {
      token: "1|example-token",
      expires_at: "2026-09-04T12:00:00+00:00",
    },
  };
  assert.equal(tokenFromLoginPayload(payload), "1|example-token");
  assert.equal(parseLoginExpiresAtMs(payload.data.expires_at, now), Date.parse(payload.data.expires_at));
  assert.equal(tokenFromLoginPayload({}), "");
});
