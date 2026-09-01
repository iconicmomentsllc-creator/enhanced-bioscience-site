import { NextResponse } from "next/server";
import {
  isPrescriberxConfigured,
  prescriberxFetch,
} from "../../../../lib/prescriberx";

/**
 * Temporary sandbox probe. PrescribeRx OpenAPI: GET /catalog
 * (getCatalog — products + packages, product:read, Client token). Read-only.
 */
const PRESCRIBERX_CATALOG_PATH = "/catalog";

function failure(error, status = 502, extra = {}) {
  return NextResponse.json({ connected: false, error, ...extra }, { status });
}

export async function GET() {
  if (!isPrescriberxConfigured()) {
    return failure("not_configured", 503);
  }

  let response;
  try {
    response = await prescriberxFetch(PRESCRIBERX_CATALOG_PATH, {
      method: "GET",
      cache: "no-store",
    });
  } catch {
    return failure("unavailable");
  }

  await response.arrayBuffer().catch(() => undefined);

  if (!response.ok) {
    const status = response.status;
    const error =
      status === 401 || status === 403 ? "unauthorized" : "request_failed";
    return failure(error, 502, { status });
  }

  return NextResponse.json({ connected: true });
}
