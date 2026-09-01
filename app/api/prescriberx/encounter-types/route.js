import {
  asId,
  asText,
  jsonOk,
  prescriberxJson,
  rateLimitRequest,
  requireMemberSession,
  unwrapPrescriberxData,
} from "../../../../lib/prescriberxProxy";

export const dynamic = "force-dynamic";

function publicEncounterType(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = asId(raw.id);
  const name = asText(raw.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    description: asText(raw.description),
    category: asText(raw.product_class),
    type: asText(raw.product_type),
    requires_labs: Boolean(raw.requires_labs),
    visit_mode: asText(raw.interaction_type_label),
    is_quick_consult: Boolean(raw.is_quick_consult),
  };
}

export async function GET(request) {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "encounter-types",
  });
  if (limited) return limited;

  const result = await prescriberxJson("/telehealth/encounter-types", {
    method: "GET",
  });
  if (!result.ok) return result.response;

  const data = unwrapPrescriberxData(result.payload);
  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.encounter_types)
      ? data.encounter_types
      : [];

  return jsonOk({
    encounter_types: list.map(publicEncounterType).filter(Boolean),
  });
}
