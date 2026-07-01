import { Switch as RNSwitch, View } from "react-native";
import { Text } from "./Text.tsx";
import { accent, color, gray, spacing } from "../tokens/index.ts";

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}

/** Tokenized wrapper over core RN Switch (track/thumb colors from tokens). */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  label,
}: SwitchProps) {
  const control = (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: gray[300], true: accent.default }}
      thumbColor={color.surface}
      ios_backgroundColor={gray[300]}
      style={disabled ? { opacity: 0.5 } : undefined}
    />
  );

  if (!label) return control;

  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}
    >
      {control}
      <Text
        variant="body"
        color={disabled ? color.textDisabled : color.textPrimary}
      >
        {label}
      </Text>
    </View>
  );
}
