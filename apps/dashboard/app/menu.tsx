import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListMenuItemsQueryKey,
  useListCategories,
  useListMenuItems,
  useUpdateMenuItem,
  type Category,
  type MenuItem,
  type UpdateMenuItemBody,
} from "@odyssey/api-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  HStack,
  Input,
  Modal,
  Select,
  Skeleton,
  Switch,
  Table,
  Text,
  VStack,
  accent,
  color,
  formatMoney,
  parseDollarsToCents,
  spacing,
  useToast,
  type Column,
} from "@odyssey/shared";

export default function MenuScreen() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const itemsQuery = useListMenuItems();
  const categoriesQuery = useListCategories();

  // Which row's availability toggle is in flight (drives per-row spinner).
  const [togglingId, setTogglingId] = useState<number | null>(null);
  // The item being edited in the modal (null = closed).
  const [editing, setEditing] = useState<MenuItem | null>(null);

  // Inline availability toggle — pessimistic: no optimistic update, the list
  // refetch shows the server truth.
  const toggle = useUpdateMenuItem({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListMenuItemsQueryKey(),
        });
      },
      onError: (err) => {
        toast.show({
          title: "Couldn't update availability",
          description: err.error,
          tone: "danger",
        });
      },
    },
  });

  // Modal save — separate interaction path, so its own mutation instance.
  const save = useUpdateMenuItem({
    mutation: {
      onSuccess: (updated) => {
        void queryClient.invalidateQueries({
          queryKey: getListMenuItemsQueryKey(),
        });
        toast.show({
          title: "Item updated",
          description: `“${updated.name}” saved.`,
          tone: "success",
        });
        setEditing(null);
      },
      onError: (err) => {
        // Keep the modal open so the user can fix/retry.
        toast.show({
          title: "Couldn't save item",
          description: err.error,
          tone: "danger",
        });
      },
    },
  });

  function onToggle(item: MenuItem) {
    setTogglingId(item.id);
    toggle.mutate(
      { id: item.id, data: { isAvailable: !item.isAvailable } },
      { onSettled: () => setTogglingId(null) },
    );
  }

  // Group items by category, keeping categories in displayOrder and items by
  // name within each. Only categories that actually have items are rendered.
  const sections = useMemo(() => {
    const items = itemsQuery.data ?? [];
    const categories = [...(categoriesQuery.data ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    return categories
      .map((category) => ({
        category,
        items: items
          .filter((it) => it.categoryId === category.id)
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((s) => s.items.length > 0);
  }, [itemsQuery.data, categoriesQuery.data]);

  const columns: Column<MenuItem>[] = [
    {
      key: "name",
      header: "Item",
      flex: 3,
      render: (it) => (
        <VStack gap="xxs">
          <HStack gap="sm" align="center" wrap>
            <Text
              variant="bodyStrong"
              color={it.isAvailable ? color.textPrimary : color.textTertiary}
            >
              {it.name}
            </Text>
            {it.isAvailable ? null : <Badge label="Unavailable" tone="neutral" />}
          </HStack>
          {it.description ? (
            <Text variant="caption" color={color.textSecondary}>
              {it.description}
            </Text>
          ) : null}
        </VStack>
      ),
    },
    {
      key: "price",
      header: "Price",
      flex: 1,
      align: "right",
      render: (it) => (
        <Text
          variant="body"
          numeric
          color={it.isAvailable ? color.textPrimary : color.textTertiary}
        >
          {formatMoney(it.priceCents)}
        </Text>
      ),
    },
    {
      key: "available",
      header: "Available",
      width: 120,
      align: "center",
      render: (it) => (
        <HStack gap="sm" align="center">
          <Switch
            value={it.isAvailable}
            onValueChange={() => onToggle(it)}
            disabled={toggle.isPending}
          />
          {togglingId === it.id ? (
            <ActivityIndicator size="small" color={accent.default} />
          ) : null}
        </HStack>
      ),
    },
    {
      key: "edit",
      header: "",
      width: 88,
      align: "right",
      render: (it) => (
        <Button
          title="Edit"
          variant="ghost"
          size="sm"
          onPress={() => setEditing(it)}
        />
      ),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{ padding: spacing["3xl"], gap: spacing.xl }}
    >
      <VStack gap="xxs">
        <Text variant="display">Menu</Text>
        <Text variant="body" color={color.textSecondary}>
          Toggle availability inline, or edit an item’s name, price, description,
          and category.
        </Text>
      </VStack>

      {itemsQuery.isLoading || categoriesQuery.isLoading ? (
        <VStack gap="sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={spacing["6xl"]} />
          ))}
        </VStack>
      ) : itemsQuery.error || categoriesQuery.error ? (
        <ErrorState
          title="Couldn't load the menu"
          description="Something went wrong fetching menu items or categories. Try again."
        />
      ) : sections.length === 0 ? (
        <EmptyState
          title="No menu items"
          description="Menu items will appear here once they’re added."
        />
      ) : (
        <VStack gap="xl">
          {sections.map(({ category, items }) => (
            <Card key={category.id}>
              <CardHeader>
                <HStack justify="space-between" align="center">
                  <Text variant="h3">{category.name}</Text>
                  <Text variant="caption" color={color.textTertiary}>
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </Text>
                </HStack>
              </CardHeader>
              <CardBody>
                <Table
                  columns={columns}
                  data={items}
                  keyExtractor={(it) => String(it.id)}
                />
              </CardBody>
            </Card>
          ))}
        </VStack>
      )}

      {editing ? (
        <EditItemModal
          item={editing}
          categories={categoriesQuery.data ?? []}
          pending={save.isPending}
          onCancel={() => setEditing(null)}
          onSave={(data) => save.mutate({ id: editing.id, data })}
        />
      ) : null}
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit modal                                                                 */
/* -------------------------------------------------------------------------- */

function EditItemModal({
  item,
  categories,
  pending,
  onCancel,
  onSave,
}: {
  item: MenuItem;
  categories: Category[];
  pending: boolean;
  onCancel: () => void;
  onSave: (data: UpdateMenuItemBody) => void;
}) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [priceText, setPriceText] = useState((item.priceCents / 100).toFixed(2));
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [isAvailable, setIsAvailable] = useState(item.isAvailable);

  const categoryOptions = [...categories]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((c) => ({ label: c.name, value: String(c.id) }));

  const trimmedName = name.trim();
  const nameValid = trimmedName.length > 0;
  const priceCents = parseDollarsToCents(priceText);
  const priceValid = priceCents !== null;

  // Only send fields that actually changed vs the original item.
  const nextDescription = description.trim() === "" ? null : description.trim();
  const changed: UpdateMenuItemBody = {};
  if (nameValid && trimmedName !== item.name) changed.name = trimmedName;
  if (nextDescription !== item.description) changed.description = nextDescription;
  if (priceValid && priceCents !== item.priceCents) changed.priceCents = priceCents;
  if (isAvailable !== item.isAvailable) changed.isAvailable = isAvailable;
  if (categoryId !== item.categoryId) changed.categoryId = categoryId;

  const hasChanges = Object.keys(changed).length > 0;
  const canSave = nameValid && priceValid && hasChanges && !pending;

  function submit() {
    if (!canSave) return;
    onSave(changed);
  }

  return (
    <Modal visible onClose={onCancel} title={`Edit ${item.name}`} maxWidth={480}>
      <VStack gap="lg">
        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          error={name.length > 0 && !nameValid ? "Name is required" : undefined}
        />

        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Optional — leave blank to clear"
          multiline
        />

        <VStack gap="xs">
          <Input
            label="Price (dollars)"
            value={priceText}
            onChangeText={setPriceText}
            keyboardType="decimal-pad"
            error={priceText.length > 0 && !priceValid ? "Enter a positive amount" : undefined}
          />
          <Text variant="caption" color={color.textSecondary}>
            {priceValid
              ? `Sends ${priceCents}¢ → ${formatMoney(priceCents)}`
              : "e.g. 12.90"}
          </Text>
        </VStack>

        <Select
          label="Category"
          value={String(categoryId)}
          options={categoryOptions}
          onChange={(v) => setCategoryId(Number(v))}
        />

        <HStack gap="sm" align="center">
          <Switch value={isAvailable} onValueChange={setIsAvailable} />
          <Text variant="body" color={color.textPrimary}>
            {isAvailable ? "Available" : "Unavailable"}
          </Text>
        </HStack>

        {!hasChanges ? (
          <Text variant="caption" color={color.textTertiary}>
            No changes yet.
          </Text>
        ) : null}

        <HStack gap="md" justify="flex-end" wrap>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            disabled={pending}
          />
          <Button
            title="Save"
            onPress={submit}
            loading={pending}
            disabled={!canSave}
          />
        </HStack>
      </VStack>
    </Modal>
  );
}
