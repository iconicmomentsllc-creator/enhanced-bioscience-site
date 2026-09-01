const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  isHardStopNotice,
  mapEncounterStatus,
  mapWebhookEventToStatus,
} = require("./helpers/status.cjs");
const {
  buildReferencePaymentBlock,
  normalizePaymentMode,
} = require("./helpers/payment.cjs");

test("maps encounter workflow values to customer statuses", () => {
  assert.equal(mapEncounterStatus("pending_provider_review"), "under_review");
  assert.equal(mapEncounterStatus("prescribed"), "prescribed");
  assert.equal(mapEncounterStatus("rejected"), "ineligible");
  assert.equal(mapEncounterStatus("not-a-real-status"), null);
});

test("maps fulfillment and payment webhook events", () => {
  assert.equal(mapWebhookEventToStatus("fulfillment.shipped", {}), "shipped");
  assert.equal(mapWebhookEventToStatus("fulfillment.delivered", {}), "delivered");
  assert.equal(mapWebhookEventToStatus("subscription.payment_failed", {}), "payment_required");
  assert.equal(
    mapWebhookEventToStatus("encounter.status_changed", { new_status: "prescribed" }),
    "prescribed"
  );
});

test("distinguishes absolute hard stops from warnings", () => {
  assert.equal(isHardStopNotice({ severity: "absolute", can_override: false }), true);
  assert.equal(isHardStopNotice({ severity: "warn", can_override: true }), false);
  assert.equal(isHardStopNotice({ severity: "relative", can_override: true }), false);
  assert.equal(isHardStopNotice({ severity: "flag", can_override: true }), false);
});

test("never allows payment.mode=authorize", () => {
  assert.equal(normalizePaymentMode("authorize"), null);
  assert.equal(normalizePaymentMode("reference_captured"), "reference_captured");
  assert.equal(normalizePaymentMode("reference_preauth"), "reference_preauth");
});

test("builds a reference_captured block without a browser amount", () => {
  const block = buildReferencePaymentBlock({
    mode: "reference_captured",
    gateway: "stripe",
    merchantAccountId: "11111111-1111-4111-8111-111111111111",
    billingEnabled: true,
    charge: {
      transactionId: "pi_test_123",
      amount: 129,
      capturedAt: "2026-09-01T18:00:00.000Z",
      cardToken: { customer_id: "cus_x", payment_method_id: "pm_x" },
      cardMetadata: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 },
    },
  });
  assert.equal(block.mode, "reference_captured");
  assert.equal(block.transaction.transaction_id, "pi_test_123");
  assert.equal(block.transaction.amount, 129);
  assert.equal(block.card_token.payment_method_id, "pm_x");
});

test("omits vault tokens when merchant billing is not enabled", () => {
  const block = buildReferencePaymentBlock({
    mode: "reference_captured",
    gateway: "stripe",
    merchantAccountId: null,
    billingEnabled: false,
    charge: {
      transactionId: "pi_test_123",
      amount: 50,
      capturedAt: "2026-09-01T18:00:00.000Z",
      cardToken: { customer_id: "cus_x", payment_method_id: "pm_x" },
    },
  });
  assert.equal(block.merchant_account_id, undefined);
  assert.equal(block.card_token, undefined);
});
