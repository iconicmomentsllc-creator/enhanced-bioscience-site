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

export default function RegisterPage() {
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessCode: accessCode.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          website,
        }),
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setDone(true);
        return;
      }

      setError(data.message || "Could not create account. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
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
            background:
              "linear-gradient(145deg, rgba(26, 22, 14, 0.95), rgba(12, 12, 12, 0.98))",
            border: `1px solid ${goldRgba(0.24)}`,
            boxShadow:
              "0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
            textAlign: "center",
          }}
        >
          <BrandLogo style={{ marginBottom: "28px" }} />
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              margin: "0 0 12px",
              background: GOLD_GRADIENT_TEXT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Account created
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#a8a8a8",
              lineHeight: 1.55,
              margin: "0 0 28px",
            }}
          >
            You can sign in now to open the research catalog.
          </p>
          <Link
            href="/catalog"
            style={{
              fontSize: "15px",
              color: GOLD_ACCENT,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Go to sign in →
          </Link>
          <p style={{ marginTop: "24px", marginBottom: 0 }}>
            <Link
              href="/"
              style={{
                fontSize: "14px",
                color: GOLD_MUTED,
                textDecoration: "none",
              }}
            >
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    );
  }

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
          background:
            "linear-gradient(145deg, rgba(26, 22, 14, 0.95), rgba(12, 12, 12, 0.98))",
          border: `1px solid ${goldRgba(0.24)}`,
          boxShadow:
            "0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
        }}
      >
        <BrandLogo style={{ marginBottom: "28px", display: "block", textAlign: "center" }} />

        <p
          style={{
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: GOLD_LABEL,
            margin: "0 0 8px",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Membership
        </p>

        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            margin: "0 0 8px",
            textAlign: "center",
            background: GOLD_GRADIENT_TEXT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Create your login
        </h1>

        <p
          style={{
            fontSize: "15px",
            color: "#a8a8a8",
            lineHeight: 1.55,
            margin: "0 0 28px",
            textAlign: "center",
          }}
        >
          Request access first. After you are approved, use the <strong style={{ color: "#d4d4d4" }}>access code</strong> we send you together with your email and password to set up your account.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="reg-access-code"
            style={{
              display: "block",
              fontSize: "13px",
              color: GOLD_MUTED,
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Access code
          </label>
          <input
            id="reg-access-code"
            name="accessCode"
            type="password"
            autoComplete="off"
            required
            placeholder="Code from your approval email"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={loading}
            style={{
              boxSizing: "border-box",
              padding: "14px 16px",
              width: "100%",
              marginBottom: "16px",
              borderRadius: "12px",
              border: `1px solid ${goldRgba(0.38)}`,
              background: "rgba(0, 0, 0, 0.35)",
              color: "#f5f5f5",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <label
            htmlFor="reg-email"
            style={{
              display: "block",
              fontSize: "13px",
              color: GOLD_MUTED,
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={{
              boxSizing: "border-box",
              padding: "14px 16px",
              width: "100%",
              marginBottom: "16px",
              borderRadius: "12px",
              border: `1px solid ${goldRgba(0.38)}`,
              background: "rgba(0, 0, 0, 0.35)",
              color: "#f5f5f5",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <label
            htmlFor="reg-password"
            style={{
              display: "block",
              fontSize: "13px",
              color: GOLD_MUTED,
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={{
              boxSizing: "border-box",
              padding: "14px 16px",
              width: "100%",
              marginBottom: "16px",
              borderRadius: "12px",
              border: `1px solid ${goldRgba(0.38)}`,
              background: "rgba(0, 0, 0, 0.35)",
              color: "#f5f5f5",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <label
            htmlFor="reg-confirm"
            style={{
              display: "block",
              fontSize: "13px",
              color: GOLD_MUTED,
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Confirm password
          </label>
          <input
            id="reg-confirm"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            style={{
              boxSizing: "border-box",
              padding: "14px 16px",
              width: "100%",
              marginBottom: "16px",
              borderRadius: "12px",
              border: `1px solid ${goldRgba(0.38)}`,
              background: "rgba(0, 0, 0, 0.35)",
              color: "#f5f5f5",
              fontSize: "16px",
              outline: "none",
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              top: "-9999px",
              height: 0,
              overflow: "hidden",
            }}
          >
            <label htmlFor="reg-website">Website</label>
            <input
              id="reg-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <button
            type="submit"
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

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

        <p style={{ marginTop: "24px", marginBottom: "8px", textAlign: "center" }}>
          <Link
            href="/request-access"
            style={{
              fontSize: "14px",
              color: GOLD_ACCENT,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Need an access code? Request access
          </Link>
        </p>
        <p style={{ marginTop: "8px", marginBottom: 0, textAlign: "center" }}>
          <Link
            href="/catalog"
            style={{
              fontSize: "14px",
              color: GOLD_MUTED,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Already have an account? Sign in
          </Link>
        </p>
        <p style={{ marginTop: "12px", marginBottom: 0, textAlign: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: "14px",
              color: GOLD_MUTED,
              textDecoration: "none",
            }}
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
