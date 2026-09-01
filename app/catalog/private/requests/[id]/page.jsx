"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandLogo } from "../../../../../components/BrandLogo";
import { SignOutButton } from "../../../../../components/SignOutButton";
import { GOLD_ACCENT, GOLD_GRADIENT_TEXT, GOLD_HEADING } from "../../../../../lib/goldTheme";
import { ebCard, ebPageMain } from "../../../../../lib/ebFormStyles";

export default function EvaluationRequestDetailPage() {
  const params = useParams();
  const [row, setRow] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params?.id;
    if (!id) return undefined;
    (async () => {
      const res = await fetch(`/api/prescriberx/requests/${id}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.message || "Could not load this request.");
      else setRow(data);
    })();
  }, [params?.id]);

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
              margin: "0 0 16px",
              background: GOLD_GRADIENT_TEXT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Request status
          </h1>
          {error ? <p style={{ color: "#f0a0a0" }}>{error}</p> : null}
          {row ? (
            <>
              <p style={{ color: GOLD_HEADING, fontWeight: 700, textAlign: "center" }}>{row.label}</p>
              {row.reference ? (
                <p style={{ color: GOLD_ACCENT, textAlign: "center" }}>Confirmation {row.reference}</p>
              ) : null}
              {row.tracking_number ? (
                <p style={{ color: "#a8a8a8", textAlign: "center" }}>Tracking {row.tracking_number}</p>
              ) : null}
            </>
          ) : null}
          <p style={{ textAlign: "center", marginTop: "24px" }}>
            <Link
              href="/catalog/private/requests"
              style={{ color: GOLD_ACCENT, fontWeight: 600, textDecoration: "none" }}
            >
              ← All requests
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
