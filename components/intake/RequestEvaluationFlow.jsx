"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { BrandLogo } from "../BrandLogo";
import { SignOutButton } from "../SignOutButton";
import {
  GOLD_ACCENT,
  GOLD_GRADIENT_BUTTON,
  GOLD_GRADIENT_TEXT,
  GOLD_HEADING,
  GOLD_LABEL,
  GOLD_MUTED,
  goldRgba,
} from "../../lib/goldTheme";
import { ebCard, ebHelp, ebInput, ebLabel, ebPageMain } from "../../lib/ebFormStyles";
import { US_STATES } from "../../lib/usStates";

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function fieldKind(field) {
  return String(field.field_type || "text").toLowerCase().replace(/\s+/g, "_");
}

function visibleFields(fields, answers) {
  return (fields || []).filter((field) => {
    const kind = String(field.field_type || "").toLowerCase();
    if (/^provider_/.test(field.slug || "")) return false;
    if (kind.includes("file") || kind.includes("upload")) return false;
    if (!field.depends_on) return true;
    const parent = answers[field.depends_on];
    if (parent == null || parent === "" || parent === false) return false;
    if (typeof parent === "string" && parent.toLowerCase() === "no") return false;
    return true;
  });
}

function GoldButton({ children, disabled, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "15px 24px",
        background: disabled ? "#555" : GOLD_GRADIENT_BUTTON,
        color: "#000000",
        border: "none",
        borderRadius: "12px",
        fontWeight: 700,
        fontSize: "16px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.85 : 1,
        boxShadow: disabled ? "none" : `0 0 22px ${goldRgba(0.35)}`,
      }}
    >
      {children}
    </button>
  );
}

