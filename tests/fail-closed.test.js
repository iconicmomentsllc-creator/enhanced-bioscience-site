const { test } = require("node:test");
const assert = require("node:assert/strict");

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function environmentUrlMismatch(env, baseUrl) {
  const host = hostnameOf(baseUrl);
  if (!env || !host) return null;
  if (env === "production" && /(^|\.)demo\.|sandbox/.test(host)) {
    return "production_base_url_mismatch";
  }
  if (
    env === "sandbox" &&
    /(^|\.)prescribe-rx\.com$/.test(host) &&
    !/(^|\.)demo\./.test(host)
  ) {
    return "sandbox_base_url_mismatch";
  }
  return null;
}

function sandboxCredentialsInProduction({ env, gateway, secret, publishable }) {
  if (env !== "production") return null;
  if (!gateway) return null;
  if (gateway === "test") return "sandbox_payment_credentials";
  if (gateway === "stripe") {
    if (!String(secret || "").startsWith("sk_live_")) return "sandbox_payment_credentials";
    if (String(publishable || "").startsWith("pk_test_")) return "sandbox_payment_credentials";
  }
  return null;
}

function isAllowedIntegrationIdentity(user) {
  const type = user && user.user_type;
  return type === 2 || type === 6 || type === 9 || type === 10;
}

test("production fails closed against demo or sandbox hosts", () => {
  assert.equal(
    environmentUrlMismatch("production", "https://demo.prescribe-rx.com/api/v1"),
    "production_base_url_mismatch"
  );
  assert.equal(
    environmentUrlMismatch("sandbox", "https://prescribe-rx.com/api/v1"),
    "sandbox_base_url_mismatch"
  );
  assert.equal(
    environmentUrlMismatch("sandbox", "https://www.prescribe-rx.com/api/v1"),
    "sandbox_base_url_mismatch"
  );
  assert.equal(
    environmentUrlMismatch("sandbox", "https://demo.prescribe-rx.com/api/v1"),
    null
  );
  assert.equal(
    environmentUrlMismatch("production", "https://prescribe-rx.com/api/v1"),
    null
  );
});

test("production fails closed on Stripe test keys and the test gateway", () => {
  assert.equal(
    sandboxCredentialsInProduction({
      env: "production",
      gateway: "stripe",
      secret: "sk_test_123",
      publishable: "pk_test_123",
    }),
    "sandbox_payment_credentials"
  );
  assert.equal(
    sandboxCredentialsInProduction({
      env: "production",
      gateway: "test",
      secret: "",
      publishable: "",
    }),
    "sandbox_payment_credentials"
  );
  assert.equal(
    sandboxCredentialsInProduction({
      env: "production",
      gateway: "stripe",
      secret: "sk_live_abc",
      publishable: "pk_live_abc",
    }),
    null
  );
  assert.equal(
    sandboxCredentialsInProduction({
      env: "sandbox",
      gateway: "stripe",
      secret: "sk_test_123",
      publishable: "pk_test_123",
    }),
    null
  );
});

test("allows Client and Sales Org identities and rejects Patient, Provider, and admin", () => {
  assert.equal(isAllowedIntegrationIdentity({ user_type: 6 }), true);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 2 }), true);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 10 }), true);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 9 }), true);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 1 }), false);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 0 }), false);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 3 }), false);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 4 }), false);
  assert.equal(isAllowedIntegrationIdentity({ user_type: 8 }), false);
  assert.equal(isAllowedIntegrationIdentity({}), false);
});
