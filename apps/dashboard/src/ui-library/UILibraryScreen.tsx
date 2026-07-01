import { useState, type ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { OrderStatus, OrderType } from "@odyssey/api-client";
import {
  // tokens
  accent,
  color,
  elevation,
  feedback,
  gray,
  radii,
  spacing,
  statusColors,
  typography,
  type StatusColorSet,
  type ElevationToken,
  type RadiusToken,
  // components
  Badge,
  Box,
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
  StatusBadge,
  Switch,
  Table,
  Text,
  VStack,
  useToast,
  type BadgeTone,
  type ButtonVariant,
  type Column,
} from "@odyssey/shared";

/* -------------------------------------------------------------------------- */
/* Single-source enum discipline                                              */
/* -------------------------------------------------------------------------- */
// The generic design system (`@odyssey/shared`) does not know about OrderStatus.
// This file — the dashboard, the only layer allowed to import the generated
// client — proves the status palette covers every OrderStatus. Add a status to
// the pgEnum (and regenerate) without a color here and THIS becomes a type
// error. The OrderStatus union is never re-declared on the frontend.
statusColors satisfies Record<OrderStatus, StatusColorSet>;

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
} satisfies Record<OrderStatus, string>;

// Ordered directly from the generated enum — the single source of truth.
const STATUS_ORDER = Object.values(OrderStatus);

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* -------------------------------------------------------------------------- */
/* Local presentational helpers (showcase only)                               */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <VStack gap="lg">
      <VStack gap="xxs">
        <Text variant="h2">{title}</Text>
        {description ? (
          <Text variant="body" color={color.textSecondary}>
            {description}
          </Text>
        ) : null}
      </VStack>
      {children}
    </VStack>
  );
}

function SubBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <VStack gap="sm">
      <Text variant="label" color={color.textTertiary}>
        {label.toUpperCase()}
      </Text>
      {children}
    </VStack>
  );
}

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <VStack gap="xxs">
      <Box
        style={{ width: spacing["6xl"], height: spacing["4xl"] }}
        background={value}
        radius="md"
        borderColor={color.border}
        borderWidth="thin"
      />
      <Text variant="caption">{name}</Text>
      <Text variant="caption" numeric color={color.textTertiary}>
        {value}
      </Text>
    </VStack>
  );
}

/* -------------------------------------------------------------------------- */
/* Foundations                                                                */
/* -------------------------------------------------------------------------- */

