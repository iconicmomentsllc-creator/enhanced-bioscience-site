import { NextResponse } from "next/server";
import { isValidMemberAccessCode } from "../../../lib/accessCode";
import {
  MEMBER_SESSION_COOKIE,
  createMemberSessionValue,
  memberSessionCookieOptions,
} from "../../../lib/memberSession";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 }
      );
    }

    const { code } = body;
    if (isValidMemberAccessCode(code)) {
      const res = NextResponse.json({ success: true }, { status: 200 });
      const opts = memberSessionCookieOptions();
      res.cookies.set(
        MEMBER_SESSION_COOKIE,
        createMemberSessionValue(),
        opts
      );
      return res;
    }

    return NextResponse.json(
      { success: false, message: "Invalid access code." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong." },
      { status: 400 }
    );
  }
}
