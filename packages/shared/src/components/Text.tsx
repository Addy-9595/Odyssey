import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
} from "react-native";
import {
  color,
  numericTextStyle,
  typography,
  type TypographyVariant,
} from "../tokens/index.ts";

export interface TextProps extends RNTextProps {
  /** Type-scale variant. */
  variant?: TypographyVariant;
  /** Token-driven color (defaults to primary text). */
  color?: string;
  align?: TextStyle["textAlign"];
  /** Monospace + tabular-nums treatment, for money and IDs. */
  numeric?: boolean;
  /** Override the variant's weight when needed. */
  weight?: TextStyle["fontWeight"];
}

/**
 * The typography primitive. Every piece of text in the app renders through this
 * — nothing uses raw RN <Text> with inline styles.
 */
export function Text({
  variant = "body",
  color: colorProp = color.textPrimary,
  align,
  numeric,
  weight,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        typography[variant],
        { color: colorProp },
        align ? { textAlign: align } : null,
        numeric ? numericTextStyle : null,
        weight ? { fontWeight: weight } : null,
        style,
      ]}
      {...rest}
    />
  );
}
