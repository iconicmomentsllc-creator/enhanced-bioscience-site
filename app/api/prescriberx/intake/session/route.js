import { randomUUID } from "crypto";
import { prisma } from "../../../../../lib/prisma";
import {
  asId,
  jsonError,
  jsonOk,
  rateLimitRequest,
  rejectIfTooLarge,
  requireMemberSession,
} from "../../../../../lib/prescriberxProxy";
import { isSandboxIntake } from "../../../../../lib/prescriberxConfig";
import { normalizeState } from "../../../../../lib/shippingEligibility";
import { getPaymentAdapterState } from "../../../../../lib/payments/adapter";
import { resolveExpectedAmountCents } from "../../../../../lib/payments/preview";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { session, response: authError } = await requireMemberSession();
  if (authError) return authError;
  const userId = session.user?.id;
  if (!userId) return jsonError("unauthorized", 401);

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 20,
    name: "intake-session",
  });
  if (limited) return limited;
  const tooLarge = rejectIfTooLarge(request);
  if (tooLarge) return tooLarge;

  const body = await request.json().catch(() => null);
  const productId = asId(body?.product_id);
  const packageId = asId(body?.package_id);
  const encounterTypeId = asId(body?.encounter_type_id);
  const shippingState = normalizeState(body?.state);
  if (!productId && !packageId) {
    return jsonError("invalid", 400, "Please choose a product.");
  }

  const payment = getPaymentAdapterState();
  let amountCents = null;
  let currency = "usd";
  if (payment.configured) {
    const preview = await resolveExpectedAmountCents({
      productId,
      packageId,
      state: shippingState,
      zip: typeof body?.zip === "string" ? body.zip : undefined,
    });
    amountCents = preview.amountCents;
    currency = preview.currency || "usd";
  }

  const row = await prisma.evaluationRequest.create({
    data: {
      userId,
      idempotencyKey: randomUUID(),
      publicRef: randomUUID(),
      productId,
      packageId,
      encounterTypeId,
      shippingState,
      customerStatus: "received",
      paymentState: payment.configured ? "pending" : "not_required",
      amountCents,
      currency,
      billingEnabled: payment.billingEnabled,
      isSandbox: isSandboxIntake(),
    },
  });

  return jsonOk({
    request_id: row.publicRef,
    payment: {
      configured: payment.configured,
      required: payment.configured && amountCents != null,
      billing_enabled: payment.billingEnabled,
      gateway: payment.configured ? payment.gateway : null,
      publishable_key: payment.configured ? payment.publishableKey : null,
      amount_cents: amountCents,
      currency,
    },
  });
}
