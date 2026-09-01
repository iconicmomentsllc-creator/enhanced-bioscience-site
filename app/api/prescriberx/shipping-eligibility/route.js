import {
  asId,
  jsonError,
  jsonOk,
  rateLimitRequest,
  rejectIfTooLarge,
  requireMemberSession,
} from "../../../../lib/prescriberxProxy";
import {
  evaluateShippingEligibility,
  normalizeState,
} from "../../../../lib/shippingEligibility";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 30,
    name: "shipping",
  });
  if (limited) return limited;
  const tooLarge = rejectIfTooLarge(request);
  if (tooLarge) return tooLarge;

  const body = await request.json().catch(() => null);
  const state = normalizeState(body?.state);
  const productIds = Array.isArray(body?.product_ids)
    ? body.product_ids.map(asId).filter(Boolean)
    : asId(body?.product_id)
      ? [asId(body.product_id)]
      : [];

  if (!state || productIds.length === 0) {
    return jsonError("invalid", 400, "Please choose a product and a shipping state.");
  }

  const result = await evaluateShippingEligibility(state, productIds);
  if (!result.ok) return result.response;

  return jsonOk({
    eligible: result.eligible,
    message: result.eligible ? null : result.message,
    items: result.items,
  });
}
