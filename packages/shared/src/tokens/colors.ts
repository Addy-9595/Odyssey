/**
 * Color tokens — the single source for every color in the app. Light mode only
 * (userInterfaceStyle is "light"); no dark mode / theme switching.
 *
 * Base UI is neutral gray. The accent is reserved for primary actions and
 * active/selected states ONLY — never sprinkled around.
 */

// Neutral gray ramp (0 = white -> 900 = near-black).
export const gray = {
  0: "#ffffff",
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
} as const;

// The one confident accent (indigo), with interaction + subtle variants.
export const accent = {
  subtle: "#eef2ff",
  default: "#4f46e5",
  hover: "#4338ca",
  active: "#3730a3",
  onAccent: "#ffffff",
} as const;

// Semantic feedback colors (each with a subtle background variant).
export const feedback = {
  success: "#16a34a",
  successSubtle: "#dcfce7",
  warning: "#b45309",
  warningSubtle: "#fef3c7",
  danger: "#dc2626",
  dangerHover: "#b91c1c",
  dangerActive: "#991b1b",
  dangerSubtle: "#fee2e2",
  info: "#0284c7",
  infoSubtle: "#e0f2fe",
} as const;

// Semantic roles that components reference (so components never touch the ramp
// directly for these common cases).
export const color = {
  // Backgrounds & surfaces
  background: gray[50],
  surface: gray[0],
  surfaceSunken: gray[100],
  surfaceHover: gray[50],
  scrim: "rgba(15, 23, 42, 0.45)",

  // Borders
  border: gray[200],
  borderStrong: gray[300],
  borderFocus: accent.default,

  // Text
  textPrimary: gray[900],
  textSecondary: gray[600],
  textTertiary: gray[400],
  textInverse: gray[0],
  textLink: accent.default,
  textDisabled: gray[400],

  // Accent & feedback (re-exported for convenience)
  accent: accent.default,
  accentSubtle: accent.subtle,
  danger: feedback.danger,
  success: feedback.success,
  warning: feedback.warning,
  info: feedback.info,
} as const;

export type GrayStep = keyof typeof gray;
