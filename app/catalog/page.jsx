"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "../../components/BrandLogo";
import {
  GOLD_ACCENT,
  GOLD_GRADIENT_BUTTON,
  GOLD_GRADIENT_TEXT,
  GOLD_LABEL,
  GOLD_MUTED,
  goldRgba,
} from "../../lib/goldTheme";

export default function CatalogAccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAccess = async () => {
    if (!code.trim()) {
      setError("Please enter your access code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
        cache: "no-store",
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError("Unable to reach the server. If you are viewing a static export, run the app with `npm run dev` or `npm start`.");
        return;
      }

      if (data.success) {
        window.location.href = "/catalog/private";
        return;
      }

      setError(data.message || "Invalid access code.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        background: "#000000",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "40px 36px 36px",
          borderRadius: "20px",
          background: "linear-gradient(145deg, rgba(26, 22, 14, 0.95), rgba(12, 12, 12, 0.98))",
          border: `1px solid ${goldRgba(0.24)}`,
          boxShadow:
            "0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
          textAlign: "center",
        }}
      >
        <BrandLogo style={{ marginBottom: "28px" }} />

        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: GOLD_LABEL,
            margin: "0 0 8px",
            fontWeight: 600,
          }}
        >
          Member portal
        </p>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            margin: "0 0 8px",
            background: GOLD_GRADIENT_TEXT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Secure access
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#a8a8a8",
            lineHeight: 1.55,
            margin: "0 0 28px",
          }}
        >
          Enter the access code provided with your membership to view the research catalog.
        </p>

        <label
          htmlFor="access-code"
          style={{
            display: "block",
            textAlign: "left",
            fontSize: "13px",
            color: GOLD_MUTED,
            marginBottom: "8px",
            fontWeight: 600,
          }}
        >
          Access code
        </label>
        <input
          id="access-code"
          type="password"
          name="access-code"
          autoComplete="off"
          placeholder="Enter code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && handleAccess()}
          disabled={loading}
          style={{
            boxSizing: "border-box",
            padding: "14px 16px",
            width: "100%",
            marginBottom: "20px",
            borderRadius: "12px",
            border: `1px solid ${goldRgba(0.38)}`,
            background: "rgba(0, 0, 0, 0.35)",
            color: "#f5f5f5",
            fontSize: "16px",
            outline: "none",
          }}
        />

        <button
          type="button"
          onClick={handleAccess}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px 24px",
            background: loading ? "#555" : GOLD_GRADIENT_BUTTON,
            color: "#000000",
            border: "none",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.85 : 1,
            boxShadow: loading ? "none" : `0 0 22px ${goldRgba(0.35)}`,
          }}
        >
          {loading ? "Verifying…" : "Continue"}
        </button>

        {error ? (
          <p
            role="alert"
            style={{
              color: "#f0a0a0",
              marginTop: "18px",
              fontSize: "14px",
              lineHeight: 1.45,
            }}
          >
            {error}
          </p>
        ) : null}

        <p style={{ marginTop: "22px", marginBottom: "8px", fontSize: "14px", color: GOLD_MUTED }}>
          Don&apos;t have a code?{" "}
          <Link
            href="/request-access"
            style={{
              color: GOLD_ACCENT,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Request access
          </Link>
        </p>

        <p style={{ marginTop: "12px", marginBottom: 0 }}>
          <Link
            href="/"
            style={{
              fontSize: "14px",
              color: GOLD_ACCENT,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
