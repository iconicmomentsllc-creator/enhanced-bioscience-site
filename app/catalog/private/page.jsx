"use client";

import { BrandLogo } from "../../../components/BrandLogo";
import { CATALOG_SECTIONS } from "../../../lib/catalogSections";
import {
  GOLD_ACCENT,
  GOLD_GRADIENT_TEXT,
  GOLD_HEADING,
  GOLD_MUTED,
  goldRgba,
} from "../../../lib/goldTheme";

export default function PrivateCatalogPage() {
  return (
    <main
      style={{
        background: "#000000",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif",
        padding: "40px 20px 64px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <BrandLogo />

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              marginBottom: "12px",
              fontWeight: 700,
              letterSpacing: "1px",
              background: GOLD_GRADIENT_TEXT,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Product Catalog
          </h1>

          <p
            style={{
              fontSize: "17px",
              color: GOLD_MUTED,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            Private Research Membership
          </p>
          <p style={{ fontSize: "15px", color: "#9a9a9a", maxWidth: "640px", margin: "0 auto", lineHeight: 1.6 }}>
            Full reference list of materials. Research use only; availability by private inquiry.
          </p>
        </div>

        {CATALOG_SECTIONS.map((section, sIdx) => (
          <section
            key={section.title}
            id={`section-${sIdx}`}
            style={{
              marginBottom: sIdx < CATALOG_SECTIONS.length - 1 ? "48px" : 0,
              paddingBottom: sIdx < CATALOG_SECTIONS.length - 1 ? "40px" : 0,
              borderBottom:
                sIdx < CATALOG_SECTIONS.length - 1 ? `1px solid ${goldRgba(0.16)}` : "none",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 20px",
                color: GOLD_HEADING,
                letterSpacing: "0.02em",
              }}
            >
              {section.title}
            </h2>
            <ul className="catalog-columns">
              {section.items.map((item, iIdx) => (
                <li
                  key={`${sIdx}-${iIdx}-${item}`}
                  style={{
                    breakInside: "avoid",
                    marginBottom: "6px",
                    paddingLeft: "1em",
                    textIndent: "-0.65em",
                  }}
                >
                  <span style={{ color: GOLD_ACCENT, marginRight: "6px" }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <style jsx>{`
          .catalog-columns {
            list-style: none;
            margin: 0;
            padding: 0;
            column-count: 3;
            column-gap: 28px;
            font-size: 15px;
            line-height: 1.65;
            color: #e4e4e4;
          }
          @media (max-width: 900px) {
            .catalog-columns {
              column-count: 2;
            }
          }
          @media (max-width: 560px) {
            .catalog-columns {
              column-count: 1;
            }
          }
        `}</style>

        <div
          style={{
            marginTop: "64px",
            textAlign: "center",
            paddingTop: "40px",
            borderTop: `1px solid ${goldRgba(0.2)}`,
          }}
        >
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "17px",
              maxWidth: "720px",
              margin: "0 auto 24px",
              lineHeight: 1.8,
            }}
          >
            All compounds are for research purposes only.
            <br />
            Pricing and availability are handled through private inquiry only.
          </p>

          <p
            style={{
              color: GOLD_ACCENT,
              fontSize: "16px",
              margin: "0 auto 24px",
            }}
          >
            Membership Required • $10/month • Credits apply toward research inquiries
          </p>

          <p style={{ fontSize: "24px", marginBottom: "10px" }}>832-883-1720</p>
          <p style={{ fontSize: "18px", color: GOLD_ACCENT }}>enhancedbioscience@gmail.com</p>
        </div>
      </div>
    </main>
  );
}
