/**
 * One-time: create a PrescribeRx webhook subscription after the public URL exists.
 *
 *   node scripts/setup-prescriberx-webhook.mjs
 *
 * Requires PRESCRIBERX_BASE_URL, PRESCRIBERX_TOKEN, and WEBHOOK_PUBLIC_URL
 * (or NEXTAUTH_URL). Prints the signing secret once. Put it in
 * PRESCRIBERX_WEBHOOK_SECRET immediately. Never commit the secret.
 *
 * Resolves subscriber_id from GET /auth/me (Client or Sales Organization).
 * Does not use admin tokens.
 */

function fail(message) {
  process.stderr.write(message + "\n");
  process.exit(1);
}

const base = process.env.PRESCRIBERX_BASE_URL?.trim().replace(/\/+$/, "");
const token = process.env.PRESCRIBERX_TOKEN?.trim();
const publicBase = (
  process.env.WEBHOOK_PUBLIC_URL ||
  process.env.NEXTAUTH_URL ||
  ""
)
  .trim()
  .replace(/\/+$/, "");

if (!base || !token) fail("PRESCRIBERX_BASE_URL and PRESCRIBERX_TOKEN are required.");
if (!publicBase) fail("Set WEBHOOK_PUBLIC_URL or NEXTAUTH_URL to the public https origin.");
if (/localhost|127\.0\.0\.1|10\.|192\.168\./i.test(publicBase)) {
  fail("Webhook URL must be publicly routable. Localhost is rejected by PrescribeRx.");
}

const url = `${publicBase}/api/prescriberx/webhook`;
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

const meRes = await fetch(`${base}/auth/me`, { headers: { ...headers } });
const meJson = await meRes.json().catch(() => ({}));
if (!meRes.ok) fail("Could not read integration identity from /auth/me.");

const user = meJson?.data?.user || meJson?.user || {};
const abilities = meJson?.data?.abilities || [];
const typeLabel = String(user.user_type_label || "").toLowerCase();
const type = user.user_type;

if (![2, 6, 9, 10].includes(type)) {
  fail("Use a Client or Sales Organization token, not a Patient, Provider, or admin token.");
}

let subscriber_type;
let subscriber_id;
if (type === 6 || type === 10 || typeLabel.includes("client")) {
  subscriber_type = "client";
  subscriber_id = user.client_id;
} else if (type === 2 || typeLabel.includes("sales")) {
  subscriber_type = "sales_organization";
  subscriber_id = user.sales_organization_id;
} else {
  fail("Token is not a Client or Sales Organization integration identity.");
}

if (!subscriber_id) fail("Could not resolve subscriber_id from the token profile.");
if (Array.isArray(abilities) && abilities.length && !abilities.includes("webhook:create")) {
  fail("Token is missing webhook:create.");
}

const events = [
  "encounter.created",
  "encounter.status_changed",
  "encounter.prescribed",
  "encounter.completed",
  "encounter.cancelled",
  "order.placed",
  "order.paid",
  "order.status_changed",
  "order.cancelled",
  "fulfillment.shipped",
  "fulfillment.delivered",
  "fulfillment.cancelled",
  "prescription.written",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.payment_failed",
  "subscription.paused",
  "subscription.resumed",
  "subscription.refill_requested",
  "subscription.reassessment_due",
];

const createRes = await fetch(`${base}/webhooks`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    subscriber_type,
    subscriber_id,
    url,
    events,
    description: "Enhanced Bioscience production receiver",
    is_active: true,
  }),
});
const created = await createRes.json().catch(() => ({}));
if (!createRes.ok) {
  fail("Webhook subscription was not created. Check token abilities and public URL.");
}

const secret =
  created?.data?.secret || created?.secret || created?.data?.signing_secret;
process.stdout.write(
  [
    "Webhook subscription created.",
    `Subscriber type: ${subscriber_type}`,
    "Copy the signing secret into Vercel as PRESCRIBERX_WEBHOOK_SECRET now.",
    "It will not be shown again by PrescribeRx.",
    secret ? `PRESCRIBERX_WEBHOOK_SECRET=${secret}` : "Secret missing from response.",
    "",
  ].join("\n")
);
