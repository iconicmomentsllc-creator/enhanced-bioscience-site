"use client";

import logo from "../logo.JPG";
import { goldRgba } from "../lib/goldTheme";

export function BrandLogo({ style, ...props }) {
  return (
    <img
      src={logo.src}
      alt="Enhanced Bioscience Logo"
      {...props}
      style={{
        width: "160px",
        margin: "0 auto 30px",
        display: "block",
        filter: `drop-shadow(0 0 14px ${goldRgba(0.38)})`,
        borderRadius: "16px",
        ...style,
      }}
    />
  );
}
