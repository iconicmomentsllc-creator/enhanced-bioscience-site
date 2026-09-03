import "server-only";

/**
 * Server-only PrescribeRx configuration.
 * Request URLs always come from PRESCRIBERX_BASE_URL — never from a hardcoded host.
 * PRESCRIBERX_ENVIRONMENT=sandbox|production controls safeguards (is_sandbox, fail-closed).
 */

export function getPrescriberxEnvironment() {
  const raw = process.env.PRESCRIBERX_ENVIRONMENT?.trim().toLowerCase();
  if (raw === "production") return "production";
  if (raw === "sandbox") return "sandbox";
  return null;
}

export function isSandboxEnvironment() {
  return getPrescriberxEnvironment() === "sandbox";
}

export function isProductionEnvironment() {
  return getPrescriberxEnvironment() === "production";
}

export function getPrescriberxBaseUrl() {
  return process.env.PRESCRIBERX_BASE_URL?.trim().replace(/\/+$/, "") || "";
}

export function getPrescriberxToken() {
  return process.env.PRESCRIBERX_TOKEN?.trim() || "";
}

export function getPrescriberxEmail() {
  return process.env.PRESCRIBERX_EMAIL?.trim() || "";
}

export function getPrescriberxPassword() {
  return process.env.PRESCRIBERX_PASSWORD || "";
}

export function getPrescriberxDeviceName() {
  return process.env.PRESCRIBERX_DEVICE_NAME?.trim() || "";
}

export function hasLoginCredentials() {
  return Boolean(
    getPrescriberxEmail() && getPrescriberxPassword() && getPrescriberxDeviceName()
  );
}

export function hasPrescriberxAuth() {
  return hasLoginCredentials() || Boolean(getPrescriberxToken());
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Fail closed when environment and base URL contradict each other
 * (e.g. production mode pointed at a demo host). Does not choose the URL.
 */
export function environmentUrlMismatch() {
  const env = getPrescriberxEnvironment();
  const host = hostnameOf(getPrescriberxBaseUrl());
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

/**
 * Fail closed when production is pointed at Stripe test keys or the test gateway.
 * Only applies when a payment gateway is selected.
 */
export function sandboxCredentialsInProduction() {
  if (!isProductionEnvironment()) return null;
  const gateway = getPaymentGatewayName();
  if (!gateway) return null;
  if (gateway === "test") return "sandbox_payment_credentials";
  const secret = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
  if (gateway === "stripe") {
    if (!secret.startsWith("sk_live_")) return "sandbox_payment_credentials";
    if (publishable.startsWith("pk_test_")) return "sandbox_payment_credentials";
  }
  return null;
}

export function isPrescriberxConfigured() {
  return Boolean(
    getPrescriberxEnvironment() &&
      getPrescriberxBaseUrl() &&
      hasPrescriberxAuth() &&
      !environmentUrlMismatch() &&
      !sandboxCredentialsInProduction()
  );
}

export function productionConfigError() {
  if (!isProductionEnvironment()) return null;
  if (!getPrescriberxBaseUrl() || !hasPrescriberxAuth()) {
    return "not_configured";
  }
  if (environmentUrlMismatch()) return "not_configured";
  if (sandboxCredentialsInProduction()) return "not_configured";
  return null;
}

export function isSandboxIntake() {
  return isSandboxEnvironment();
}

export function getWebhookSecret() {
  return process.env.PRESCRIBERX_WEBHOOK_SECRET?.trim() || "";
}

export function getMerchantAccountId() {
  const id = process.env.PRESCRIBERX_MERCHANT_ACCOUNT_ID?.trim() || "";
  return /^[0-9a-f-]{36}$/i.test(id) ? id : "";
}

export function getPaymentGatewayName() {
  return (process.env.PRESCRIBERX_PAYMENT_GATEWAY || "").trim().toLowerCase();
}

export function getPaymentMode() {
  const mode = (process.env.PRESCRIBERX_PAYMENT_MODE || "reference_captured")
    .trim()
    .toLowerCase();
  if (mode === "reference_preauth") return "reference_preauth";
  return "reference_captured";
}
