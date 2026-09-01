import {
  UUID_RE,
  asText,
  jsonError,
  jsonOk,
  prescriberxJson,
  rateLimitRequest,
  requireMemberSession,
  unwrapPrescriberxData,
} from "../../../../../../lib/prescriberxProxy";

export const dynamic = "force-dynamic";

function publicOption(raw) {
  if (!raw || typeof raw !== "object") return null;
  const value = asText(raw.value) ?? (raw.value == null ? null : String(raw.value));
  const label = asText(raw.label) || value;
  if (value == null || !label) return null;
  return { value, label };
}

function publicValidation(raw) {
  if (!raw || typeof raw !== "object") return null;
  const out = {};
  if (typeof raw.min === "number") out.min = raw.min;
  if (typeof raw.max === "number") out.max = raw.max;
  if (typeof raw.minLength === "number") out.minLength = raw.minLength;
  if (typeof raw.maxLength === "number") out.maxLength = raw.maxLength;
  if (typeof raw.pattern === "string") out.pattern = raw.pattern.slice(0, 200);
  return Object.keys(out).length ? out : null;
}

function publicField(raw) {
  if (!raw || typeof raw !== "object") return null;
  const slug = asText(raw.slug);
  const label = asText(raw.label) || slug;
  if (!slug || !label) return null;
  return {
    slug,
    label,
    field_type: asText(raw.field_type_label) || asText(raw.field_type) || "text",
    required: Boolean(raw.is_required),
    help_text: asText(raw.help_text),
    placeholder: asText(raw.placeholder),
    min: raw.min ?? null,
    max: raw.max ?? null,
    depends_on: asText(raw.depends_on),
    has_preclusions: Boolean(raw.has_preclusions),
    validation: publicValidation(raw.validation),
    options: Array.isArray(raw.options)
      ? raw.options.map(publicOption).filter(Boolean)
      : [],
  };
}

function publicStep(raw) {
  if (!raw || typeof raw !== "object") return null;
  const title = asText(raw.step_name) || "Questions";
  const fields = Array.isArray(raw.fields)
    ? raw.fields.map(publicField).filter(Boolean)
    : [];
  return {
    title,
    description: asText(raw.step_description),
    required: Boolean(raw.is_required),
    fields,
  };
}

export async function GET(request, { params }) {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "schema",
  });
  if (limited) return limited;

  const encounterTypeId = asText(params?.encounterTypeId);
  if (!encounterTypeId || !UUID_RE.test(encounterTypeId)) {
    return jsonError("invalid", 400, "Invalid evaluation type.");
  }

  const result = await prescriberxJson(
    `/telehealth/encounter-types/${encounterTypeId}/schema`,
    { method: "GET" }
  );
  if (!result.ok) return result.response;

  const data = unwrapPrescriberxData(result.payload);
  const encounterType = data?.encounter_type || {};

  return jsonOk({
    encounter_type: {
      id: encounterTypeId,
      name: asText(encounterType.name),
      description: asText(encounterType.description),
    },
    steps: Array.isArray(data?.steps)
      ? data.steps.map(publicStep).filter(Boolean)
      : [],
  });
}
