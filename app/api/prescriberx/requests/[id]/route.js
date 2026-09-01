import { prisma } from "../../../../../lib/prisma";
import {
  jsonError,
  jsonOk,
  prescriberxJson,
  rateLimitRequest,
  requireMemberSession,
  unwrapPrescriberxData,
} from "../../../../../lib/prescriberxProxy";
import { mapEncounterStatus, publicStatusPayload } from "../../../../../lib/prescriberxStatus";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { session, response: authError } = await requireMemberSession();
  if (authError) return authError;
  const limited = rateLimitRequest(request, {
    windowMs: 60 * 1000,
    max: 40,
    name: "request-detail",
  });
  if (limited) return limited;

  const publicRef = params?.id;
  if (!publicRef || publicRef.length > 80) {
    return jsonError("invalid", 400);
  }

  let row = await prisma.evaluationRequest.findFirst({
    where: { publicRef, userId: session.user.id },
  });
  if (!row) return jsonError("not_found", 404);

  if (row.encounterId) {
    const result = await prescriberxJson(
      `/telehealth/encounters/${row.encounterId}/status`,
      { method: "GET" }
    );
    if (result.ok) {
      const data = unwrapPrescriberxData(result.payload);
      const mapped = mapEncounterStatus(data?.status);
      const order = data?.order && typeof data.order === "object" ? data.order : {};
      const patch = {};
      if (mapped) patch.customerStatus = mapped;
      if (order.id) patch.orderId = String(order.id);
      if (order.order_number) patch.orderNumber = String(order.order_number);
      const tracking =
        order.tracking_number ||
        order.fulfillment?.tracking_number ||
        data?.order?.shipping?.tracking_number;
      if (typeof tracking === "string") patch.trackingNumber = tracking.slice(0, 80);
      if (Object.keys(patch).length) {
        row = await prisma.evaluationRequest.update({
          where: { id: row.id },
          data: patch,
        });
      }
    }
  }

  return jsonOk(publicStatusPayload(row));
}
