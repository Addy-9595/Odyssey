import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import {
  OrderStatus,
  OrderType,
  useListOrders,
  type OrderListItem,
} from "@odyssey/api-client";
import {
  Text,
  VStack,
  HStack,
  Select,
  Skeleton,
  StatusBadge,
  Table,
  EmptyState,
  ErrorState,
  formatDateTime,
  formatMoney,
  accent,
  color,
  radii,
  spacing,
  type Column,
} from "@odyssey/shared";
import { orderStatusLabel, orderTypeLabel } from "../../src/orders/labels.ts";

/** Single-select status filter: the StatusBadge hues double as the control. */
function StatusFilterPills({
  value,
  onChange,
}: {
  value: OrderStatus | undefined;
  onChange: (next: OrderStatus | undefined) => void;
}) {
  return (
    <HStack gap="sm" wrap align="center">
      {Object.values(OrderStatus).map((status) => {
        const selected = value === status;
        const dimmed = value !== undefined && !selected;
        return (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(selected ? undefined : status)}
            style={{
              borderRadius: radii.full,
              borderWidth: 2,
              borderColor: selected ? accent.default : "transparent",
              opacity: dimmed ? 0.4 : 1,
            }}
          >
            <StatusBadge status={status} label={orderStatusLabel[status]} />
          </Pressable>
        );
      })}
    </HStack>
  );
}

const TYPE_ALL = "all";

export default function OrdersScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [type, setType] = useState<OrderType | undefined>(undefined);

  const { data, isLoading, error } = useListOrders({ status, type });

  const filtersActive = status !== undefined || type !== undefined;

  const typeOptions = [
    { label: "All types", value: TYPE_ALL },
    ...Object.values(OrderType).map((t) => ({
      label: orderTypeLabel[t],
      value: t,
    })),
  ];

  const columns: Column<OrderListItem>[] = [
    {
      key: "id",
      header: "Order",
      width: 96,
      render: (o) => (
        <Text variant="body" numeric>
          #{o.id}
        </Text>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      flex: 2,
      render: (o) => <Text variant="body">{o.customer.name}</Text>,
    },
    {
      key: "type",
      header: "Type",
      flex: 1,
      render: (o) => <Text variant="body">{orderTypeLabel[o.type]}</Text>,
    },
    {
      key: "status",
      header: "Status",
      flex: 1,
      render: (o) => (
        <StatusBadge status={o.status} label={orderStatusLabel[o.status]} />
      ),
    },
    {
      key: "total",
      header: "Total",
      flex: 1,
      align: "right",
      render: (o) => (
        <Text variant="body" numeric>
          {formatMoney(o.totalCents)}
        </Text>
      ),
    },
    {
      key: "created",
      header: "Created",
      flex: 1,
      render: (o) => (
        <Text variant="caption" color={color.textSecondary}>
          {formatDateTime(o.createdAt)}
        </Text>
      ),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{ padding: spacing["3xl"], gap: spacing.xl }}
    >
      <VStack gap="xxs">
        <Text variant="display">Orders</Text>
        <Text variant="body" color={color.textSecondary}>
          Newest first. Select a status or type to filter; click a row to open it.
        </Text>
      </VStack>

      <VStack gap="md">
        <StatusFilterPills value={status} onChange={setStatus} />
        <View style={{ maxWidth: 240 }}>
          <Select
            label="Type"
            value={type ?? TYPE_ALL}
            options={typeOptions}
            onChange={(v) => setType(v === TYPE_ALL ? undefined : (v as OrderType))}
          />
        </View>
      </VStack>

      {isLoading ? (
        <VStack gap="sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={spacing["3xl"]} />
          ))}
        </VStack>
      ) : error ? (
        <ErrorState
          title="Couldn't load orders"
          description="Something went wrong fetching orders. Try again."
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title={filtersActive ? "No matching orders" : "No orders yet"}
          description={
            filtersActive
              ? "No orders match the current filters. Clear a filter to see more."
              : "Orders will appear here as they come in."
          }
        />
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(o) => String(o.id)}
          onRowPress={(o) =>
            router.push({
              pathname: "/orders/[id]",
              params: { id: String(o.id) },
            })
          }
        />
      )}
    </ScrollView>
  );
}
