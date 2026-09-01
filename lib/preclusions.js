import "server-only";
import {
  prescriberxJson,
  publicMessage,
  unwrapPrescriberxData,
} from "./prescriberxProxy";
import { isHardStopNotice } from "./prescriberxStatus";

export async function evaluatePreclusions(encounterTypeId, answers) {
  const result = await prescriberxJson("/telehealth/preclusions/evaluate", {
    method: "POST",
    json: {
      encounter_type_id: encounterTypeId,
      answers,
    },
  });
  if (!result.ok) return result;

  const data = unwrapPrescriberxData(result.payload);
  const summaryHardStop = Boolean(data?.summary?.has_hard_stop);
  const notices = Array.isArray(data?.triggered_preclusions)
    ? data.triggered_preclusions
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const message = publicMessage(raw.message) || publicMessage(raw.reason);
          if (!message) return null;
          return {
            field: typeof raw.field_slug === "string" ? raw.field_slug : null,
            severity: isHardStopNotice(raw) ? "block" : "warn",
            message,
          };
        })
        .filter(Boolean)
    : [];
  const hardStop = summaryHardStop || notices.some((n) => n.severity === "block");
  return {
    ok: true,
    hardStop,
    canProceed: !hardStop,
    notices,
  };
}
