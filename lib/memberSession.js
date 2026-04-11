import { createHmac, timingSafeEqual } from "crypto";

export const MEMBER_SESSION_COOKIE = "member_session";

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

function sessionSecret() {
  return (
    process.env.MEMBER_SESSION_SECRET ||
    "__dev_member_session_secret_set_in_production__"
  );
}

export function createMemberSessionValue() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url"
  );
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function isValidMemberSessionValue(raw) {
  if (!raw || typeof raw !== "string") return false;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expected, "utf8"))) {
      return false;
    }
  } catch {
    return false;
  }
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (typeof data.exp !== "number") return false;
  return data.exp >= Math.floor(Date.now() / 1000);
}

export function memberSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SEC,
  };
}
