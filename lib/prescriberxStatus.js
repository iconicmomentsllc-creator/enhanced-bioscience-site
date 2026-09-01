/**
 * Map PrescribeRx encounter/order/fulfillment values to Enhanced Bioscience
 * customer-facing statuses. Internal workflow strings never go to the browser.
 */

export const CUSTOMER_STATUS = {
  received: "Request received",
  under_review: "Under medical review",
  prescribed: "Approved",
  fulfillment_processing: "Preparing shipment",
  shipped: "Shipped",
  delivered: "Delivered",
  ineligible: "Unable to proceed",
  payment_required: "Action needed",
  cancelled: "Cancelled",
};

const ENCOUNTER_STATUS = {
  pending_intake: "received",
  unassigned: "under_review",
  pending_provider_review: "under_review",
  provider_in_progress: "under_review",
  scheduled: "under_review",
  prescribed: "prescribed",
  completed: "prescribed",
  cancelled: "cancelled",
  rejected: "ineligible",
  no_show: "cancelled",
};

const EVENT_STATUS = {
  "encounter.created": "received",
  "encounter.status_changed": null,
  "encounter.prescribed": "prescribed",
  "encounter.completed": "prescribed",
  "encounter.cancelled": "cancelled",
  "order.placed": "fulfillment_processing",
  "order.paid": "fulfillment_processing",
  "order.cancelled": "cancelled",
  "order.status_changed": "fulfillment_processing",
  "fulfillment.shipped": "shipped",
  "fulfillment.delivered": "delivered",
  "fulfillment.cancelled": "cancelled",
  "prescription.written": "prescribed",
  "subscription.created": "fulfillment_processing",
  "subscription.renewed": "fulfillment_processing",
  "subscription.cancelled": "cancelled",
  "subscription.payment_failed": "payment_required",
  "subscription.paused": "under_review",
  "subscription.resumed": "fulfillment_processing",
  "subscription.refill_requested": "fulfillment_processing",
  "subscription.reassessment_due": "under_review",
};

export function mapEncounterStatus(raw) {
  if (!raw || typeof raw !== "string") return null;
  return ENCOUNTER_STATUS[raw.trim().toLowerCase()] || null;
}

export function mapWebhookEventToStatus(event, data) {
  if (event === "encounter.status_changed") {
    return mapEncounterStatus(data?.new_status) || "under_review";
  }
  if (Object.prototype.hasOwnProperty.call(EVENT_STATUS, event)) {
    return EVENT_STATUS[event];
  }
  return null;
}

export function publicStatusPayload(row) {
  const key = row?.customerStatus && CUSTOMER_STATUS[row.customerStatus]
    ? row.customerStatus
    : "received";
  const out = {
    request_id: row.publicRef,
    status: key,
    label: CUSTOMER_STATUS[key],
    reference: row.encounterNumber || null,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
    payment: row.paymentState === "not_required" ? null : { state: row.paymentState },
  };
  if (key === "shipped" || key === "delivered") {
    out.tracking_number = row.trackingNumber || null;
  }
  return out;
}

export function isHardStopNotice(raw) {
  if (!raw || typeof raw !== "object") return false;
  const severity = String(raw.severity || "").toLowerCase();
  const mode = String(raw.mode || "").toLowerCase();
  if (mode === "auto_hard_stop") return true;
  if (severity === "absolute" || severity === "hardstop" || severity === "severe") {
    return true;
  }
  return false;
}

export function publicPreclusionSeverity(raw, summaryHardStop) {
  if (isHardStopNotice(raw)) return "block";
  if (summaryHardStop && raw?.can_override === false && isHardStopNotice(raw)) {
    return "block";
  }
  return "warn";
}
