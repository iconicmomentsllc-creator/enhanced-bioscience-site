import {
  asId,
  asText,
  jsonError,
  jsonOk,
  prescriberxJson,
  publicMessage,
  rateLimitRequest,
  requireMemberSession,
  unwrapPrescriberxData,
} from "../../../../lib/prescriberxProxy";

export const dynamic = "force-dynamic";

function nestedName(obj) {
  if (!obj || typeof obj !== "object") return null;
  return asText(obj.name);
}

function publicNestedPackage(raw) {
  if (!raw || typeof raw !== "object" || raw.is_active === false) return null;
  const id = asId(raw.id);
  const name = asText(raw.name);
  if (!id || !name) return null;
  return { id, name };
}

function publicProduct(raw) {
  if (!raw || typeof raw !== "object" || raw.is_active === false) return null;
  const id = asId(raw.id);
  const name = asText(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    short_description: asText(raw.short_description),
    description: asText(raw.description),
    image_url: asText(raw.image_url),
    rx_required: Boolean(raw.rx_required),
    category: nestedName(raw.product_class),
    type: nestedName(raw.product_type),
    packages: Array.isArray(raw.packages)
      ? raw.packages.map(publicNestedPackage).filter(Boolean)
      : [],
  };
}

function publicPackageItems(items, productsById) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const fromCatalog = item.product_id
        ? productsById.get(item.product_id)
        : null;
      const name = fromCatalog?.name || nestedName(item.product);
      if (!name) return null;
      const quantity =
        typeof item.quantity === "number" && Number.isFinite(item.quantity)
          ? item.quantity
          : null;
      return { name, quantity };
    })
    .filter(Boolean);
}

function publicPackage(raw, productsById) {
  if (!raw || typeof raw !== "object" || raw.is_active === false) return null;
  const id = asId(raw.id);
  const name = asText(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    description: publicMessage(raw.description) || asText(raw.description),
    product_name: nestedName(raw.product),
    items: publicPackageItems(raw.items, productsById),
  };
}

export async function GET(request) {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "catalog",
  });
  if (limited) return limited;

  const result = await prescriberxJson("/catalog", { method: "GET" });
  if (!result.ok) return result.response;

  const catalog = unwrapPrescriberxData(result.payload);
  if (!catalog || typeof catalog !== "object") {
    return jsonError("unavailable", 502);
  }

  const products = Array.isArray(catalog.products)
    ? catalog.products.map(publicProduct).filter(Boolean)
    : [];
  const productsById = new Map(products.map((p) => [p.id, p]));
  const packages = Array.isArray(catalog.packages)
    ? catalog.packages.map((pkg) => publicPackage(pkg, productsById)).filter(Boolean)
    : [];

  return jsonOk({ products, packages });
}
