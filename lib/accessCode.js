/** Member portal access code (normalized: trimmed, uppercased). */
export const MEMBER_ACCESS_CODE = (
  process.env.MEMBER_ACCESS_CODE || "EBS2026"
).trim();

export function normalizeAccessCode(code) {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

export function isValidMemberAccessCode(code) {
  return normalizeAccessCode(code) === MEMBER_ACCESS_CODE;
}
