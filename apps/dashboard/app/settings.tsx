import { useState } from "react";
import { ScrollView } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSettingsQueryKey,
  useGetSettings,
  useUpdateSettings,
  type OpeningHours,
  type Settings,
} from "@odyssey/api-client";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  HStack,
  Input,
  Skeleton,
  Switch,
  Text,
  VStack,
  color,
  spacing,
  useToast,
} from "@odyssey/shared";

const DAYS: { key: keyof OpeningHours; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

export default function SettingsScreen() {
  const { data: settings, isLoading, error } = useGetSettings();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.background }}
      contentContainerStyle={{
        padding: spacing["3xl"],
        maxWidth: 760,
        width: "100%",
      }}
    >
      <VStack gap="xl">
        <VStack gap="xxs">
          <Text variant="display">Settings</Text>
          <Text variant="body" color={color.textSecondary}>
            Restaurant configuration.
          </Text>
        </VStack>

        {isLoading ? (
          <VStack gap="md">
            <Skeleton height={spacing["6xl"]} />
            <Skeleton height={spacing["6xl"]} />
            <Skeleton height={spacing["6xl"]} />
          </VStack>
        ) : error || !settings ? (
          <ErrorState
            title="Couldn't load settings"
            description="Something went wrong fetching settings. Try again."
          />
        ) : (
          <SettingsForm settings={settings} />
        )}
      </VStack>
    </ScrollView>
  );
}

function SettingsForm({ settings }: { settings: Settings }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [prepText, setPrepText] = useState(
    String(settings.defaultPrepTimeMinutes),
  );

  const mutationHandlers = {
    onSuccess: (updated: Settings) => {
      queryClient.setQueryData(getGetSettingsQueryKey(), updated);
      toast.show({ title: "Settings updated", tone: "success" });
    },
    onError: (err: { error: string }) => {
      toast.show({
        title: "Couldn't update settings",
        description: err.error,
        tone: "danger",
      });
    },
  };

  // Separate instances: inline Switch toggles vs the prep-time Save button.
  const toggleMutation = useUpdateSettings({ mutation: mutationHandlers });
  const savePrepMutation = useUpdateSettings({ mutation: mutationHandlers });

  const parsedPrep = Number.parseInt(prepText, 10);
  const prepValid = Number.isInteger(parsedPrep) && parsedPrep >= 1;
  const prepUnchanged = parsedPrep === settings.defaultPrepTimeMinutes;

  return (
    <VStack gap="xl">
      {/* Service */}
      <Card>
        <CardHeader>
          <Text variant="h3">Service</Text>
        </CardHeader>
        <CardBody>
          <VStack gap="lg">
            <VStack gap="xxs">
              <Switch
                label="Accept orders"
                value={settings.serviceAvailable}
                disabled={toggleMutation.isPending}
                onValueChange={(v) =>
                  toggleMutation.mutate({ data: { serviceAvailable: v } })
                }
              />
              <Text variant="caption" color={color.textTertiary}>
                When off, new orders are rejected.
              </Text>
            </VStack>

            <VStack gap="xxs">
              <Switch
                label="Auto-accept orders"
                value={settings.autoAcceptOrders}
                disabled={toggleMutation.isPending}
                onValueChange={(v) =>
                  toggleMutation.mutate({ data: { autoAcceptOrders: v } })
                }
              />
              <Text variant="caption" color={color.textTertiary}>
                New orders start as Confirmed instead of Pending.
              </Text>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Preparation */}
      <Card>
        <CardHeader>
          <Text variant="h3">Preparation</Text>
        </CardHeader>
        <CardBody>
          <VStack gap="lg">
            <Input
              label="Default prep time (minutes)"
              value={prepText}
              onChangeText={setPrepText}
              keyboardType="number-pad"
              error={
                prepText.length > 0 && !prepValid
                  ? "Enter a positive number"
                  : undefined
              }
            />
            <HStack justify="flex-end">
              <Button
                title="Save"
                loading={savePrepMutation.isPending}
                disabled={
                  prepUnchanged || !prepValid || savePrepMutation.isPending
                }
                onPress={() =>
                  savePrepMutation.mutate({
                    data: { defaultPrepTimeMinutes: parsedPrep },
                  })
                }
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Opening hours (read-only) */}
      <Card>
        <CardHeader>
          <Text variant="h3">Opening hours</Text>
        </CardHeader>
        <CardBody>
          <VStack gap="sm">
            {DAYS.map(({ key, label }) => {
              const hours = settings.openingHours[key];
              const isOpen = hours.open !== null && hours.close !== null;
              return (
                <HStack key={key} justify="space-between">
                  <Text variant="body">{label}</Text>
                  {isOpen ? (
                    <Text variant="body">{`${hours.open} – ${hours.close}`}</Text>
                  ) : (
                    <Text variant="body" color={color.textTertiary}>
                      Closed
                    </Text>
                  )}
                </HStack>
              );
            })}
            <Text variant="caption" color={color.textTertiary}>
              Opening hours are read-only in this version.
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
