import { createHmac, timingSafeEqual } from "crypto";

export function parseSignatureHeader(header) {
  const text = String(header || "").trim();
  if (!text) return null;
  const hex = text.startsWith("sha256=") ? text.slice(7) : text;
  if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
  return hex.toLowerCase();
}

export function verifyPrescriberxSignature(rawBody, signatureHeader, secret) {
  if (!secret || typeof rawBody !== "string") return false;
  const provided = parseSignatureHeader(signatureHeader);
  if (!provided) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