function SchemaField({ field, value, onChange, disabled }) {
  const kind = fieldKind(field);
  const id = `field-${field.slug}`;

  if (kind.includes("yes_no") || kind === "yes/no") {
    return (
      <div>
        <span style={ebLabel}>{field.label}{field.required ? " *" : ""}</span>
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt)}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${value === opt ? GOLD_ACCENT : goldRgba(0.38)}`,
                background: value === opt ? goldRgba(0.18) : "rgba(0,0,0,0.35)",
                color: "#f5f5f5",
                fontWeight: 600,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (kind.includes("select") && !kind.includes("multi") && field.options?.length) {
    return (
      <>
        <label htmlFor={id} style={ebLabel}>
          {field.label}{field.required ? " *" : ""}
        </label>
        <select
          id={id}
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...ebInput, appearance: "none" }}
        >
          <option value="">Select…</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </>
    );
  }

  if (kind.includes("multi") && field.options?.length) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div style={{ marginBottom: "16px" }}>
        <span style={ebLabel}>{field.label}{field.required ? " *" : ""}</span>
        {field.options.map((opt) => (
          <label
            key={opt.value}
            style={{ display: "flex", gap: "10px", marginBottom: "8px", color: "#e4e4e4", fontSize: "15px" }}
          >
            <input
              type="checkbox"
              disabled={disabled}
              checked={selected.includes(opt.value)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt.value]);
                else onChange(selected.filter((v) => v !== opt.value));
              }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (kind.includes("toggle") || kind.includes("boolean")) {
    return (
      <label style={{ display: "flex", gap: "10px", marginBottom: "16px", color: "#e4e4e4" }}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (kind.includes("height")) {
    const current = value && typeof value === "object" ? value : { feet: "", inches: "" };
    return (
      <div>
        <span style={ebLabel}>{field.label}{field.required ? " *" : ""}</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input
            type="number"
            placeholder="Feet"
            disabled={disabled}
            value={current.feet}
            onChange={(e) => onChange({ ...current, feet: e.target.value })}
            style={ebInput}
          />
          <input
            type="number"
            placeholder="Inches"
            disabled={disabled}
            value={current.inches}
            onChange={(e) => onChange({ ...current, inches: e.target.value })}
            style={ebInput}
          />
        </div>
      </div>
    );
  }

  if (kind.includes("blood") || kind.includes("pressure")) {
    const current = value && typeof value === "object" ? value : { systolic: "", diastolic: "" };
    return (
      <div>
        <span style={ebLabel}>{field.label}{field.required ? " *" : ""}</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <input
            type="number"
            placeholder="Systolic"
            disabled={disabled}
            value={current.systolic}
            onChange={(e) => onChange({ ...current, systolic: e.target.value })}
            style={ebInput}
          />
          <input
            type="number"
            placeholder="Diastolic"
            disabled={disabled}
            value={current.diastolic}
            onChange={(e) => onChange({ ...current, diastolic: e.target.value })}
            style={ebInput}
          />
        </div>
      </div>
    );
  }

  const isArea = kind.includes("textarea") || kind.includes("long");
  const InputTag = isArea ? "textarea" : "input";
  return (
    <>
      <label htmlFor={id} style={ebLabel}>
        {field.label}{field.required ? " *" : ""}
      </label>
      <InputTag
        id={id}
        type={kind.includes("number") ? "number" : kind.includes("date") ? "date" : "text"}
        disabled={disabled}
        placeholder={field.placeholder || ""}
        value={value ?? ""}
        onChange={(e) =>
          onChange(kind.includes("number") ? e.target.value : e.target.value)
        }
        style={{ ...ebInput, minHeight: isArea ? "96px" : undefined }}
      />
      {field.help_text ? <p style={ebHelp}>{field.help_text}</p> : null}
    </>
  );
}

export function RequestEvaluationFlow() {
  const { data: session } = useSession();
  const [step, setStep] = useState("product");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [stateCode, setStateCode] = useState("TX");
  const [encounterTypes, setEncounterTypes] = useState([]);
  const [encounterType, setEncounterType] = useState(null);
  const [schema, setSchema] = useState(null);
  const [answers, setAnswers] = useState({});
  const [notices, setNotices] = useState([]);
  const [hardStop, setHardStop] = useState(false);
  const [reference, setReference] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [statusLabel, setStatusLabel] = useState("");
  const [submitFailed, setSubmitFailed] = useState(false);
  const [patient, setPatient] = useState({
    first_name: "",
    last_name: "",
    email: "",
    date_of_birth: "",
    phone: "",
    street: "",
    street2: "",
    city: "",
    zip: "",
  });

  useEffect(() => {
    if (session?.user?.email && !patient.email) {
      setPatient((p) => ({ ...p, email: session.user.email }));
    }
  }, [session?.user?.email, patient.email]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/prescriberx/catalog", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!cancelled) {
        if (!res.ok) setError(data.message || "Catalog is unavailable.");
        else {
          setProducts(data.products || []);
          setPackages(data.packages || []);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.category, p.type, p.short_description]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [products, query]);

  const rankedTypes = useMemo(() => {
    const cat = (selectedProduct?.category || "").toLowerCase();
    const typ = (selectedProduct?.type || "").toLowerCase();
    return [...encounterTypes].sort((a, b) => {
      const score = (t) => {
        let s = 0;
        if (typ && t.type && t.type.toLowerCase() === typ) s += 3;
        if (cat && t.category && t.category.toLowerCase() === cat) s += 2;
        return s;
      };
      return score(b) - score(a);
    });
  }, [encounterTypes, selectedProduct]);

  useEffect(() => {
    if (step !== "form" || !encounterType?.id) return undefined;
    const handle = setTimeout(async () => {
      const res = await fetch("/api/prescriberx/preclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounter_type_id: encounterType.id,
          answers,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotices(data.notices || []);
        setHardStop(Boolean(data.hard_stop));
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [answers, encounterType, step]);

  async function checkShipping() {
    if (!selectedProduct?.id) {
      setError("Please select a product.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/prescriberx/shipping-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: stateCode,
        product_id: selectedProduct.id,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message || "Could not check shipping availability.");
      return;
    }
    if (!data.eligible) {
      setError(data.message || "This item is not available to ship to that state.");
      return;
    }
    setLoading(true);
    const typesRes = await fetch("/api/prescriberx/encounter-types", {
      cache: "no-store",
    });
    const typesData = await typesRes.json().catch(() => ({}));
    setLoading(false);
    if (!typesRes.ok) {
      setError(typesData.message || "Could not load evaluation types.");
      return;
    }
    setEncounterTypes(typesData.encounter_types || []);
    setStep("type");
  }

  async function loadSchema(type) {
    setEncounterType(type);
    setLoading(true);
    setError("");
    const res = await fetch(
      `/api/prescriberx/encounter-types/${type.id}/schema`,
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message || "Could not load this evaluation.");
      return;
    }
    setSchema(data);
    setAnswers({});
    setNotices([]);
    setHardStop(false);
    setStep("form");
    const sessionRes = await fetch("/api/prescriberx/intake/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: selectedProduct?.id,
        package_id: selectedPackage?.id,
        encounter_type_id: type.id,
        state: stateCode,
        zip: patient.zip,
      }),
    });
    const sessionData = await sessionRes.json().catch(() => ({}));
    if (sessionRes.ok && sessionData.request_id) {
      setRequestId(sessionData.request_id);
    }
  }

  async function submitIntake(e) {
    e.preventDefault();
    if (hardStop) return;
    if (!requestId) {
      setError("Please wait a moment and try again.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/prescriberx/intake", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request_id: requestId,
        encounter_type_id: encounterType.id,
        product_id: selectedPackage ? undefined : selectedProduct?.id,
        package_id: selectedPackage?.id,
        answers,
        patient: {
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
          date_of_birth: patient.date_of_birth,
          phone: patient.phone,
          shipping_address: {
            street: patient.street,
            street2: patient.street2,
            city: patient.city,
            state: stateCode,
            zip: patient.zip,
          },
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setSubmitFailed(true);
      setError(data.message || "We could not submit your request.");
      setStep("done");
      return;
    }
    setReference(data.reference || data.request_id || null);
    setStatusLabel(data.label || "");
    setSubmitFailed(false);
    setStep("done");
  }

  const relatedPackages = packages.filter(
    (pkg) => pkg.product_name && selectedProduct?.name === pkg.product_name
  );

  return (
    <main style={ebPageMain}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ ...ebCard, maxWidth: "720px" }}>
          <BrandLogo style={{ marginBottom: "20px" }} />
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
            Member services
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
            Request an evaluation
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
            Choose a product, confirm we can ship to your state, then complete the
            screening questions for that evaluation.
          </p>

          {error && step !== "done" ? (
            <p role="alert" style={{ color: "#f0a0a0", marginBottom: "18px", fontSize: "14px" }}>
              {error}
            </p>
          ) : null}

          {step === "product" ? (
            <>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                style={ebInput}
              />
              <div style={{ maxHeight: "420px", overflowY: "auto", marginBottom: "16px" }}>
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedPackage(null);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      marginBottom: "10px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: `1px solid ${
                        selectedProduct?.id === product.id ? GOLD_ACCENT : goldRgba(0.24)
                      }`,
                      background:
                        selectedProduct?.id === product.id
                          ? goldRgba(0.16)
                          : "rgba(0,0,0,0.28)",
                      color: "#f5f5f5",
                      cursor: "pointer",
                    }}
                  >
                    <strong style={{ color: GOLD_HEADING }}>{product.name}</strong>
                    {product.category ? (
                      <div style={{ fontSize: "13px", color: GOLD_MUTED, marginTop: "4px" }}>
                        {product.category}
                        {product.type ? ` · ${product.type}` : ""}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>
              {relatedPackages.length > 0 ? (
                <div style={{ marginBottom: "16px" }}>
                  <p style={ebLabel}>Optional package</p>
                  {relatedPackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg)}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        marginBottom: "8px",
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: `1px solid ${
                          selectedPackage?.id === pkg.id ? GOLD_ACCENT : goldRgba(0.24)
                        }`,
                        background: "rgba(0,0,0,0.28)",
                        color: "#e4e4e4",
                        cursor: "pointer",
                      }}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              ) : null}
              <GoldButton
                disabled={loading || !selectedProduct}
                onClick={() => setStep("shipping")}
              >
                Continue
              </GoldButton>
            </>
          ) : null}

          {step === "shipping" ? (
            <>
              <p style={{ color: GOLD_MUTED, marginBottom: "16px" }}>
                Selected: {selectedProduct?.name}
                {selectedPackage ? ` · ${selectedPackage.name}` : ""}
              </p>
              <label htmlFor="ship-state" style={ebLabel}>
                Shipping state
              </label>
              <select
                id="ship-state"
                value={stateCode}
                onChange={(e) => {
                  setStateCode(e.target.value);
                }}
                style={{ ...ebInput, appearance: "none" }}
              >
                {US_STATES.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name}
                  </option>
                ))}
              </select>
              <GoldButton disabled={loading} onClick={checkShipping}>
                {loading ? "Checking…" : "Check availability"}
              </GoldButton>
              <button
                type="button"
                onClick={() => setStep("product")}
                style={{
                  marginTop: "14px",
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: GOLD_ACCENT,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Change product
              </button>
            </>
          ) : null}

          {step === "type" ? (
            <>
              <p style={{ color: GOLD_MUTED, marginBottom: "16px" }}>
                Shipping to {stateCode} is available. Choose an evaluation type.
              </p>
              {rankedTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  disabled={loading}
                  onClick={() => loadSchema(type)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    marginBottom: "10px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${goldRgba(0.24)}`,
                    background: "rgba(0,0,0,0.28)",
                    color: "#f5f5f5",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ color: GOLD_HEADING }}>{type.name}</strong>
                  {type.description ? (
                    <div style={{ fontSize: "13px", color: "#9a9a9a", marginTop: "6px" }}>
                      {stripHtml(type.description)}
                    </div>
                  ) : null}
                </button>
              ))}
              {rankedTypes.length === 0 && !loading ? (
                <p style={{ color: "#f0a0a0" }}>No evaluation types are available right now.</p>
              ) : null}
            </>
          ) : null}

          {step === "form" && schema ? (
            <form onSubmit={submitIntake}>
              <p style={{ color: GOLD_MUTED, marginBottom: "20px" }}>
                {schema.encounter_type?.name || "Evaluation"}
              </p>
              <label style={ebLabel}>First name</label>
              <input
                required
                value={patient.first_name}
                onChange={(e) => setPatient({ ...patient, first_name: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>Last name</label>
              <input
                required
                value={patient.last_name}
                onChange={(e) => setPatient({ ...patient, last_name: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>Email</label>
              <input
                required
                type="email"
                value={patient.email}
                onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>Phone</label>
              <input
                required
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>Date of birth</label>
              <input
                required
                type="date"
                value={patient.date_of_birth}
                onChange={(e) => setPatient({ ...patient, date_of_birth: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>Street</label>
              <input
                required
                value={patient.street}
                onChange={(e) => setPatient({ ...patient, street: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>City</label>
              <input
                required
                value={patient.city}
                onChange={(e) => setPatient({ ...patient, city: e.target.value })}
                style={ebInput}
              />
              <label style={ebLabel}>ZIP</label>
              <input
                required
                value={patient.zip}
                onChange={(e) => setPatient({ ...patient, zip: e.target.value })}
                style={ebInput}
              />

              {(schema.steps || []).map((schemaStep) => (
                <section key={schemaStep.title} style={{ marginTop: "8px" }}>
                  <h2
                    style={{
                      fontSize: "18px",
                      color: GOLD_HEADING,
                      margin: "12px 0 16px",
                    }}
                  >
                    {schemaStep.title}
                  </h2>
                  {visibleFields(schemaStep.fields, answers).map((field) => (
                    <SchemaField
                      key={field.slug}
                      field={field}
                      value={answers[field.slug]}
                      disabled={loading}
                      onChange={(next) =>
                        setAnswers((prev) => ({ ...prev, [field.slug]: next }))
                      }
                    />
                  ))}
                </section>
              ))}

              {notices.map((notice, idx) => (
                <p
                  key={`${notice.field}-${idx}`}
                  role="alert"
                  style={{
                    color: notice.severity === "block" ? "#f0a0a0" : GOLD_MUTED,
                    fontSize: "14px",
                    lineHeight: 1.5,
                  }}
                >
                  {notice.message}
                </p>
              ))}

              <GoldButton type="submit" disabled={loading || hardStop}>
                {loading ? "Submitting…" : hardStop ? "Cannot continue" : "Submit request"}
              </GoldButton>
            </form>
          ) : null}

          {step === "done" ? (
            <div style={{ textAlign: "center" }}>
              <h2
                style={{
                  fontSize: "24px",
                  margin: "0 0 12px",
                  background: GOLD_GRADIENT_TEXT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {submitFailed ? "Request not submitted" : "Request received"}
              </h2>
              <p style={{ color: "#a8a8a8", lineHeight: 1.6, marginBottom: "20px" }}>
                {submitFailed
                  ? error || "Please try again or contact us."
                  : "Thank you. Our team will follow up. You can return to the catalog at any time."}
              </p>
              {reference && !submitFailed ? (
                <p style={{ color: GOLD_ACCENT, marginBottom: "12px" }}>
                  Confirmation {reference}
                </p>
              ) : null}
              {statusLabel && !submitFailed ? (
                <p style={{ color: "#a8a8a8", marginBottom: "20px" }}>{statusLabel}</p>
              ) : null}
              {requestId && !submitFailed ? (
                <p style={{ marginBottom: "20px" }}>
                  <Link
                    href={`/catalog/private/requests/${requestId}`}
                    style={{ color: GOLD_ACCENT, fontWeight: 600, textDecoration: "none" }}
                  >
                    View request status
                  </Link>
                </p>
              ) : null}
              <Link
                href="/catalog/private"
                style={{ color: GOLD_ACCENT, fontWeight: 600, textDecoration: "none" }}
              >
                ← Back to catalog
              </Link>
            </div>
          ) : null}

          {step !== "done" ? (
            <p style={{ marginTop: "22px", textAlign: "center" }}>
              <Link
                href="/catalog/private"
                style={{ color: GOLD_ACCENT, fontWeight: 600, textDecoration: "none" }}
              >
                ← Back to catalog
              </Link>
            </p>
          ) : null}
        </div>
        <div style={{ textAlign: "center" }}>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
