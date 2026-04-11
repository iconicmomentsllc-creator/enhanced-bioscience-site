/**
 * Metallic gold palette — deeper amber/bronze, less lemon-yellow.
 */
export const GOLD_GRADIENT_TEXT =
  "linear-gradient(155deg, #d8b85a 0%, #a67c00 42%, #4a2f06 100%)";

export const GOLD_GRADIENT_BUTTON =
  "linear-gradient(155deg, #dfc066 0%, #9a7200 45%, #3d2604 100%)";

/** Links, emphasis, bullets */
export const GOLD_ACCENT = "#b8941f";

/** Subtitles, supporting text */
export const GOLD_MUTED = "#9e8348";

/** Section titles on dark background */
export const GOLD_HEADING = "#c9a84a";

/** Small caps / labels */
export const GOLD_LABEL = "#8f7638";

/** For box-shadow and border rgba() — dark goldenrod base */
export const GOLD_RGB = "154, 114, 14";

export const goldRgba = (alpha) => `rgba(${GOLD_RGB}, ${alpha})`;
