"use client";

import { BrandLogo } from "../components/BrandLogo";
import {
  GOLD_ACCENT,
  GOLD_GRADIENT_BUTTON,
  GOLD_GRADIENT_TEXT,
  GOLD_MUTED,
  goldRgba,
} from "../lib/goldTheme";

export default function HomePage() {
  return (
    <main
      style={{
        background: "#000000",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "800px" }}>
        <BrandLogo />

        {/* TITLE */}
        <h1
          style={{
            fontSize: "52px",
            marginBottom: "16px",
            background: GOLD_GRADIENT_TEXT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textShadow: `0 0 28px ${goldRgba(0.3)}`,
          }}
        >
          Enhanced Bioscience
        </h1>

        {/* SUBTITLE */}
        <p
          style={{
            fontSize: "20px",
            color: GOLD_MUTED,
            marginBottom: "20px",
            letterSpacing: "2px",
          }}
        >
          Private Research Membership Portal
        </p>

        {/* DESCRIPTION */}
        <p
          style={{
            fontSize: "16px",
            color: "#cfcfcf",
            lineHeight: "1.7",
            marginBottom: "20px",
          }}
        >
          Enhanced Bioscience gives members exclusive access to a broad range of
          high-purity research compounds — far beyond just peptides. Our private
          catalog includes advanced metabolic research materials, cognitive and
          longevity-focused compounds, cosmetic-grade actives, premium health
          supplements, natural extracts, parasite research agents, and many other
          specialty research chemicals.
        </p>
        <p
          style={{
            fontSize: "16px",
            color: "#cfcfcf",
            lineHeight: "1.7",
            marginBottom: "25px",
          }}
        >
          Members gain full visibility into everything we offer — strictly for
          educational and laboratory research purposes only.
        </p>

        {/* MEMBERSHIP */}
        <p
          style={{
            fontSize: "16px",
            color: GOLD_ACCENT,
            marginBottom: "35px",
          }}
        >
          Membership: $10/month — monthly payments can be applied toward future research access.
        </p>

        <a href="/catalog">
          <button
            type="button"
            style={{
              padding: "16px 40px",
              background: GOLD_GRADIENT_BUTTON,
              color: "#000000",
              fontWeight: "700",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              boxShadow: `0 0 22px ${goldRgba(0.4)}`,
            }}
          >
            View Research Catalog
          </button>
        </a>

        {/* CONTACT */}
        <div style={{ marginTop: "60px" }}>
          <h2
            style={{
              fontSize: "26px",
              marginBottom: "16px",
              color: GOLD_ACCENT,
            }}
          >
            Contact
          </h2>

          <p style={{ fontSize: "18px", marginBottom: "8px" }}>
            📞 832-883-1720
          </p>

          <p style={{ fontSize: "16px", color: GOLD_ACCENT }}>
            ✉️ enhancedbioscience@gmail.com
          </p>
        </div>

        {/* DISCLAIMER */}
        <p
          style={{
            marginTop: "40px",
            fontSize: "14px",
            color: "#9c9c9c",
          }}
        >
          All materials are for research purposes only. No public sales are conducted.
        </p>
      </div>
    </main>
  );
}

// deploy test
