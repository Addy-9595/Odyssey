import type { ReactNode } from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { Text } from "./Text.tsx";
import type { PressableState } from "./_pressable.ts";
import { color, gray, spacing } from "../tokens/index.ts";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Fixed column width (px). Omit to use flex. */
  width?: number;
  /** Flex grow when no fixed width (default 1). */
  flex?: number;
  align?: "left" | "right" | "center";
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowPress?: (row: T) => void;
  /** Rendered in the body when data is empty. */
  emptyState?: ReactNode;
}

function alignItemsFor(align: Column<unknown>["align"]): ViewStyle["alignItems"] {
  if (align === "right") return "flex-end";
  if (align === "center") return "center";
  return "flex-start";
}

function cellStyle(col: Column<unknown>): ViewStyle {
  return {
    ...(col.width !== undefined
      ? { width: col.width }
      : { flex: col.flex ?? 1 }),
    alignItems: alignItemsFor(col.align),
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  };
}

/**
 * View-based data table (not an HTML table). Header row + data rows with
 * consistent columns, web row hover, zebra rows + dividers, and a built-in
 * empty state. Numeric columns should render their cell with <Text numeric>.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  emptyState,
}: TableProps<T>) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color.border,
        borderRadius: spacing.sm,
        overflow: "hidden",
        backgroundColor: color.surface,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: color.surfaceSunken,
          borderBottomWidth: 1,
          borderBottomColor: color.border,
          paddingVertical: spacing.sm,
        }}
      >
        {columns.map((col) => (
          <View key={col.key} style={cellStyle(col as Column<unknown>)}>
            <Text variant="label" color={color.textSecondary}>
              {col.header}
            </Text>
          </View>
        ))}
      </View>

      {/* Body */}
      {data.length === 0 ? (
        <View style={{ padding: spacing["3xl"], alignItems: "center" }}>
          {emptyState ?? (
            <Text variant="body" color={color.textTertiary}>
              No records
            </Text>
          )}
        </View>
      ) : (
        data.map((row, index) => {
          const isLast = index === data.length - 1;
          const zebra = index % 2 === 1;
          return (
            <Pressable
              key={keyExtractor(row, index)}
              onPress={onRowPress ? () => onRowPress(row) : undefined}
              style={(state) => {
                const { hovered } = state as PressableState;
                return {
                  flexDirection: "row",
                  paddingVertical: spacing.md,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: color.border,
                  backgroundColor: hovered
                    ? color.surfaceHover
                    : zebra
                      ? gray[50]
                      : color.surface,
                };
              }}
            >
              {columns.map((col) => (
                <View key={col.key} style={cellStyle(col as Column<unknown>)}>
                  {col.render(row)}
                </View>
              ))}
            </Pressable>
          );
        })
      )}
    </View>
  );
}
