import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isValidMemberAccessCode } from "../../../lib/accessCode";
import { prisma } from "../../../lib/prisma";
import {
  clientIpFromRequest,
  rateLimitOrThrow,
} from "../../../lib/accessRequestRateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { success: false, message: "Invalid request." },
      { status: 400 }
    );
  }

  if (body.website || body.url) {
    return NextResponse.json({ success: true }, { status: 201 });
  }

  const accessCode =
    typeof body.accessCode === "string" ? body.accessCode : "";
  if (!isValidMemberAccessCode(accessCode)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Invalid access code. Request membership first and use the code we send you.",
      },
      { status: 401 }
    );
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (password.length < 8 || password.length > 128) {
    return NextResponse.json(
      {
        success: false,
        message: "Password must be between 8 and 128 characters.",
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: { email, passwordHash },
    });
  } catch (e) {
    if (e.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }
    throw e;
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
