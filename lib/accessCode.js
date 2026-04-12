/** Membership access code (normalized: trimmed, uppercased). Set MEMBER_ACCESS_CODE in production. */
export const MEMBER_ACCESS_CODE = (
  process.env.MEMBER_ACCESS_CODE || "EBS2026"
).trim();

export function normalizeAccessCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

export function isValidMemberAccessCode(code) {
  return normalizeAccessCode(code) === normalizeAccessCode(MEMBER_ACCESS_CODE);
}
