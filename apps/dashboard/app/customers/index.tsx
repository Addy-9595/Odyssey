import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useListCustomers, type Customer } from "@odyssey/api-client";
import {
  Text,
  VStack,
  Skeleton,
  Table,
  EmptyState,
  ErrorState,
  formatDateTime,
  color,
  spacing,
  type Column,
} from "@odyssey/shared";

export default function CustomersScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useListCustomers();

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Name",
      flex: 2,
      render: (c) => <Text variant="bodyStrong">{c.name}</Text>,
    },
    {
      key: "email",
      header: "Email",
      flex: 2,
      render: (c) => (
        <Text variant="body" color={color.textSecondary}>
          {c.email}
        </Text>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      flex: 1,
      render: (c) => (
        <Text variant="body" color={color.textSecondary}>
          {c.phone ?? "—"}
        </Text>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      flex: 1,
      align: "right",
      render: (c) => (
        <Text variant="caption" color={color.textSecondary}>
          {formatDateTime(c.createdAt)}
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
        <Text variant="display">Customers</Text>
        <Text variant="body" color={color.textSecondary}>
          Everyone who has an account. Click a row to see spend and order history.
        </Text>
      </VStack>

      {isLoading ? (
        <VStack gap="sm">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={spacing["3xl"]} />
          ))}
        </VStack>
      ) : error ? (
        <ErrorState
          title="Couldn't load customers"
          description="Something went wrong fetching customers. Try again."
        />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No customers yet"
          description="Customers will appear here once they place their first order."
        />
      ) : (
        <Table
          columns={columns}
          data={data}
          keyExtractor={(c) => String(c.id)}
          onRowPress={(c) =>
            router.push({
              pathname: "/customers/[id]",
              params: { id: String(c.id) },
            })
          }
        />
      )}
    </ScrollView>
  );
}
