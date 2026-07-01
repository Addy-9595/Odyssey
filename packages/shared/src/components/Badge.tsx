import { View } from "react-native";
import { Text } from "./Text.tsx";
import {
  accent,
  feedback,
  gray,
  getStatusColorSet,
  radii,
  spacing,
  type StatusColorSet,
} from "../tokens/index.ts";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE: Record<BadgeTone, StatusColorSet> = {
  neutral: { fill: gray[100], text: gray[700], border: gray[300] },
  accent: { fill: accent.subtle, text: accent.active, border: "#c7d2fe" },
  success: { fill: feedback.successSubtle, text: "#166534", border: "#86efac" },
  warning: { fill: feedback.warningSubtle, text: "#92400e", border: "#fcd34d" },
  danger: { fill: feedback.dangerSubtle, text: "#991b1b", border: "#fca5a5" },
  info: { fill: feedback.infoSubtle, text: "#075985", border: "#7dd3fc" },
};

function BadgeBase({
  label,
  colors,
}: {
  label: string;
  colors: StatusColorSet;
}) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
        borderRadius: radii.full,
        borderWidth: 1,
        backgroundColor: colors.fill,
        borderColor: colors.border,
      }}
    >
      <Text variant="label" color={colors.text}>
        {label}
      </Text>
    </View>
  );
}

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

/** Generic tone badge. */
export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return <BadgeBase label={label} colors={TONE[tone]} />;
}

export interface StatusBadgeProps {
  /**
   * Status key (e.g. an OrderStatus value). Kept as a plain string so
   * @odyssey/shared stays generic and does not depend on the generated client;
   * unknown keys fall back to a neutral tone.
   */
  status: string;
  /** Optional display label; defaults to the status key. */
  label?: string;
}

/**
 * Status badge — maps a status key to its status color token and renders it
 * identically everywhere. The design signature.
 */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <BadgeBase label={label ?? status} colors={getStatusColorSet(status)} />;
}
