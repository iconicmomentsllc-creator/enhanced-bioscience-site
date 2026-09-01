import "server-only";
import {
  asId,
  asText,
  prescriberxJson,
  publicMessage,
  unwrapPrescriberxData,
} from "./prescriberxProxy";

function publicItems(data) {
  const rows =
    (Array.isArray(data?.products) && data.products) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.results) && data.results) ||
    [];

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const product_id = asId(row.product_id || row.id);
      if (!product_id) return null;
      return {
        product_id,
        eligible: Boolean(
          row.eligible ??
            row.is_eligible ??
            row.can_ship ??
            row.allowed ??
            row.ships
        ),
        message: publicMessage(row.message || row.reason || row.detail),
      };
    })
    .filter(Boolean);
}

export async function evaluateShippingEligibility(state, productIds) {
  const result = await prescriberxJson("/telehealth/shipping-eligibility", {
    method: "POST",
    json: { state, product_ids: productIds },
  });
  if (!result.ok) return result;

  const data = unwrapPrescriberxData(result.payload);
  const items = publicItems(data);
  const eligible =
    typeof data?.eligible === "boolean"
      ? data.eligible
      : typeof data?.all_eligible === "boolean"
        ? data.all_eligible
        : items.length > 0
          ? items.every((item) => item.eligible)
          : false;

  return {
    ok: true,
    eligible,
    message: eligible
      ? null
      : publicMessage(data?.message) ||
        "This item is not available to ship to that state.",
    items,
  };
}

export { publicItems };
export const STATE_RE = /^[A-Za-z]{2}$/;

export function normalizeState(value) {
  const state = asText(value)?.toUpperCase();
  return state && STATE_RE.test(state) ? state : null;
}
