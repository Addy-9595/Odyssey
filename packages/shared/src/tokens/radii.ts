/** Corner radii (px). `full` = pill. */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;

/** Border widths (px). */
export const borderWidth = {
  none: 0,
  thin: 1,
  thick: 2,
} as const;

export type BorderWidthToken = keyof typeof borderWidth;
