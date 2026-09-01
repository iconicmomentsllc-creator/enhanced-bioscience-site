const ALLOWED_PAYMENT_MODES = new Set(["reference_captured", "reference_preauth"]);

function normalizePaymentMode(raw) {
  const mode = String(raw || "reference_captured").trim().toLowerCase();
  if (mode === "authorize") return null;
  if (ALLOWED_PAYMENT_MODES.has(mode)) return mode;
  return "reference_captured";
}

function buildReferencePaymentBlock({
  mode,
  gateway,
  merchantAccountId,
  billingEnabled,
  charge,
}) {
  if (!charge?.transactionId) return undefined;
  const safeMode = normalizePaymentMode(mode);
  if (!safeMode) return undefined;
  const amount = Number(charge.amount);
  const block = {
    mode: safeMode,
    gateway: gateway === "test" ? "stripe" : gateway,
  };
  if (billingEnabled && merchantAccountId) {
    block.merchant_account_id = merchantAccountId;
    if (charge.cardToken) block.card_token = charge.cardToken;
  }
  if (charge.cardMetadata?.last4) {
    block.card_metadata = {
      brand: charge.cardMetadata.brand,
      last4: String(charge.cardMetadata.last4).slice(0, 4),
      exp_month: charge.cardMetadata.exp_month,
      exp_year: charge.cardMetadata.exp_year,
    };
  }
  if (safeMode === "reference_preauth") {
    block.pre_auth = {
      transaction_id: charge.transactionId,
      authorized_amount: amount,
      authorized_at: charge.capturedAt,
    };
  } else {
    block.transaction = {
      transaction_id: charge.transactionId,
      amount,
      captured_at: charge.capturedAt,
    };
  }
  return block;
}

module.exports = { ALLOWED_PAYMENT_MODES, normalizePaymentMode, buildReferencePaymentBlock };
