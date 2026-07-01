import { View, type ViewProps, type ViewStyle } from "react-native";
import {
  borderWidth as borderWidths,
  elevation as elevations,
  radii,
  spacing,
  type BorderWidthToken,
  type ElevationToken,
  type RadiusToken,
  type SpacingToken,
} from "../tokens/index.ts";

/* -------------------------------------------------------------------------- */
/* Box — the surface/spacing primitive                                        */
/* -------------------------------------------------------------------------- */

export interface BoxProps extends ViewProps {
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  radius?: RadiusToken;
  elevation?: ElevationToken;
  background?: string;
  borderColor?: string;
  borderWidth?: BorderWidthToken;
  flex?: number;
  grow?: boolean;
}

export function Box({
  padding,
  paddingX,
  paddingY,
  radius,
  elevation,
  background,
  borderColor,
  borderWidth,
  flex,
  grow,
  style,
  ...rest
}: BoxProps) {
  const composed: ViewStyle = {
    ...(padding !== undefined ? { padding: spacing[padding] } : null),
    ...(paddingX !== undefined
      ? { paddingHorizontal: spacing[paddingX] }
      : null),
    ...(paddingY !== undefined ? { paddingVertical: spacing[paddingY] } : null),
    ...(radius !== undefined ? { borderRadius: radii[radius] } : null),
    ...(background !== undefined ? { backgroundColor: background } : null),
    ...(borderColor !== undefined ? { borderColor } : null),
    ...(borderWidth !== undefined
      ? { borderWidth: borderWidths[borderWidth] }
      : null),
    ...(flex !== undefined ? { flex } : null),
    ...(grow ? { flexGrow: 1 } : null),
  };
  return (
    <View
      style={[elevation ? elevations[elevation] : null, composed, style]}
      {...rest}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stacks — layout with token gaps                                            */
/* -------------------------------------------------------------------------- */

export interface StackProps extends ViewProps {
  gap?: SpacingToken;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
  flex?: number;
  grow?: boolean;
}

function stackStyle(
  direction: "row" | "column",
  { gap, align, justify, wrap, flex, grow }: StackProps,
): ViewStyle {
  return {
    flexDirection: direction,
    ...(gap !== undefined ? { gap: spacing[gap] } : null),
    ...(align !== undefined ? { alignItems: align } : null),
    ...(justify !== undefined ? { justifyContent: justify } : null),
    ...(wrap ? { flexWrap: "wrap" } : null),
    ...(flex !== undefined ? { flex } : null),
    ...(grow ? { flexGrow: 1 } : null),
  };
}

export function VStack({
  gap,
  align,
  justify,
  wrap,
  flex,
  grow,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[stackStyle("column", { gap, align, justify, wrap, flex, grow }), style]}
      {...rest}
    />
  );
}

export function HStack({
  gap,
  align,
  justify,
  wrap,
  flex,
  grow,
  style,
  ...rest
}: StackProps) {
  return (
    <View
      style={[stackStyle("row", { gap, align, justify, wrap, flex, grow }), style]}
      {...rest}
    />
  );
}
