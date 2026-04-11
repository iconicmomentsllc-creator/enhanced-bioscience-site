const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS = 5;
const store = new Map();

function prune(ip, now) {
  const times = store.get(ip);
  if (!times) return [];
  const recent = times.filter((t) => now - t < WINDOW_MS);
  if (recent.length === 0) store.delete(ip);
  else store.set(ip, recent);
  return recent;
}

export function rateLimitOrThrow(ip) {
  const now = Date.now();
  const recent = prune(ip, now);
  if (recent.length >= MAX_REQUESTS) {
    const err = new Error("Too many requests");
    err.status = 429;
    throw err;
  }
  recent.push(now);
  store.set(ip, recent);
}

export function clientIpFromRequest(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real?.trim()) return real.trim();
  return "unknown";
}
