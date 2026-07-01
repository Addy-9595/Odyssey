import { useRef, useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { Text } from "./Text.tsx";
import type { PressableState } from "./_pressable.ts";
import {
  color,
  feedback,
  radii,
  spacing,
  typography,
} from "../tokens/index.ts";

export interface InputProps
  extends Omit<TextInputProps, "editable" | "style"> {
  label?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * Text field with label and states: default / hover / focus / disabled / error.
 * Focus is tracked via onFocus/onBlur; hover via the wrapping Pressable's web
 * hover state. Clicking anywhere in the field focuses the input.
 */
export function Input({
  label,
  error,
  disabled = false,
  placeholder,
  ...rest
}: InputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  function borderColor(hovered: boolean): string {
    if (hasError) return feedback.danger;
    if (focused) return color.borderFocus;
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
        disabled={disabled}
        onPress={() => inputRef.current?.focus()}
        style={(state) => {
          const { hovered } = state as PressableState;
          return {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: focused || hasError ? 2 : 1,
            borderColor: borderColor(!!hovered),
            backgroundColor: disabled ? color.surfaceSunken : color.surface,
            opacity: disabled ? 0.7 : 1,
          };
        }}
      >
        <TextInput
          ref={inputRef}
          editable={!disabled}
          placeholder={placeholder}
          placeholderTextColor={color.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            typography.body,
            {
              flex: 1,
              color: color.textPrimary,
              // Remove the web default focus outline; the border is our ring.
              outlineStyle: "none",
            } as unknown as TextStyle,
          ]}
          {...rest}
        />
      </Pressable>

      {hasError ? (
        <Text variant="caption" color={feedback.danger}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
