import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";
import {
  getGetOrderQueryKey,
  getListOrdersQueryKey,
  useCancelOrder,
  useCompleteOrder,
  useConfirmOrder,
  useGetOrder,
  usePreparingOrder,
  useReadyOrder,
  type ErrorResponse,
  type OrderAction,
  type OrderDetail,
  type OrderItemDetail,
} from "@odyssey/api-client";
import {
  Button,
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
  formatDateTime,
  formatMoney,
  color,
  spacing,
  useToast,
  type ButtonVariant,
  type Column,
} from "@odyssey/shared";
import { orderActionLabel, orderStatusLabel, orderTypeLabel } from "../../src/orders/labels.ts";

const ITEM_COLUMNS: Column<OrderItemDetail>[] = [
  {
    key: "name",
    header: "Item",
    flex: 2,
    render: (it) => <Text variant="body">{it.menuItem.name}</Text>,
  },
  {
    key: "qty",
    header: "Qty",
    width: 72,
    align: "right",
    render: (it) => (
      <Text variant="body" numeric>
        {it.quantity}
      </Text>
    ),
  },
  {
    key: "unit",
    header: "Unit price",
    flex: 1,
    align: "right",
    render: (it) => (
      <Text variant="body" numeric>
        {formatMoney(it.unitPriceCents)}
      </Text>
    ),
  },
  {
    key: "line",
    header: "Line total",
    flex: 1,
    align: "right",
    render: (it) => (
      <Text variant="body" numeric>
        {formatMoney(it.unitPriceCents * it.quantity)}
      </Text>
    ),
  },
];

export default function OrderDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const parsedId = Number(rawId);
  const validId = Number.isInteger(parsedId) && parsedId > 0;

  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    data: order,
    isLoading,
    error,
  } = useGetOrder(parsedId, {
    query: { enabled: validId, queryKey: getGetOrderQueryKey(parsedId) },
  });

  // Shared success/error handling for every status action.
  const mutationConfig: {
    mutation: UseMutationOptions<OrderDetail, ErrorResponse, { id: number }>;
  } = {
    mutation: {
      onSuccess: (fresh) => {
        // Seed the detail cache from the response (it carries fresh
        // allowedActions), then prefix-invalidate the list variants.
        queryClient.setQueryData(getGetOrderQueryKey(parsedId), fresh);
        void queryClient.invalidateQueries({
          queryKey: getListOrdersQueryKey(),
        });
      },
      onError: (err) => {
        // Safety net — buttons are already gated by allowedActions.
        if (err.code === "ILLEGAL_TRANSITION") {
          toast.show({
            title: "Action not allowed",
            description: err.error,
            tone: "danger",
          });
        }
      },
    },
  };

  // ALL mutation hooks called unconditionally at top level (rules-of-hooks).
  const confirm = useConfirmOrder(mutationConfig);
  const preparing = usePreparingOrder(mutationConfig);
  const ready = useReadyOrder(mutationConfig);
  const complete = useCompleteOrder(mutationConfig);
  const cancel = useCancelOrder(mutationConfig);

  const actionMap: Record<
    OrderAction,
    { run: () => void; isPending: boolean; variant: ButtonVariant }
  > = {
    confirm: {
      run: () => confirm.mutate({ id: parsedId }),
      isPending: confirm.isPending,
      variant: "primary",
    },
    preparing: {
      run: () => preparing.mutate({ id: parsedId }),
      isPending: preparing.isPending,
      variant: "primary",
    },
    ready: {
      run: () => ready.mutate({ id: parsedId }),
      isPending: ready.isPending,
      variant: "primary",
    },
    complete: {
      run: () => complete.mutate({ id: parsedId }),
      isPending: complete.isPending,
      variant: "primary",
    },
    cancel: {
      run: () => cancel.mutate({ id: parsedId }),
      isPending: cancel.isPending,
      variant: "danger",
    },
  };
  const anyPending = Object.values(actionMap).some((a) => a.isPending);

  if (!validId) {
    return (
      <ScreenFrame>
        <ErrorState
          title="Invalid order"
          description={`"${String(rawId)}" is not a valid order id.`}
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
          <Skeleton height={spacing["6xl"]} />
        </VStack>
      </ScreenFrame>
    );
  }

  if (error) {
    if (error.code === "ORDER_NOT_FOUND") {
      return (
        <ScreenFrame>
          <EmptyState
            title="Order not found"
            description={`No order with id #${parsedId}.`}
          />
        </ScreenFrame>
      );
    }
    return (
      <ScreenFrame>
        <ErrorState
          title="Couldn't load order"
          description="Something went wrong. Try again."
        />
      </ScreenFrame>
    );
  }

  if (!order) {
    return (
      <ScreenFrame>
        <EmptyState title="Order not found" description={`No order with id #${parsedId}.`} />
      </ScreenFrame>
    );
  }

  return (
    <ScreenFrame>
      <VStack gap="xl">
        {/* Header */}
        <Card>
          <CardHeader>
            <HStack justify="space-between" align="center" wrap gap="sm">
              <Text variant="h2" numeric>
                #{order.id}
              </Text>
              <StatusBadge
                status={order.status}
                label={orderStatusLabel[order.status]}
              />
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack gap="sm">
              <DetailRow label="Type" value={orderTypeLabel[order.type]} />
              <DetailRow label="Created" value={formatDateTime(order.createdAt)} />
              <DetailRow label="Updated" value={formatDateTime(order.updatedAt)} />
            </VStack>
          </CardBody>
        </Card>

        {/* Actions */}
        {order.allowedActions.length > 0 ? (
          <HStack gap="sm" wrap>
            {order.allowedActions.map((action) => {
              const entry = actionMap[action];
              return (
                <Button
                  key={action}
                  title={orderActionLabel[action]}
                  variant={entry.variant}
                  loading={entry.isPending}
                  disabled={anyPending && !entry.isPending}
                  onPress={entry.run}
                />
              );
            })}
          </HStack>
        ) : (
          <Text variant="caption" color={color.textTertiary}>
            No further actions available for a {orderStatusLabel[order.status].toLowerCase()} order.
          </Text>
        )}

        {/* Customer */}
        <Card>
          <CardHeader>
            <Text variant="h3">Customer</Text>
          </CardHeader>
          <CardBody>
            <VStack gap="sm">
              <DetailRow label="Name" value={order.customer.name} />
              <DetailRow label="Email" value={order.customer.email} />
              <DetailRow label="Phone" value={order.customer.phone ?? "—"} />
            </VStack>
          </CardBody>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <Text variant="h3">Items</Text>
          </CardHeader>
          <CardBody>
            <VStack gap="lg">
              <Table
                columns={ITEM_COLUMNS}
                data={order.items}
                keyExtractor={(it) => String(it.id)}
              />
              <HStack justify="space-between" align="center">
                <Text variant="h3">Total</Text>
                <Text variant="h2" numeric>
                  {formatMoney(order.totalCents)}
                </Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </ScreenFrame>
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
