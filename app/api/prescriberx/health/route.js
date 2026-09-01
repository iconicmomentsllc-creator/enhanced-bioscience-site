import { jsonError, jsonOk } from "../../../../lib/prescriberxProxy";
import {
  isPrescriberxConfigured,
  productionConfigError,
} from "../../../../lib/prescriberxConfig";

export const dynamic = "force-dynamic";

export async function GET() {
  if (productionConfigError() || !isPrescriberxConfigured()) {
    return jsonError("not_configured", 503);
  }
  return jsonOk({ ok: true });
}
