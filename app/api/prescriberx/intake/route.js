import { prisma } from "../../../../lib/prisma";
import {
  asId,
  asText,
  isSandboxIntake,
  jsonError,
  jsonOk,
  prescriberxJson,
  rateLimitRequest,
  rejectIfTooLarge,
  requireMemberSession,
  unwrapPrescriberxData,
} from "../../../../lib/prescriberxProxy";
import { evaluateShippingEligibility, normalizeState } from "../../../../lib/shippingEligibility";
import { evaluatePreclusions } from "../../../../lib/preclusions";
import {
  buildPrescribeRxPaymentBlock,
  captureExternalPayment,
  getPaymentAdapterState,
  paymentRequiredForIntake,
} from "../../../../lib/payments/adapter";
import { resolveExpectedAmountCents } from "../../../../lib/payments/preview";
import { publicStatusPayload } from "../../../../lib/prescriberxStatus";
import { getPaymentGatewayName } from "../../../../lib/prescriberxConfig";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;

function sanitizeAnswers(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^[a-zA-Z0-9_.-]{1,80}$/.test(key)) continue;
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      out[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      out[key] = value.slice(0, 40);
      continue;
    }
    if (value && typeof value === "object") {
      const feet = Number(value.feet);
      const inches = Number(value.inches);
      if (Number.isFinite(feet) && Number.isFinite(inches)) {
        out[key] = { feet, inches };
        continue;
      }
      const systolic = Number(value.systolic);
      const diastolic = Number(value.diastolic);
      if (Number.isFinite(systolic) && Number.isFinite(diastolic)) {
        out[key] = { systolic, diastolic };
      }
    }
  }
  return out;
}

function vitalsFromBody(body, answers) {
  const src = body?.vitals && typeof body.vitals === "object" ? body.vitals : {};
  const vitals = {};
  const heightInches = Number(src.height_inches);
  const weightLbs = Number(src.weight_lbs);
  if (Number.isFinite(heightInches)) vitals.height_inches = heightInches;
  if (Number.isFinite(weightLbs)) vitals.weight_lbs = weightLbs;

  for (const value of Object.values(answers)) {
    if (value && typeof value === "object" && "feet" in value && "inches" in value) {
      const total = Number(value.feet) * 12 + Number(value.inches);
      if (Number.isFinite(total) && vitals.height_inches == null) {
        vitals.height_inches = total;
      }
    }
  }
  const weightAnswer = answers.current_weight_lbs ?? answers.weight_lbs ?? answers.vital_weight;
  if (vitals.weight_lbs == null && Number.isFinite(Number(weightAnswer))) {
    vitals.weight_lbs = Number(weightAnswer);
  }
  if (answers.vital_height && typeof answers.vital_height === "object") {
    const total = Number(answers.vital_height.feet) * 12 + Number(answers.vital_height.inches);
    if (Number.isFinite(total) && vitals.height_inches == null) vitals.height_inches = total;
  }

  return Object.keys(vitals).length ? vitals : undefined;
}

function medicalHistoryFromAnswers(answers) {
  const history = {};
  const allergies = answers.allergies;
  const medications = answers.current_medications;
  const conditions = answers.medical_conditions;
  if (typeof allergies === "string" && allergies.trim()) history.allergies = [allergies.trim()];
  if (Array.isArray(allergies)) history.allergies = allergies.slice(0, 40);
  if (typeof medications === "string" && medications.trim()) history.medications = [medications.trim()];
  if (Array.isArray(medications)) history.medications = medications.slice(0, 40);
  if (typeof conditions === "string" && conditions.trim()) history.conditions = [conditions.trim()];
  if (Array.isArray(conditions)) history.conditions = conditions.slice(0, 40);
  return Object.keys(history).length ? history : undefined;
}

function publicReference(data) {
  const n = asText(data?.encounter_number) || asText(data?.data?.encounter_number);
  if (n && /^[A-Z]{2,8}-?\d{2,12}$/i.test(n) && n.length <= 24) return n;
  return null;
}

function encounterIdOf(data) {
  return asId(data?.encounter_id) || asId(data?.id) || asId(data?.encounter?.id);
}

