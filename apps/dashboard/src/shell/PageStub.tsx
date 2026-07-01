import { ScrollView } from "react-native";
import { Text, VStack, color, spacing } from "@odyssey/shared";

/**
 * Placeholder page body. Proves navigation lands on the right route; real
 * content arrives in later chunks.
 */
export function PageStub({ title, note }: { title: string; note?: string }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{ padding: spacing["3xl"] }}
    >
      <VStack gap="sm">
        <Text variant="display">{title}</Text>
        <Text variant="body" color={color.textSecondary}>
          {note ?? "Stub screen — content lands in a later chunk."}
        </Text>
      </VStack>
    </ScrollView>
  );
}
