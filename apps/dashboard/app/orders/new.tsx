import { useMemo, useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetOrderQueryKey,
  getListOrdersQueryKey,
  useCreateOrder,
  useListCustomers,
  useListMenuItems,
  OrderType,
  type MenuItem,
} from "@odyssey/api-client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  HStack,
  Input,
  Select,
  Skeleton,
  Table,
  Text,
  VStack,
  color,
  feedback,
  formatMoney,
  spacing,
  useToast,
  type Column,
} from "@odyssey/shared";
import { orderTypeLabel } from "../../src/orders/labels.ts";
import {
  addDraftLine,
  removeDraftLine,
  type DraftLine,
} from "../../src/orders/draft-lines.ts";

export default function NewOrderScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();

  const customersQuery = useListCustomers();
  const menuQuery = useListMenuItems();

  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [type, setType] = useState<OrderType | undefined>(undefined);
  const [lines, setLines] = useState<DraftLine[]>([]);

  // Item picker local state.
  const [pickerItemId, setPickerItemId] = useState<string | undefined>(undefined);
  const [qtyText, setQtyText] = useState("1");

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (created) => {
        // Seed the detail cache from the response (carries the SERVER total +
        // allowedActions) so the detail view paints instantly, then
        // prefix-invalidate every list filter variant.
        queryClient.setQueryData(getGetOrderQueryKey(created.id), created);
        void queryClient.invalidateQueries({
          queryKey: getListOrdersQueryKey(),
        });
        toast.show({
          title: "Order created",
          description: `Order #${created.id} placed.`,
          tone: "success",
        });
        router.replace({
          pathname: "/orders/[id]",
          params: { id: String(created.id) },
        });
      },
      onError: (err) => {
        // Server is the authority on semantic validity (customer/menu item
        // missing, item unavailable, payload validation). Surface its message.
        toast.show({
          title: "Couldn't create order",
          description: err.error,
          tone: "danger",
        });
      },
    },
  });

  const menuById = useMemo(
    () => new Map((menuQuery.data ?? []).map((m) => [m.id, m])),
    [menuQuery.data],
  );

  // Client-side PREVIEW only. Not authoritative — the server recomputes the
  // total from snapshotted prices. A dumb display sum, not business logic.
  const previewSubtotalCents = lines.reduce(
    (sum, l) => sum + (menuById.get(l.menuItemId)?.priceCents ?? 0) * l.quantity,
    0,
  );

  const parsedQty = Number.parseInt(qtyText, 10);
  const qtyValid = Number.isInteger(parsedQty) && parsedQty >= 1;
  const selectedItem = pickerItemId
    ? menuById.get(Number(pickerItemId))
    : undefined;
  const canAdd = !!selectedItem && selectedItem.isAvailable && qtyValid;

  function addLine() {
    if (!selectedItem || !selectedItem.isAvailable || !qtyValid) return;
    const menuItemId = selectedItem.id;
    setLines((prev) => addDraftLine(prev, menuItemId, parsedQty));
    setPickerItemId(undefined);
    setQtyText("1");
  }

  function removeLine(menuItemId: number) {
    setLines((prev) => removeDraftLine(prev, menuItemId));
  }

  const canSubmit =
    customerId !== undefined &&
    type !== undefined &&
    lines.length > 0 &&
    !createOrder.isPending;

  function submit() {
    if (customerId === undefined || type === undefined || lines.length === 0) {
      return;
    }
    // The body is EXACTLY { customerId, type, items:[{menuItemId,quantity}] }.
    // No total, price, unitPrice, or status — the server computes the total.
    createOrder.mutate({
      data: {
        customerId,
        type,
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
        })),
      },
    });
  }

  // --- Loading / error gates for the reference data ------------------------
  if (customersQuery.isLoading || menuQuery.isLoading) {
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

  if (customersQuery.error || menuQuery.error) {
    return (
      <ScreenFrame>
        <ErrorState
          title="Couldn't load form data"
          description="Something went wrong loading customers or menu items. Try again."
        />
      </ScreenFrame>
    );
  }

  const customers = customersQuery.data ?? [];
  const menuItems = menuQuery.data ?? [];

  const customerOptions = customers.map((c) => ({
    label: `${c.name} · ${c.email}`,
    value: String(c.id),
  }));

  const typeOptions = Object.values(OrderType).map((t) => ({
    label: orderTypeLabel[t],
    value: t,
  }));

  const itemOptions = menuItems.map((m) => ({
    label: itemOptionLabel(m),
    value: String(m.id),
  }));

  const lineColumns: Column<DraftLine>[] = [
    {
      key: "name",
      header: "Item",
      flex: 2,
      render: (l) => (
        <Text variant="body">{menuById.get(l.menuItemId)?.name ?? "—"}</Text>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      width: 64,
      align: "right",
      render: (l) => (
        <Text variant="body" numeric>
          {l.quantity}
        </Text>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      flex: 1,
      align: "right",
      render: (l) => (
        <Text variant="body" numeric>
          {formatMoney(menuById.get(l.menuItemId)?.priceCents ?? 0)}
        </Text>
      ),
    },
    {
      key: "line",
      header: "Line",
      flex: 1,
      align: "right",
      render: (l) => (
        <Text variant="body" numeric>
          {formatMoney((menuById.get(l.menuItemId)?.priceCents ?? 0) * l.quantity)}
        </Text>
      ),
    },
    {
      key: "remove",
      header: "",
      width: 96,
      align: "right",
      render: (l) => (
        <Button
          title="Remove"
          variant="ghost"
          size="sm"
          onPress={() => removeLine(l.menuItemId)}
        />
      ),
    },
  ];

  return (
    <ScreenFrame>
      <VStack gap="xl">
        <VStack gap="xxs">
          <Text variant="display">New order</Text>
          <Text variant="body" color={color.textSecondary}>
            Select a customer and type, add line items, then place the order.
          </Text>
        </VStack>

        {/* Customer + type */}
        <Card>
          <CardHeader>
            <Text variant="h3">Details</Text>
          </CardHeader>
          <CardBody>
            <VStack gap="lg">
              <Select
                label="Customer"
                placeholder="Select a customer…"
                value={customerId !== undefined ? String(customerId) : undefined}
                options={customerOptions}
                onChange={(v) => setCustomerId(Number(v))}
              />
              <Select
                label="Order type"
                placeholder="Select a type…"
                value={type}
                options={typeOptions}
                onChange={(v) => setType(v as OrderType)}
              />
            </VStack>
          </CardBody>
        </Card>

        {/* Item builder */}
        <Card>
          <CardHeader>
            <Text variant="h3">Items</Text>
          </CardHeader>
          <CardBody>
            <VStack gap="lg">
              <HStack gap="md" align="flex-end" wrap>
                <View style={{ flex: 2, minWidth: 240 }}>
                  <Select
                    label="Menu item"
                    placeholder="Select an item…"
                    value={pickerItemId}
                    options={itemOptions}
                    onChange={setPickerItemId}
                  />
                </View>
                <View style={{ width: 96 }}>
                  <Input
                    label="Qty"
                    keyboardType="number-pad"
                    value={qtyText}
                    onChangeText={setQtyText}
                    error={qtyText.length > 0 && !qtyValid ? "≥ 1" : undefined}
                  />
                </View>
                <Button title="Add" onPress={addLine} disabled={!canAdd} />
              </HStack>

              {selectedItem && !selectedItem.isAvailable ? (
                <Text variant="caption" color={feedback.danger}>
                  “{selectedItem.name}” is unavailable and can’t be added.
                </Text>
              ) : null}

              {lines.length === 0 ? (
                <EmptyState
                  title="No items yet"
                  description="Add at least one menu item to place the order."
                />
              ) : (
                <VStack gap="lg">
                  <Table
                    columns={lineColumns}
                    data={lines}
                    keyExtractor={(l) => String(l.menuItemId)}
                  />
                  <HStack justify="space-between" align="center">
                    <Text variant="body" color={color.textSecondary}>
                      Estimated subtotal (server confirms the final total)
                    </Text>
                    <Text variant="h3" numeric>
                      {formatMoney(previewSubtotalCents)}
                    </Text>
                  </HStack>
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Submit */}
        <HStack gap="md" justify="flex-end" wrap>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={createOrder.isPending}
          />
          <Button
            title="Place order"
            onPress={submit}
            loading={createOrder.isPending}
            disabled={!canSubmit}
          />
        </HStack>
      </VStack>
    </ScreenFrame>
  );
}

/** Menu item option label: name — price, with an unavailable marker. */
function itemOptionLabel(m: MenuItem): string {
  const base = `${m.name} — ${formatMoney(m.priceCents)}`;
  return m.isAvailable ? base : `${base} · Unavailable`;
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
