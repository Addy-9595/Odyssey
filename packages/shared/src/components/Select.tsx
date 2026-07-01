import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "./Text.tsx";
import { Modal } from "./Modal.tsx";
import type { PressableState } from "./_pressable.ts";
import {
  accent,
  color,
  feedback,
  radii,
  spacing,
} from "../tokens/index.ts";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * Select — NOT an HTML <select>. A Pressable trigger that opens the Modal
 * primitive with a selectable option list. Trigger states mirror Input.
 */
export function Select({
  label,
  placeholder = "Select…",
  value,
  options,
  onChange,
  disabled = false,
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const hasError = !!error;
  const selected = options.find((o) => o.value === value);

  function borderColor(hovered: boolean): string {
    if (hasError) return feedback.danger;
    if (open) return color.borderFocus;
    if (hovered && !disabled) return color.borderStrong;
    return color.border;
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Text variant="label" color={color.textSecondary}>
          {label}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={(state) => {
          const { hovered } = state as PressableState;
          return {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: open || hasError ? 2 : 1,
            borderColor: borderColor(!!hovered),
            backgroundColor: disabled ? color.surfaceSunken : color.surface,
            opacity: disabled ? 0.7 : 1,
          };
        }}
      >
        <Text
          variant="body"
          color={selected ? color.textPrimary : color.textTertiary}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text variant="caption" color={color.textSecondary}>
          ▾
        </Text>
      </Pressable>

      {hasError ? (
        <Text variant="caption" color={feedback.danger}>
          {error}
        </Text>
      ) : null}

      <Modal visible={open} onClose={() => setOpen(false)} title={label ?? "Select"}>
        <ScrollView style={{ maxHeight: 320 }}>
          <View style={{ gap: spacing.xxs }}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={(state) => {
                    const { hovered } = state as PressableState;
                    return {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.sm,
                      backgroundColor: isSelected
                        ? accent.subtle
                        : hovered
                          ? color.surfaceSunken
                          : "transparent",
                    };
                  }}
                >
                  <Text
                    variant="body"
                    color={isSelected ? accent.active : color.textPrimary}
                  >
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <Text variant="body" color={accent.active}>
                      ✓
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}
