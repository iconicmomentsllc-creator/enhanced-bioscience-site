import "server-only";
import {
  getMerchantAccountId,
  getPaymentGatewayName,
  getPaymentMode,
  isProductionEnvironment,
  isSandboxEnvironment,
  sandboxCredentialsInProduction,
} from "../prescriberxConfig";
import { buildReferencePaymentBlock, normalizePaymentMode } from "./contract";

const SUPPORTED = new Set(["stripe", "authorize_net", "nmi", "square", "test"]);

function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}
function authorizeNetConfigured() {
  return Boolean(
    process.env.AUTHORIZE_NET_API_LOGIN_ID?.trim() &&
      process.env.AUTHORIZE_NET_TRANSACTION_KEY?.trim()
  );
}
function nmiConfigured() {
  return Boolean(process.env.NMI_SECURITY_KEY?.trim());
}
function squareConfigured() {
  return Boolean(
    process.env.SQUARE_ACCESS_TOKEN?.trim() && process.env.SQUARE_LOCATION_ID?.trim()
  );
}

function gatewayHasCredentials(name) {
  switch (name) {
    case "stripe":
      return stripeConfigured();
    case "authorize_net":
      return authorizeNetConfigured();
    case "nmi":
      return nmiConfigured();
    case "square":
      return squareConfigured();
    case "test":
      return !isProductionEnvironment();
    default:
      return false;
  }
}

/**
 * Isolated payment adapter. Clinical intake must not import gateway SDKs.
 * Never accepts a browser-supplied amount. Never stores PAN/CVV.
 */
export function getPaymentAdapterState() {
  const name = getPaymentGatewayName();
  const mode = normalizePaymentMode(getPaymentMode()) || "reference_captured";
  const merchantAccountId = getMerchantAccountId();
  const supported = SUPPORTED.has(name);
  const credentials = supported && gatewayHasCredentials(name);
  const configured =
    Boolean(name) && supported && credentials && !sandboxCredentialsInProduction();
  const billingEnabled = configured && Boolean(merchantAccountId);

  return {
    gateway: supported ? name : "",
    mode: mode === "reference_preauth" ? "reference_preauth" : "reference_captured",
    configured,
    billingEnabled,
    merchantAccountId: merchantAccountId || null,
    publishableKey:
      configured && name === "stripe"
        ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || null
        : null,
  };
}

function dollarsFromCents(cents) {
  return Math.round(Number(cents)) / 100;
}

async function stripeCharge({ amountCents, currency, paymentMethodId, idempotencyKey }) {
  const key = process.env.STRIPE_SECRET_KEY.trim();
  const body = new URLSearchParams({
    amount: String(amountCents),
    currency: currency || "usd",
    confirm: "true",
    payment_method: paymentMethodId,
    "automatic_payment_methods[enabled]": "true",
    "automatic_payment_methods[allow_redirects]": "never",
  });
  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": idempotencyKey,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === "requires_action") {
    const err = new Error("payment_failed");
    err.code = "payment_failed";
    throw err;
  }
  const charge = json.charges?.data?.[0] || json.latest_charge || {};
  const pm = json.payment_method;
  return {
    transactionId: String(json.id || charge.id || ""),
    amount: dollarsFromCents(json.amount_received || json.amount || amountCents),
    capturedAt: new Date().toISOString(),
    cardToken: {
      customer_id: json.customer || undefined,
      payment_method_id: typeof pm === "string" ? pm : pm?.id || paymentMethodId,
    },
    cardMetadata: {
      brand: json.charges?.data?.[0]?.payment_method_details?.card?.brand,
      last4: json.charges?.data?.[0]?.payment_method_details?.card?.last4,
      exp_month: json.charges?.data?.[0]?.payment_method_details?.card?.exp_month,
      exp_year: json.charges?.data?.[0]?.payment_method_details?.card?.exp_year,
    },
  };
}

async function testCharge({ amountCents, idempotencyKey }) {
  return {
    transactionId: `test_${idempotencyKey.replace(/-/g, "").slice(0, 24)}`,
    amount: dollarsFromCents(amountCents),
    capturedAt: new Date().toISOString(),
    cardToken: { customer_id: "cus_test", payment_method_id: "pm_test" },
    cardMetadata: { brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 },
  };
}

/**
 * Charge using the configured external gateway.
 * @param {{ amountCents: number, currency?: string, paymentMethodId?: string, idempotencyKey: string }} input
 */
export async function captureExternalPayment(input) {
  const state = getPaymentAdapterState();
  const amountCents = Math.round(Number(input.amountCents));
  if (!Number.isFinite(amountCents) || amountCents < 1) {
    const err = new Error("invalid_amount");
    err.code = "invalid_amount";
    throw err;
  }
  if (!state.configured) {
    const err = new Error("not_configured");
    err.code = "not_configured";
    throw err;
  }
  if (state.mode === "authorize") {
    const err = new Error("authorize_forbidden");
    err.code = "authorize_forbidden";
    throw err;
  }

  if (state.gateway === "test") {
    return testCharge({ amountCents, idempotencyKey: input.idempotencyKey });
  }
  if (state.gateway === "stripe") {
    if (!input.paymentMethodId || !/^pm_/.test(input.paymentMethodId)) {
      const err = new Error("payment_method_required");
      err.code = "payment_method_required";
      throw err;
    }
    return stripeCharge({
      amountCents,
      currency: input.currency || "usd",
      paymentMethodId: input.paymentMethodId,
      idempotencyKey: input.idempotencyKey,
    });
  }

  const err = new Error("gateway_not_implemented_live");
  err.code = "not_configured";
  throw err;
}

export function buildPrescribeRxPaymentBlock({ charge }) {
  const state = getPaymentAdapterState();
  if (state.mode === "authorize") return undefined;
  return buildReferencePaymentBlock({
    mode: state.mode,
    gateway: state.gateway,
    merchantAccountId: state.merchantAccountId,
    billingEnabled: state.billingEnabled,
    charge,
  });
}

export function paymentRequiredForIntake() {
  const state = getPaymentAdapterState();
  if (isSandboxEnvironment() && !state.configured) return false;
  return state.configured;
}
