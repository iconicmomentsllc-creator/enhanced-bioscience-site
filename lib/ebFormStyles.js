import { GOLD_MUTED, goldRgba } from "./goldTheme";

export const ebPageMain = {
  background: "#000000",
  color: "#ffffff",
  minHeight: "100vh",
  fontFamily: "system-ui, -apple-system, Segoe UI, Arial, sans-serif",
  padding: "40px 20px 64px",
};

export const ebCard = {
  width: "100%",
  maxWidth: "720px",
  margin: "0 auto",
  padding: "40px 36px 36px",
  borderRadius: "20px",
  background: "linear-gradient(145deg, rgba(26, 22, 14, 0.95), rgba(12, 12, 12, 0.98))",
  border: `1px solid ${goldRgba(0.24)}`,
  boxShadow:
    "0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
};

export const ebLabel = {
  display: "block",
  textAlign: "left",
  fontSize: "13px",
  color: GOLD_MUTED,
  marginBottom: "8px",
  fontWeight: 600,
};

export const ebInput = {
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
};

export const ebHelp = {
  fontSize: "13px",
  color: "#9a9a9a",
  lineHeight: 1.5,
  margin: "-8px 0 16px",
};
