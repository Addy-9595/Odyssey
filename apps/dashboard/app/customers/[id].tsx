import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getGetCustomerQueryKey,
  useGetCustomer,
  type OrderListItem,
} from "@odyssey/api-client";
import {
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
  spacing,
  type Column,
} from "@odyssey/shared";
import { orderStatusLabel, orderTypeLabel } from "../../src/orders/labels.ts";

export default function CustomerDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const parsedId = Number(rawId);
  const validId = Number.isInteger(parsedId) && parsedId > 0;

  const {
    data: customer,
    isLoading,
    error,
  } = useGetCustomer(parsedId, {
    query: { enabled: validId, queryKey: getGetCustomerQueryKey(parsedId) },
  });

  const orderColumns: Column<OrderListItem>[] = [
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
      key: "status",
      header: "Status",
      flex: 1,
      render: (o) => (
        <StatusBadge status={o.status} label={orderStatusLabel[o.status]} />
      ),
    },
    {
      key: "type",
      header: "Type",
      flex: 1,
      render: (o) => <Text variant="body">{orderTypeLabel[o.type]}</Text>,
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

  if (!validId) {
    return (
      <ScreenFrame>
        <ErrorState
          title="Invalid customer"
          description={`"${String(rawId)}" is not a valid customer id.`}
        />
      </ScreenFrame>
    );
  }

  if (isLoading) {
    return (
      <ScreenFrame>
        <VStack gap="md">
          <Skeleton width="40%" height={spacing["3xl"]} />
          <Skeleton height={spacing["6xl"]} />
          <HStack gap="lg">
            <View style={{ flex: 1 }}>
              <Skeleton height={spacing["6xl"]} />
            </View>
            <View style={{ flex: 1 }}>
              <Skeleton height={spacing["6xl"]} />
            </View>
          </HStack>
          <Skeleton height={spacing["6xl"]} />
        </VStack>
      </ScreenFrame>
    );
  }

  if (error) {
    if (error.code === "CUSTOMER_NOT_FOUND") {
      return (
        <ScreenFrame>
          <EmptyState
            title="Customer not found"
            description={`No customer with id #${parsedId}.`}
          />
        </ScreenFrame>
      );
    }
    return (
      <ScreenFrame>
        <ErrorState
          title="Couldn't load customer"
          description="Something went wrong. Try again."
        />
      </ScreenFrame>
    );
  }

  if (!customer) {
    return (
      <ScreenFrame>
        <EmptyState
          title="Customer not found"
          description={`No customer with id #${parsedId}.`}
        />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame>
      <VStack gap="xl">
        {/* Header */}
        <Card>
          <CardHeader>
            <Text variant="h2">{customer.name}</Text>
          </CardHeader>
          <CardBody>
            <VStack gap="sm">
              <DetailRow label="Email" value={customer.email} />
              <DetailRow label="Phone" value={customer.phone ?? "—"} />
              <DetailRow label="Joined" value={formatDateTime(customer.createdAt)} />
            </VStack>
          </CardBody>
        </Card>

        {/* KPIs */}
        <HStack gap="lg" wrap>
          <KpiCard label="Total spend" value={formatMoney(customer.totalSpendCents)} />
          <KpiCard label="Orders" value={String(customer.orderCount)} />
        </HStack>

        {/* Order history */}
        <Card>
          <CardHeader>
            <Text variant="h3">Order history</Text>
          </CardHeader>
          <CardBody>
            <Table
              columns={orderColumns}
              data={customer.orders}
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
                  description="This customer hasn't placed any orders."
                />
              }
            />
          </CardBody>
        </Card>
      </VStack>
    </ScreenFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card flex={1} style={{ minWidth: 180 }}>
      <CardBody>
        <VStack gap="sm">
          <Text variant="display" numeric>
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

function ScreenFrame({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: spacing["3xl"],
        maxWidth: 760,
        width: "100%",
      }}
    >
      {children}
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack justify="space-between" gap="lg">
      <Text variant="body" color={color.textSecondary}>
        {label}
      </Text>
      <Text variant="body">{value}</Text>
    </HStack>
  );
}
