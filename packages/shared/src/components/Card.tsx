import { View, type ViewProps } from "react-native";
import { Box, type BoxProps } from "./Stack.tsx";
import { color, spacing } from "../tokens/index.ts";

/**
 * Elevated container built on Box. Compose with CardHeader / CardBody, or pass
 * children directly.
 */
export function Card({
  children,
  radius = "lg",
  elevation = "md",
  ...rest
}: BoxProps) {
  return (
    <Box
      background={color.surface}
      borderColor={color.border}
      borderWidth="thin"
      radius={radius}
      elevation={elevation}
      {...rest}
    >
      {children}
    </Box>
  );
}

export function CardHeader({ style, children, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: color.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function CardBody({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[{ padding: spacing.lg }, style]} {...rest}>
      {children}
    </View>
  );
}
