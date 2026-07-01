/**
 * Typography tokens. Platform system font stack for UI text, monospace stack
 * for numerics. No custom font packages.
 *
 * Money and IDs use `numeric` (mono + tabular-nums) so figures look engineered
 * and align in columns.
 */
import { Platform, type TextStyle } from "react-native";

export const fontFamily = {
  sans: Platform.select({
    web: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    ios: "System",
    android: "sans-serif",
    default: "System",
  }) as string,
  mono: Platform.select({
    web: '"SF Mono", "Menlo", "Consolas", "Roboto Mono", ui-monospace, monospace',
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }) as string,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

// Type scale. Each entry is a ready-to-spread TextStyle fragment.
export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: fontWeight.bold },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: fontWeight.bold },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: fontWeight.semibold },
  h3: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.semibold },
  body: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.semibold },
  label: { fontSize: 13, lineHeight: 16, fontWeight: fontWeight.medium },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.regular },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

// Numeric treatment for money and IDs — apply on top of any variant.
export const numericTextStyle: TextStyle = {
  fontFamily: fontFamily.mono,
  fontVariant: ["tabular-nums"],
};
