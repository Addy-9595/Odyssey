import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import {
  OrderStatus,
  useGetDashboardStats,
  type OrderListItem,
  type PopularItem,
} from "@odyssey/api-client";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  HStack,
  Skeleton,
  StatusBadge,
  Table,
  Text,
  VStack,
  color,
  formatDateTime,
  formatMoney,
  getStatusColorSet,
  radii,
  spacing,
  type Column,
} from "@odyssey/shared";
import { orderStatusLabel } from "../src/orders/labels.ts";

export default function HomeScreen() {
  const router = useRouter();
  const { data: stats, isLoading, error } = useGetDashboardStats();

  const recentColumns: Column<OrderListItem>[] = [
    {
      key: "id",
      header: "Order",
      width: 80,
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
      align: "right",
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
        <Text variant="display">Home</Text>
        <Text variant="body" color={color.textSecondary}>
          Overview of restaurant operations.
        </Text>
      </VStack>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error || !stats ? (
        <ErrorState
          title="Couldn't load the dashboard"
          description="Something went wrong fetching the overview. Try again."
        />
      ) : (
        <VStack gap="xl">
          {/* KPI row */}
          <HStack gap="lg" wrap>
            <KpiCard label="Total orders" value={String(stats.totalOrders)} />
            <KpiCard
              label="Revenue"
              value={formatMoney(stats.totalRevenueCents)}
            />
            <KpiCard
              label="Pending"
              value={String(stats.ordersByStatus.pending)}
              valueColor={getStatusColorSet("pending").text}
              accentBar={getStatusColorSet("pending").border}
            />
            <KpiCard
              label="Completed"
              value={String(stats.ordersByStatus.completed)}
              valueColor={getStatusColorSet("completed").text}
              accentBar={getStatusColorSet("completed").border}
            />
          </HStack>

          {/* Orders by status — the status-color signature */}
          <Card>
            <CardHeader>
              <Text variant="h3">Orders by status</Text>
            </CardHeader>
            <CardBody>
              <HStack gap="md" wrap>
                {Object.values(OrderStatus).map((status) => (
                  <StatusStat
                    key={status}
                    label={orderStatusLabel[status]}
                    count={stats.ordersByStatus[status]}
                    colors={getStatusColorSet(status)}
                  />
                ))}
              </HStack>
            </CardBody>
          </Card>

          {/* Bottom: recent orders + popular items */}
          <HStack gap="xl" align="flex-start" wrap>
            <View style={{ flex: 2, minWidth: 320 }}>
              <Card>
                <CardHeader>
                  <Text variant="h3">Recent orders</Text>
                </CardHeader>
                <CardBody>
                  <Table
                    columns={recentColumns}
                    data={stats.recentOrders}
                    keyExtractor={(o) => String(o.id)}
                    onRowPress={(o) =>
                      router.push({
                        pathname: "/orders/[id]",
                        params: { id: String(o.id) },
                      })
                    }
                    emptyState={
                      <EmptyState
                        title="No orders yet"
                        description="Orders will appear here as they come in."
                      />
                    }
                  />
                </CardBody>
              </Card>
            </View>

            <View style={{ flex: 1, minWidth: 260 }}>
              <Card>
                <CardHeader>
                  <Text variant="h3">Popular items</Text>
                </CardHeader>
                <CardBody>
                  {stats.popularItems.length === 0 ? (
                    <EmptyState
                      title="No sales yet"
                      description="Top items appear once orders are placed."
                    />
                  ) : (
                    <VStack gap="none">
                      {stats.popularItems.map((item, index) => (
                        <PopularRow
                          key={item.name}
                          rank={index + 1}
                          item={item}
                          isLast={index === stats.popularItems.length - 1}
                        />
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </View>
          </HStack>
        </VStack>
      )}
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function KpiCard({
  label,
  value,
  valueColor,
  accentBar,
}: {
  label: string;
  value: string;
  valueColor?: string;
  accentBar?: string;
}) {
  return (
    <Card flex={1} style={{ minWidth: 180 }}>
      <CardBody>
        <VStack gap="sm">
          {accentBar ? (
            <View
              style={{
                width: spacing["2xl"],
                height: spacing.xs,
                borderRadius: radii.full,
                backgroundColor: accentBar,
              }}
            />
          ) : null}
          <Text variant="display" numeric color={valueColor ?? color.textPrimary}>
            {value}
          </Text>
          <Text variant="label" color={color.textSecondary}>
            {label}
          </Text>
        </VStack>
      </CardBody>
    </Card>
  );
}

function StatusStat({
  label,
  count,
  colors,
}: {
  label: string;
  count: number;
  colors: { fill: string; text: string; border: string };
}) {
  return (
    <Box
      background={colors.fill}
      borderColor={colors.border}
      borderWidth="thin"
      radius="md"
      style={{ minWidth: 104, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}
    >
      <VStack gap="xxs">
        <Text variant="h1" numeric color={colors.text}>
          {count}
        </Text>
        <Text variant="label" color={colors.text}>
          {label}
        </Text>
      </VStack>
    </Box>
  );
}

function PopularRow({
  rank,
  item,
  isLast,
}: {
  rank: number;
  item: PopularItem;
  isLast: boolean;
}) {
  return (
    <HStack
      align="center"
      gap="md"
      style={{
        paddingVertical: spacing.sm,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: color.border,
      }}
    >
      <View
        style={{
          width: spacing["2xl"],
          height: spacing["2xl"],
          borderRadius: radii.full,
          backgroundColor: color.surfaceSunken,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text variant="label" numeric color={color.textSecondary}>
          {rank}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="body">{item.name}</Text>
      </View>
      <Text variant="bodyStrong" numeric>
        {item.totalQuantity}
      </Text>
    </HStack>
  );
}

function LoadingSkeleton() {
  return (
    <VStack gap="xl">
      <HStack gap="lg" wrap>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, minWidth: 180 }}>
            <Skeleton height={spacing["6xl"]} />
          </View>
        ))}
      </HStack>
      <Skeleton height={spacing["6xl"]} />
      <HStack gap="xl" align="flex-start" wrap>
        <View style={{ flex: 2, minWidth: 320 }}>
          <Skeleton height={spacing["6xl"]} />
        </View>
        <View style={{ flex: 1, minWidth: 260 }}>
          <Skeleton height={spacing["6xl"]} />
        </View>
      </HStack>
    </VStack>
  );
}
