import "server-only";
import { asId, prescriberxJson, unwrapPrescriberxData } from "../prescriberxProxy";

function moneyToCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * Server-side expected amount. Never trust a browser-supplied price.
 * Uses PrescribeRx POST /pricing/preview; falls back to catalog retail if needed.
 */
export async function resolveExpectedAmountCents({ productId, packageId, state, zip }) {
  const lines = [];
  if (productId) lines.push({ product_id: productId, quantity: 1 });
  if (!lines.length && !packageId) return { amountCents: null, currency: "usd" };

  const json = {
    lines: lines.length ? lines : [{ product_id: productId, quantity: 1 }],
    shipping_address: state ? { state, zip: zip || undefined } : undefined,
  };

  const result = await prescriberxJson("/pricing/preview", { method: "POST", json });
  if (result.ok) {
    const data = unwrapPrescriberxData(result.payload);
    const total =
      data?.total ??
      data?.total_amount ??
      data?.grand_total ??
      data?.amount ??
      data?.patient_total ??
      data?.retail_total;
    const cents = moneyToCents(total);
    if (cents != null && cents > 0) {
      return { amountCents: cents, currency: String(data?.currency || "usd").toLowerCase() };
    }
  }

  if (productId) {
    const catalog = await prescriberxJson("/catalog", { method: "GET" });
    if (catalog.ok) {
      const data = unwrapPrescriberxData(catalog.payload);
      const product = (data?.products || []).find((p) => asId(p.id) === productId);
      const retail =
        product?.pricing?.retail_price ??
        product?.retail_price ??
        product?.price;
      const cents = moneyToCents(retail);
      if (cents != null && cents > 0) {
        return { amountCents: cents, currency: "usd" };
      }
    }
  }

  return { amountCents: null, currency: "usd" };
}
