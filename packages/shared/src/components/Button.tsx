import { ActivityIndicator, Pressable, type ViewStyle } from "react-native";
import { Text } from "./Text.tsx";
import type { PressableState } from "./_pressable.ts";
import {
  accent,
  color,
  feedback,
  gray,
  radii,
  spacing,
  type SpacingToken,
  type TypographyVariant,
} from "../tokens/index.ts";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

interface Visual {
  background: string;
  border: string;
  text: string;
}

interface VisualState {
  hovered: boolean;
  pressed: boolean;
}

function getVisual(variant: ButtonVariant, s: VisualState): Visual {
  switch (variant) {
    case "primary":
      return {
        background: s.pressed
          ? accent.active
          : s.hovered
            ? accent.hover
            : accent.default,
        border: "transparent",
        text: accent.onAccent,
      };
    case "danger":
      return {
        background: s.pressed
          ? feedback.dangerActive
          : s.hovered
            ? feedback.dangerHover
            : feedback.danger,
        border: "transparent",
        text: color.textInverse,
      };
    case "secondary":
      return {
        background: s.pressed
          ? gray[100]
          : s.hovered
            ? gray[50]
            : color.surface,
        border: color.borderStrong,
        text: color.textPrimary,
      };
    case "ghost":
      return {
        background: s.pressed
          ? gray[200]
          : s.hovered
            ? gray[100]
            : "transparent",
        border: "transparent",
        text: color.textPrimary,
      };
  }
}

const SIZE: Record<
  ButtonSize,
  { paddingY: SpacingToken; paddingX: SpacingToken; textVariant: TypographyVariant }
> = {
  sm: { paddingY: "xs", paddingX: "md", textVariant: "label" },
  md: { paddingY: "sm", paddingX: "lg", textVariant: "bodyStrong" },
  lg: { paddingY: "md", paddingX: "xl", textVariant: "h3" },
};

/**
 * Button with a full state matrix. Accent is used ONLY by the primary variant.
 * Hover/focus/pressed come from Pressable's web state; a 2px border is always
 * reserved (transparent) so the focus ring never shifts layout.
 */
export function Button({
  title,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  accessibilityLabel,
}: ButtonProps) {
  const sizing = SIZE[size];
  const isInactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={(state) => {
        const { pressed, hovered, focused } = state as PressableState;
        const visual = getVisual(variant, {
          hovered: !!hovered && !isInactive,
          pressed: !!pressed && !isInactive,
        });
        const base: ViewStyle = {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
          paddingVertical: spacing[sizing.paddingY],
          paddingHorizontal: spacing[sizing.paddingX],
          borderRadius: radii.md,
          borderWidth: 2,
          borderColor:
            focused && !isInactive ? accent.default : visual.border,
          backgroundColor: visual.background,
          opacity: isInactive ? 0.55 : 1,
          ...(fullWidth ? { alignSelf: "stretch" } : { alignSelf: "flex-start" }),
        };
        return base;
      }}
    >
      {(state) => {
        const { pressed, hovered } = state as PressableState;
        const visual = getVisual(variant, {
          hovered: !!hovered && !isInactive,
          pressed: !!pressed && !isInactive,
        });
        return (
          <>
            {loading ? (
              <ActivityIndicator size="small" color={visual.text} />
            ) : null}
            <Text
              variant={sizing.textVariant}
              color={visual.text}
              // Keep the label width stable while the spinner shows.
              style={loading ? { opacity: 0.9 } : null}
            >
              {title}
            </Text>
          </>
        );
      }}
    </Pressable>
  );
}
