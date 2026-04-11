import { NextResponse } from "next/server";
import {
  isSmtpConfigured,
  sendAccessRequestEmail,
} from "../../../lib/accessRequestEmail";
import {
  clientIpFromRequest,
  rateLimitOrThrow,
} from "../../../lib/accessRequestRateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(body) {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request." };
  }
  if (body.website || body.url) {
    return { honeypot: true };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (name.length < 2 || name.length > 120) {
    return { error: "Please enter your name (2–120 characters)." };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length > 2000) {
    return { error: "Message is too long." };
  }

  return { name, email, message: message || undefined };
}

export async function POST(request) {
  try {
    rateLimitOrThrow(clientIpFromRequest(request));
  } catch (e) {
    if (e.status === 429) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Try again later." },
        { status: 429 }
      );
    }
    throw e;
  }

  const body = await request.json().catch(() => null);
  const parsed = validatePayload(body);

  if (parsed.honeypot) {
    return NextResponse.json({ success: true }, { status: 200 });
  }
  if (parsed.error) {
    return NextResponse.json(
      { success: false, message: parsed.error },
      { status: 400 }
    );
  }

  if (!isSmtpConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          "This form is not fully set up yet. Please email enhancedbioscience@gmail.com directly.",
        code: "EMAIL_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  try {
    await sendAccessRequestEmail(parsed);
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Could not send your request. Please try again or email us directly.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
