import "server-only";
import { prisma } from "../prisma";
import { asId, asText } from "../prescriberxProxy";
import { mapWebhookEventToStatus } from "../prescriberxStatus";

const HANDLED = new Set([
  "encounter.created",
  "encounter.status_changed",
  "encounter.prescribed",
  "encounter.completed",
  "encounter.cancelled",
  "order.placed",
  "order.paid",
  "order.cancelled",
  "order.status_changed",
  "fulfillment.shipped",
  "fulfillment.delivered",
  "fulfillment.cancelled",
  "prescription.written",
  "subscription.created",
  "subscription.renewed",
  "subscription.cancelled",
  "subscription.payment_failed",
  "subscription.paused",
  "subscription.resumed",
  "subscription.refill_requested",
  "subscription.reassessment_due",
  "webhook.test",
]);

function identifiers(data) {
  if (!data || typeof data !== "object") return {};
  return {
    encounterId: asId(data.encounter_id),
    encounterNumber: asText(data.encounter_number),
    orderId: asId(data.order_id),
    orderNumber: asText(data.order_number),
    trackingNumber: asText(data.tracking_number),
  };
}

async function findEvaluation(ids) {
  if (ids.encounterId) {
    const byEncounter = await prisma.evaluationRequest.findFirst({
      where: { encounterId: ids.encounterId },
    });
    if (byEncounter) return byEncounter;
  }
  if (ids.encounterNumber) {
    const byNumber = await prisma.evaluationRequest.findFirst({
      where: { encounterNumber: ids.encounterNumber },
    });
    if (byNumber) return byNumber;
  }
  if (ids.orderId) {
    return prisma.evaluationRequest.findFirst({
      where: { orderId: ids.orderId },
    });
  }
  return null;
}

export async function applyWebhookEvent(envelope) {
  const event = asText(envelope?.event);
  if (!event || !HANDLED.has(event)) {
    return { ignored: true };
  }
  if (event === "webhook.test") {
    return { ignored: false, test: true };
  }

  const data = envelope.data && typeof envelope.data === "object" ? envelope.data : {};
  const ids = identifiers(data);
  const row = await findEvaluation(ids);
  if (!row) {
    return { ignored: true };
  }

  const nextStatus = mapWebhookEventToStatus(event, data);
  const patch = {};
  if (nextStatus) patch.customerStatus = nextStatus;
  if (ids.orderId) patch.orderId = ids.orderId;
  if (ids.orderNumber) patch.orderNumber = ids.orderNumber;
  if (ids.encounterId) patch.encounterId = ids.encounterId;
  if (ids.encounterNumber) patch.encounterNumber = ids.encounterNumber;
  if (ids.trackingNumber) patch.trackingNumber = ids.trackingNumber;
  if (event === "subscription.payment_failed") patch.paymentState = "failed";

  if (Object.keys(patch).length) {
    await prisma.evaluationRequest.update({
      where: { id: row.id },
      data: patch,
    });
  }
  return { ignored: false };
}
