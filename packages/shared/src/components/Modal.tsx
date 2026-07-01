import {
  Modal as RNModal,
  Pressable,
  View,
  type ViewProps,
} from "react-native";
import { Text } from "./Text.tsx";
import { Box } from "./Stack.tsx";
import type { PressableState } from "./_pressable.ts";
import { color, radii, spacing } from "../tokens/index.ts";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: ViewProps["children"];
  /** Max width of the centered surface (px). */
  maxWidth?: number;
}

/**
 * Centered modal on RN's Modal (works on web via react-native-web): scrim,
 * elevated surface, header with a close affordance. Base for Select and future
 * dialogs. Tapping the scrim or the close button dismisses.
 */
export function Modal({
  visible,
  onClose,
  title,
  children,
  maxWidth = 420,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Scrim — pressing it closes. */}
      <Pressable
        accessibilityLabel="Close modal"
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: color.scrim,
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.lg,
        }}
      >
        {/* Stop propagation so taps inside the surface don't close. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{ width: "100%", maxWidth }}
        >
          <Box
            background={color.surface}
            radius="lg"
            elevation="lg"
            borderColor={color.border}
            borderWidth="thin"
          >
            {title !== undefined ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                }}
              >
                <Text variant="h3">{title}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={onClose}
                  style={(state) => {
                    const { hovered } = state as PressableState;
                    return {
                      width: spacing["2xl"],
                      height: spacing["2xl"],
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: radii.sm,
                      backgroundColor: hovered
                        ? color.surfaceSunken
                        : "transparent",
                    };
                  }}
                >
                  <Text variant="body" color={color.textSecondary}>
                    ✕
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={{ padding: spacing.lg }}>{children}</View>
          </Box>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
