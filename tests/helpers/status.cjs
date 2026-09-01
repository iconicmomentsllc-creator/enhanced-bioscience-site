const CUSTOMER_STATUS = {
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
  "encounter.prescribed": "prescribed",
  "encounter.completed": "prescribed",
  "encounter.cancelled": "cancelled",
  "order.placed": "fulfillment_processing",
  "fulfillment.shipped": "shipped",
  "fulfillment.delivered": "delivered",
  "subscription.payment_failed": "payment_required",
};

function mapEncounterStatus(raw) {
  if (!raw || typeof raw !== "string") return null;
  return ENCOUNTER_STATUS[raw.trim().toLowerCase()] || null;
}

function mapWebhookEventToStatus(event, data) {
  if (event === "encounter.status_changed") {
    return mapEncounterStatus(data?.new_status) || "under_review";
  }
  if (Object.prototype.hasOwnProperty.call(EVENT_STATUS, event)) {
    return EVENT_STATUS[event];
  }
  return null;
}

function isHardStopNotice(raw) {
  if (!raw || typeof raw !== "object") return false;
  const severity = String(raw.severity || "").toLowerCase();
  const mode = String(raw.mode || "").toLowerCase();
  if (mode === "auto_hard_stop") return true;
  if (severity === "absolute" || severity === "hardstop" || severity === "severe") {
    return true;
  }
  return false;
}

module.exports = {
  CUSTOMER_STATUS,
  mapEncounterStatus,
  mapWebhookEventToStatus,
  isHardStopNotice,
};
