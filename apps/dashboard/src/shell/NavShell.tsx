import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Link, usePathname, type Href } from "expo-router";
import {
  Text,
  VStack,
  accent,
  color,
  gray,
  radii,
  spacing,
} from "@odyssey/shared";

const SIDEBAR_WIDTH = 240;

interface NavEntry {
  label: string;
  href: Href;
}

// User-logical display order (not build order).
const PRIMARY_NAV: NavEntry[] = [
  { label: "Home", href: "/" },
  { label: "Orders", href: "/orders" },
  { label: "Menu", href: "/menu" },
  { label: "Customers", href: "/customers" },
  { label: "Settings", href: "/settings" },
];

// Set slightly apart at the bottom — a reviewer opens it directly.
const DEV_NAV: NavEntry[] = [{ label: "UI Library", href: "/ui-library" }];

function isActive(href: Href, pathname: string): boolean {
  const target = typeof href === "string" ? href : href.pathname;
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

function NavItem({ label, href, active }: NavEntry & { active: boolean }) {
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityState={{ selected: active }}
        style={(state) => {
          const hovered = (state as { hovered?: boolean }).hovered;
          return {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            borderRadius: radii.md,
            backgroundColor: active
              ? accent.subtle
              : hovered
                ? gray[100]
                : "transparent",
          };
        }}
      >
        <Text
          variant={active ? "bodyStrong" : "body"}
          color={active ? accent.active : color.textSecondary}
        >
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

/**
 * Persistent left-sidebar shell (optimized for web). Built from shared
 * primitives; the current route drives the active item (accent). Wraps the
 * routed content passed as children (the router <Slot />).
 */
export function NavShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: color.background }}>
      <View
        style={{
          width: SIDEBAR_WIDTH,
          borderRightWidth: 1,
          borderRightColor: color.border,
          backgroundColor: color.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.lg,
        }}
      >
        <VStack gap="xl" flex={1}>
          <View style={{ paddingHorizontal: spacing.sm }}>
            <Text variant="h2">Odyssey</Text>
            <Text variant="caption" color={color.textTertiary}>
              Restaurant ops
            </Text>
          </View>

          <VStack gap="xxs">
            {PRIMARY_NAV.map((entry) => (
              <NavItem
                key={entry.label}
                {...entry}
                active={isActive(entry.href, pathname)}
              />
            ))}
          </VStack>

          {/* Spacer pushes the dev section to the bottom. */}
          <View style={{ flex: 1 }} />

          <VStack gap="xxs">
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: color.border,
                marginBottom: spacing.xs,
              }}
            />
            {DEV_NAV.map((entry) => (
              <NavItem
                key={entry.label}
                {...entry}
                active={isActive(entry.href, pathname)}
              />
            ))}
          </VStack>
        </VStack>
      </View>

      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