export async function POST(request) {
  const { session, response: authError } = await requireMemberSession();
  if (authError) return authError;
  const userId = session.user?.id;
  if (!userId) return jsonError("unauthorized", 401);

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 60 * 1000,
    max: 8,
    name: "intake",
  });
  if (limited) return limited;
  const tooLarge = rejectIfTooLarge(request);
  if (tooLarge) return tooLarge;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("invalid", 400);

  const requestId = asText(body.request_id);
  if (!requestId) {
    return jsonError("invalid", 400, "Missing evaluation session.");
  }

  const evaluation = await prisma.evaluationRequest.findFirst({
    where: { publicRef: requestId, userId },
  });
  if (!evaluation) return jsonError("not_found", 404);

  if (evaluation.encounterNumber || evaluation.encounterId) {
    return jsonOk({
      success: true,
      ...publicStatusPayload(evaluation),
    });
  }

  const encounterTypeId = asId(body.encounter_type_id) || asId(evaluation.encounterTypeId);
  const productId = asId(body.product_id) || asId(evaluation.productId);
  const packageId = asId(body.package_id) || asId(evaluation.packageId);
  const patient = body.patient && typeof body.patient === "object" ? body.patient : {};
  const shipping =
    (patient.shipping_address && typeof patient.shipping_address === "object"
      ? patient.shipping_address
      : null) ||
    (patient.address && typeof patient.address === "object" ? patient.address : {});

  const firstName = asText(patient.first_name);
  const lastName = asText(patient.last_name);
  const email =
    asText(patient.email)?.toLowerCase() || asText(session.user?.email)?.toLowerCase();
  const dob = asText(patient.date_of_birth);
  const phone = asText(patient.phone);
  const street = asText(shipping.street);
  const city = asText(shipping.city);
  const state = normalizeState(shipping.state) || normalizeState(evaluation.shippingState);
  const zip = asText(shipping.zip);

  if (!encounterTypeId) {
    return jsonError("invalid", 400, "Please choose an evaluation type.");
  }
  if (!productId && !packageId) {
    return jsonError("invalid", 400, "Please choose a product.");
  }
  if (!firstName || !lastName || !email || !EMAIL_RE.test(email) || !dob || !phone) {
    return jsonError("invalid", 400, "Please complete your contact details.");
  }
  if (!street || !city || !state || !zip || !ZIP_RE.test(zip)) {
    return jsonError("invalid", 400, "Please complete a valid shipping address.");
  }

  const shipIds = productId ? [productId] : [];
  if (shipIds.length) {
    const shippingResult = await evaluateShippingEligibility(state, shipIds);
    if (!shippingResult.ok) return shippingResult.response;
    if (!shippingResult.eligible) {
      return jsonError(
        "invalid",
        400,
        shippingResult.message || "This item is not available to ship to that state."
      );
    }
  }

  const answers = sanitizeAnswers(body.answers);
  const preclusionResult = await evaluatePreclusions(encounterTypeId, answers);
  if (!preclusionResult.ok) return preclusionResult.response;
  if (preclusionResult.hardStop) {
    return jsonError(
      "invalid",
      400,
      "This evaluation cannot continue based on the information provided."
    );
  }

  await prisma.evaluationRequest.update({
    where: { id: evaluation.id },
    data: {
      productId,
      packageId,
      encounterTypeId,
      shippingState: state,
    },
  });

  const adapter = getPaymentAdapterState();
  if (!isSandboxIntake() && getPaymentGatewayName() && !adapter.configured) {
    return jsonError("not_configured", 503);
  }

  let charge = null;
  if (evaluation.gatewayTransactionId) {
    charge = {
      transactionId: evaluation.gatewayTransactionId,
      amount: (evaluation.amountCents || 0) / 100,
      capturedAt: new Date().toISOString(),
    };
  } else if (paymentRequiredForIntake()) {
    const preview = await resolveExpectedAmountCents({
      productId,
      packageId,
      state,
      zip,
    });
    const amountCents = preview.amountCents;
    if (amountCents == null) {
      if (adapter.configured && !isSandboxIntake()) {
        return jsonError("unavailable", 503, "Pricing is unavailable. Payment was not taken.");
      }
    } else {
      try {
        charge = await captureExternalPayment({
          amountCents,
          currency: preview.currency,
          paymentMethodId: asText(body.payment_method_id),
          idempotencyKey: `${evaluation.idempotencyKey}:pay`,
        });
        await prisma.evaluationRequest.update({
          where: { id: evaluation.id },
          data: {
            gatewayTransactionId: charge.transactionId,
            amountCents,
            currency: preview.currency || "usd",
            paymentState: "captured",
          },
        });
      } catch (err) {
        const code = err && err.code;
        if (code === "not_configured") {
          if (isSandboxIntake()) charge = null;
          else return jsonError("not_configured", 503);
        } else if (code === "payment_method_required") {
          return jsonError("invalid", 400, "Please complete payment to continue.");
        } else {
          return jsonError("payment_failed", 402);
        }
      }
    }
  }

  const paymentBlock = charge
    ? buildPrescribeRxPaymentBlock({
        charge,
        amountCents: evaluation.amountCents,
      })
    : undefined;
  if (paymentBlock?.mode === "authorize") {
    return jsonError("unavailable", 503);
  }

  const payload = {
    encounter_type_id: encounterTypeId,
    is_sandbox: isSandboxIntake(),
    external_reference: evaluation.publicRef,
    patient: {
      first_name: firstName,
      last_name: lastName,
      email,
      date_of_birth: dob,
      phone,
      shipping_address: {
        street,
        street2: asText(shipping.street2) || undefined,
        city,
        state,
        zip,
        country: "US",
      },
      billing_same_as_shipping: true,
    },
    answers,
    vitals: vitalsFromBody(body, answers),
    medical_history: medicalHistoryFromAnswers(answers),
    products: productId ? [{ product_id: productId, quantity: 1 }] : undefined,
    packages: packageId ? [{ package_id: packageId }] : undefined,
    payment: paymentBlock,
  };

  const result = await prescriberxJson("/telehealth/intake/unified", {
    method: "POST",
    json: payload,
    headers: { "Idempotency-Key": evaluation.idempotencyKey },
  });

  if (!result.ok) {
    if (charge) {
      return jsonError(
        "unavailable",
        502,
        "Payment was received. Your evaluation could not be finished automatically. Contact us with your confirmation and we will complete it — you will not be charged again."
      );
    }
    return result.response;
  }

  const data = unwrapPrescriberxData(result.payload);
  const reference = publicReference(data);
  const encounterId = encounterIdOf(data);
  const updated = await prisma.evaluationRequest.update({
    where: { id: evaluation.id },
    data: {
      encounterNumber: reference,
      encounterId,
      customerStatus: "under_review",
      isSandbox: isSandboxIntake(),
    },
  });

  return jsonOk({
    success: true,
    ...publicStatusPayload(updated),
    reference: reference || updated.publicRef,
  });
}
