import { prisma } from "../../../../lib/prisma";
import { jsonError, jsonOk } from "../../../../lib/prescriberxProxy";
import { getWebhookSecret } from "../../../../lib/prescriberxConfig";
import { verifyPrescriberxSignature } from "../../../../lib/webhooks/verify";
import { applyWebhookEvent } from "../../../../lib/webhooks/applyEvent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WEBHOOK_BYTES = 64 * 1024;

export async function POST(request) {
  const secret = getWebhookSecret();
  if (!secret) {
    return jsonError("not_configured", 503);
  }

  const length = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(length) && length > MAX_WEBHOOK_BYTES) {
    return jsonError("payload_too_large", 413);
  }

  const raw = await request.text();
  if (raw.length > MAX_WEBHOOK_BYTES) {
    return jsonError("payload_too_large", 413);
  }

  const signature =
    request.headers.get("x-prescriberx-signature") ||
    request.headers.get("X-PrescribeRx-Signature");
  if (!verifyPrescriberxSignature(raw, signature, secret)) {
    return jsonError("forbidden", 403);
  }

  let envelope;
  try {
    envelope = JSON.parse(raw);
  } catch {
    return jsonError("invalid", 400);
  }
  if (!envelope || typeof envelope !== "object") {
    return jsonError("invalid", 400);
  }

  const webhookId =
    request.headers.get("x-webhook-id") ||
    request.headers.get("X-Webhook-ID") ||
    (typeof envelope.webhook_id === "string" ? envelope.webhook_id : "");
  if (!webhookId || webhookId.length > 128) {
    return jsonError("invalid", 400);
  }

  const existing = await prisma.webhookDelivery.findUnique({
    where: { webhookId },
  });
  if (existing) {
    return jsonOk({ received: true, duplicate: true });
  }

  try {
    await applyWebhookEvent(envelope);
  } catch {
    return jsonError("unavailable", 502);
  }

  try {
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType:
          typeof envelope.event === "string" ? envelope.event.slice(0, 80) : "unknown",
      },
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      return jsonOk({ received: true, duplicate: true });
    }
    return jsonError("unavailable", 502);
  }

  return jsonOk({ received: true });
}