function FoundationsSection() {
  const grayRamp = Object.entries(gray);
  const radiiTokens: RadiusToken[] = ["sm", "md", "lg", "xl", "full"];
  const elevationTokens: ElevationToken[] = ["sm", "md", "lg"];
  const spacingRow: Array<[string, number]> = [
    ["xs", spacing.xs],
    ["sm", spacing.sm],
    ["md", spacing.md],
    ["lg", spacing.lg],
    ["xl", spacing.xl],
    ["2xl", spacing["2xl"]],
    ["3xl", spacing["3xl"]],
    ["4xl", spacing["4xl"]],
  ];

  return (
    <Section
      title="Foundations"
      description="Every color, space, radius, and text style in the product comes from these tokens."
    >
      <SubBlock label="Neutral ramp">
        <HStack gap="sm" wrap>
          {grayRamp.map(([step, value]) => (
            <Swatch key={step} name={`gray ${step}`} value={value} />
          ))}
        </HStack>
      </SubBlock>

      <SubBlock label="Accent (used only for primary actions & selection)">
        <HStack gap="sm" wrap>
          <Swatch name="subtle" value={accent.subtle} />
          <Swatch name="default" value={accent.default} />
          <Swatch name="hover" value={accent.hover} />
          <Swatch name="active" value={accent.active} />
        </HStack>
      </SubBlock>

      <SubBlock label="Semantic feedback">
        <HStack gap="sm" wrap>
          <Swatch name="success" value={feedback.success} />
          <Swatch name="warning" value={feedback.warning} />
          <Swatch name="danger" value={feedback.danger} />
          <Swatch name="info" value={feedback.info} />
        </HStack>
      </SubBlock>

      <SubBlock label="Typography scale">
        <VStack gap="sm">
          <Text variant="display">Display</Text>
          <Text variant="h1">Heading 1</Text>
          <Text variant="h2">Heading 2</Text>
          <Text variant="h3">Heading 3</Text>
          <Text variant="body">Body — the default reading size.</Text>
          <Text variant="bodyStrong">Body strong — emphasis within text.</Text>
          <Text variant="label">Label — form labels & table headers</Text>
          <Text variant="caption" color={color.textSecondary}>
            Caption — secondary metadata
          </Text>
          <HStack gap="lg" wrap align="center">
            <Text variant="h3" numeric>
              {formatMoney(123456)}
            </Text>
            <Text variant="h3" numeric color={color.textSecondary}>
              #10428
            </Text>
            <Text variant="caption" color={color.textTertiary}>
              (monospace + tabular-nums for money & IDs)
            </Text>
          </HStack>
        </VStack>
      </SubBlock>

      <SubBlock label="Spacing scale">
        <VStack gap="xs">
          {spacingRow.map(([name, value]) => (
            <HStack key={name} gap="sm" align="center">
              <Text variant="caption" numeric style={{ width: spacing["3xl"] }}>
                {name}
              </Text>
              <View
                style={{
                  width: value,
                  height: spacing.md,
                  backgroundColor: accent.default,
                  borderRadius: radii.sm,
                }}
              />
              <Text variant="caption" numeric color={color.textTertiary}>
                {value}
              </Text>
            </HStack>
          ))}
        </VStack>
      </SubBlock>

      <SubBlock label="Radii">
        <HStack gap="lg" wrap>
          {radiiTokens.map((token) => (
            <VStack key={token} gap="xxs" align="center">
              <Box
                style={{ width: spacing["5xl"], height: spacing["5xl"] }}
                background={gray[200]}
                radius={token}
              />
              <Text variant="caption" color={color.textTertiary}>
                {token}
              </Text>
            </VStack>
          ))}
        </HStack>
      </SubBlock>

      <SubBlock label="Surfaces & elevation">
        <HStack gap="xl" wrap>
          {elevationTokens.map((token) => (
            <View
              key={token}
              style={[
                elevation[token],
                {
                  width: spacing["6xl"],
                  height: spacing["6xl"],
                  backgroundColor: color.surface,
                  borderRadius: radii.lg,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text variant="caption" color={color.textSecondary}>
                {token}
              </Text>
            </View>
          ))}
        </HStack>
      </SubBlock>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Status system (hero)                                                       */
/* -------------------------------------------------------------------------- */

const SAMPLE_ORDERS = [
  { id: 10428, customer: "Alice Nguyen", status: "preparing", type: "dine_in", totalCents: 8540 },
  { id: 10427, customer: "Ben Carter", status: "pending", type: "takeaway", totalCents: 1940 },
  { id: 10426, customer: "Carla Diaz", status: "completed", type: "delivery", totalCents: 6050 },
  { id: 10425, customer: "Dan O'Brien", status: "cancelled", type: "dine_in", totalCents: 1490 },
] as const;

type SampleOrder = (typeof SAMPLE_ORDERS)[number];

function StatusSystemSection() {
  const orderColumns: Column<SampleOrder>[] = [
    {
      key: "id",
      header: "Order",
      width: spacing["6xl"] + spacing.lg,
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
      render: (o) => <Text variant="body">{o.customer}</Text>,
    },
    {
      key: "status",
      header: "Status",
      flex: 1,
      render: (o) => (
        <StatusBadge status={o.status} label={STATUS_LABELS[o.status]} />
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
  ];

  const sample = SAMPLE_ORDERS[0];

  return (
    <Section
      title="Status system"
      description="One semantic hue per order status, applied identically everywhere. Money and IDs use tabular-nums so figures align in columns."
    >
      <SubBlock label="All six statuses">
        <HStack gap="sm" wrap>
          {STATUS_ORDER.map((status) => (
            <StatusBadge
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
            />
          ))}
        </HStack>
      </SubBlock>

      <SubBlock label="Same treatment on a card and in a table">
        <VStack gap="lg">
          <Card style={{ maxWidth: spacing["6xl"] * 6 }}>
            <CardHeader>
              <HStack justify="space-between" align="center">
                <Text variant="h3" numeric>
                  #{sample.id}
                </Text>
                <StatusBadge
                  status={sample.status}
                  label={STATUS_LABELS[sample.status]}
                />
              </HStack>
            </CardHeader>
            <CardBody>
              <VStack gap="sm">
                <HStack justify="space-between">
                  <Text variant="body" color={color.textSecondary}>
                    Customer
                  </Text>
                  <Text variant="body">{sample.customer}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text variant="body" color={color.textSecondary}>
                    Type
                  </Text>
                  <Text variant="body">{sample.type}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text variant="bodyStrong">Total</Text>
                  <Text variant="bodyStrong" numeric>
                    {formatMoney(sample.totalCents)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Table
            columns={orderColumns}
            data={[...SAMPLE_ORDERS]}
            keyExtractor={(o) => String(o.id)}
          />
        </VStack>
      </SubBlock>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

function ButtonsBlock() {
  const variants: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
  return (
    <SubBlock label="Buttons — variants × states">
      <VStack gap="md">
        {variants.map((variant) => (
          <HStack key={variant} gap="sm" align="center" wrap>
            <View style={{ width: spacing["6xl"] }}>
              <Text variant="label" color={color.textSecondary}>
                {variant}
              </Text>
            </View>
            <Button title="Default" variant={variant} />
            <Button title="Disabled" variant={variant} disabled />
            <Button title="Loading" variant={variant} loading />
          </HStack>
        ))}
        <HStack gap="sm" align="center" wrap>
          <View style={{ width: spacing["6xl"] }}>
            <Text variant="label" color={color.textSecondary}>
              sizes
            </Text>
          </View>
          <Button title="Small" size="sm" />
          <Button title="Medium" size="md" />
          <Button title="Large" size="lg" />
        </HStack>
      </VStack>
    </SubBlock>
  );
}

function FormBlock() {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [switchOn, setSwitchOn] = useState(true);

  const typeOptions = Object.values(OrderType).map((value) => ({
    value,
    label: value,
  }));

  return (
    <VStack gap="xl">
      <SubBlock label="Inputs">
        <VStack gap="md" style={{ maxWidth: spacing["6xl"] * 5 }}>
          <Input
            label="Customer name"
            placeholder="e.g. Alice Nguyen"
            value={text}
            onChangeText={setText}
          />
          <Input
            label="Email"
            placeholder="name@example.com"
            error="Enter a valid email address"
          />
          <Input label="Disabled" placeholder="Unavailable" disabled />
        </VStack>
      </SubBlock>

      <SubBlock label="Select (opens the Modal primitive)">
        <View style={{ maxWidth: spacing["6xl"] * 5 }}>
          <Select
            label="Order type"
            placeholder="Choose a type…"
            value={selected}
            options={typeOptions}
            onChange={setSelected}
          />
        </View>
      </SubBlock>

      <SubBlock label="Switch">
        <HStack gap="xl" align="center" wrap>
          <Switch value={switchOn} onValueChange={setSwitchOn} label="Auto-accept orders" />
          <Switch value={false} onValueChange={() => {}} label="Off" />
          <Switch value disabled onValueChange={() => {}} label="Disabled" />
        </HStack>
      </SubBlock>
    </VStack>
  );
}

function BadgesBlock() {
  const tones: BadgeTone[] = [
    "neutral",
    "accent",
    "success",
    "warning",
    "danger",
    "info",
  ];
  return (
    <SubBlock label="Badges — tones">
      <HStack gap="sm" wrap>
        {tones.map((tone) => (
          <Badge key={tone} tone={tone} label={tone} />
        ))}
      </HStack>
    </SubBlock>
  );
}

function TableBlock() {
  const columns: Column<SampleOrder>[] = [
    {
      key: "id",
      header: "Order",
      flex: 1,
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
      render: (o) => <Text variant="body">{o.customer}</Text>,
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
  ];
  const emptyColumns: Column<SampleOrder>[] = columns;

  return (
    <VStack gap="xl">
      <SubBlock label="Table — with rows">
        <Table
          columns={columns}
          data={[...SAMPLE_ORDERS]}
          keyExtractor={(o) => String(o.id)}
        />
      </SubBlock>
      <SubBlock label="Table — empty state">
        <Table
          columns={emptyColumns}
          data={[]}
          keyExtractor={(o) => String(o.id)}
          emptyState={
            <EmptyState
              title="No orders yet"
              description="Orders will appear here as they come in."
            />
          }
        />
      </SubBlock>
    </VStack>
  );
}

function OverlayBlock() {
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();
  return (
    <SubBlock label="Overlays & feedback">
      <HStack gap="sm" wrap>
        <Button
          title="Open modal"
          variant="secondary"
          onPress={() => setModalOpen(true)}
        />
        <Button
          title="Success toast"
          variant="secondary"
          onPress={() =>
            toast.show({
              title: "Order confirmed",
              description: "Order #10428 moved to preparing.",
              tone: "success",
            })
          }
        />
        <Button
          title="Error toast"
          variant="secondary"
          onPress={() =>
            toast.show({
              title: "Transition rejected",
              description: "Cannot complete a pending order.",
              tone: "danger",
            })
          }
        />
      </HStack>
      <Modal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm action"
      >
        <VStack gap="lg">
          <Text variant="body" color={color.textSecondary}>
            This is the Modal primitive that Select composes. Tap the scrim, the
            ✕, or the button below to dismiss.
          </Text>
          <HStack gap="sm" justify="flex-end">
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => setModalOpen(false)}
            />
            <Button title="Confirm" onPress={() => setModalOpen(false)} />
          </HStack>
        </VStack>
      </Modal>
    </SubBlock>
  );
}

function FeedbackStatesBlock() {
  return (
    <VStack gap="xl">
      <SubBlock label="Skeleton (loading)">
        <VStack gap="sm" style={{ maxWidth: spacing["6xl"] * 5 }}>
          <Skeleton width="60%" height={spacing.xl} />
          <Skeleton />
          <Skeleton width="80%" />
        </VStack>
      </SubBlock>
      <SubBlock label="Empty & error states">
        <HStack gap="lg" wrap>
          <Card style={{ flex: 1, minWidth: spacing["6xl"] * 4 }}>
            <EmptyState
              title="Nothing here yet"
              description="This list is empty."
              action={<Button title="Create order" size="sm" />}
            />
          </Card>
          <Card style={{ flex: 1, minWidth: spacing["6xl"] * 4 }}>
            <ErrorState
              title="Something went wrong"
              description="We couldn't load this data."
              action={<Button title="Retry" size="sm" variant="secondary" />}
            />
          </Card>
        </HStack>
      </SubBlock>
    </VStack>
  );
}

function ComponentsSection() {
  return (
    <Section
      title="Components"
      description="Each primitive with its real variants and states."
    >
      <ButtonsBlock />
      <BadgesBlock />
      <FormBlock />
      <TableBlock />
      <OverlayBlock />
      <FeedbackStatesBlock />
    </Section>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                      */
/* -------------------------------------------------------------------------- */

export function UILibraryScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: spacing["2xl"],
        gap: spacing["4xl"],
        maxWidth: 960,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <VStack gap="xs">
        <Text variant="display">Odyssey UI Library</Text>
        <Text variant="body" color={color.textSecondary}>
          Design tokens and presentational primitives — React Native primitives
          via react-native-web, styled only from tokens.
        </Text>
      </VStack>

      <FoundationsSection />
      <StatusSystemSection />
      <ComponentsSection />

      <Box paddingY="2xl">
        <Text variant="caption" color={color.textTertiary} align="center">
          @odyssey/shared · light mode · no external UI libraries
        </Text>
      </Box>
    </ScrollView>
  );
}
