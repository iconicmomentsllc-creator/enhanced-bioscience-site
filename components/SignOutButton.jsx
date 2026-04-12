"use client";

import { signOut } from "next-auth/react";
import { GOLD_ACCENT, goldRgba } from "../lib/goldTheme";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/catalog" })}
      style={{
        marginTop: "28px",
        padding: "12px 28px",
        borderRadius: "12px",
        border: `1px solid ${goldRgba(0.35)}`,
        background: "transparent",
        color: GOLD_ACCENT,
        fontWeight: 600,
        fontSize: "15px",
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );
}
