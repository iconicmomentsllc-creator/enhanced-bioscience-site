"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "../../../../components/BrandLogo";
import { SignOutButton } from "../../../../components/SignOutButton";
import { GOLD_ACCENT, GOLD_GRADIENT_TEXT, GOLD_HEADING } from "../../../../lib/goldTheme";
import { ebCard, ebPageMain } from "../../../../lib/ebFormStyles";

export default function EvaluationRequestsPage() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/prescriberx/requests", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.message || "Could not load requests.");
      else setRows(data.requests || []);
    })();
  }, []);

  return (
    <main style={ebPageMain}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={ebCard}>
          <BrandLogo style={{ marginBottom: "20px" }} />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              textAlign: "center",
              margin: "0 0 24px",
              background: GOLD_GRADIENT_TEXT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your requests
          </h1>
          {error ? <p style={{ color: "#f0a0a0" }}>{error}</p> : null}
          {rows.length === 0 && !error ? (
            <p style={{ color: "#a8a8a8", textAlign: "center" }}>No evaluation requests yet.</p>
          ) : null}
          {rows.map((row) => (
            <Link
              key={row.request_id}
              href={`/catalog/private/requests/${row.request_id}`}
              style={{
                display: "block",
                marginBottom: "12px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid rgba(201,162,39,0.24)",
                color: "#f5f5f5",
                textDecoration: "none",
              }}
            >
              <strong style={{ color: GOLD_HEADING }}>{row.label}</strong>
              <div style={{ fontSize: "13px", color: "#9a9a9a", marginTop: "6px" }}>
                {row.reference || row.request_id}
              </div>
            </Link>
          ))}
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            <Link href="/catalog/private" style={{ color: GOLD_ACCENT, fontWeight: 600, textDecoration: "none" }}>
              ← Back to catalog
            </Link>
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
