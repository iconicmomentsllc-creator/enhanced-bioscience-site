const { createHmac, timingSafeEqual } = require("crypto");
const { test } = require("node:test");
const assert = require("node:assert/strict");

function parseSignatureHeader(header) {
  const text = String(header || "").trim();
  if (!text) return null;
  const hex = text.startsWith("sha256=") ? text.slice(7) : text;
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  return hex.toLowerCase();
}

function verifyPrescriberxSignature(rawBody, signatureHeader, secret) {
  if (!secret || typeof rawBody !== "string") return false;
  const provided = parseSignatureHeader(signatureHeader);
  if (!provided) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

test("accepts a valid HMAC-SHA256 signature over the raw body", () => {
  const secret = "webhook-test-secret";
  const raw =
    '{"event":"webhook.test","webhook_id":"abc","timestamp":"2026-01-01T00:00:00Z","subscription_id":"x","data":{}}';
  const header =
    "sha256=" + createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  assert.equal(verifyPrescriberxSignature(raw, header, secret), true);
});

test("rejects a missing, truncated, or wrong signature", () => {
  const secret = "webhook-test-secret";
  const raw = '{"event":"order.placed"}';
  assert.equal(verifyPrescriberxSignature(raw, "", secret), false);
  assert.equal(verifyPrescriberxSignature(raw, "sha256=deadbeef", secret), false);
  const other =
    "sha256=" + createHmac("sha256", "other").update(raw, "utf8").digest("hex");
  assert.equal(verifyPrescriberxSignature(raw, other, secret), false);
});
