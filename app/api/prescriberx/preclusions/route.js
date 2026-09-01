import {
  asId,
  jsonError,
  jsonOk,
  rateLimitRequest,
  rejectIfTooLarge,
  requireMemberSession,
} from "../../../../lib/prescriberxProxy";
import { evaluatePreclusions } from "../../../../lib/preclusions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { response: authError } = await requireMemberSession();
  if (authError) return authError;

  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "preclusions",
  });
  if (limited) return limited;
  const tooLarge = rejectIfTooLarge(request);
  if (tooLarge) return tooLarge;

  const body = await request.json().catch(() => null);
  const encounterTypeId = asId(body?.encounter_type_id);
  const answers =
    body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? body.answers
      : null;

  if (!encounterTypeId || !answers) {
    return jsonError("invalid", 400, "Missing evaluation details.");
  }

  const result = await evaluatePreclusions(encounterTypeId, answers);
  if (!result.ok) return result.response;

  return jsonOk({
    can_proceed: result.canProceed,
    hard_stop: result.hardStop,
    notices: result.notices,
  });
}
