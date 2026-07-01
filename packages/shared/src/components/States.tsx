import type { ReactNode } from "react";
import { View } from "react-native";
import { Text } from "./Text.tsx";
import { color, feedback, spacing } from "../tokens/index.ts";

interface StateDisplayProps {
  title: string;
  description?: string;
  /** Optional action slot (e.g. a Button). */
  action?: ReactNode;
}

function StateDisplay({
  title,
  description,
  action,
  titleColor,
}: StateDisplayProps & { titleColor: string }) {
  return (
    <View
      style={{
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing["3xl"],
        paddingHorizontal: spacing.lg,
      }}
    >
      <Text variant="h3" color={titleColor} align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="body" color={color.textSecondary} align="center">
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xs }}>{action}</View> : null}
    </View>
  );
}

/** Consistent empty-state display (neutral tone). */
export function EmptyState(props: StateDisplayProps) {
  return <StateDisplay {...props} titleColor={color.textPrimary} />;
}

/** Consistent error-state display (danger tone). */
export function ErrorState(props: StateDisplayProps) {
  return <StateDisplay {...props} titleColor={feedback.danger} />;
}
