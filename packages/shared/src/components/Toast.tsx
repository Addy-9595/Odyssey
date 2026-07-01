import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pressable, View } from "react-native";
import { Text } from "./Text.tsx";
import {
  elevation,
  feedback,
  gray,
  radii,
  spacing,
  type StatusColorSet,
} from "../tokens/index.ts";

export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Auto-dismiss delay in ms (default 3500). */
  duration?: number;
}

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastApi {
  show: (options: ToastOptions) => void;
}

const TONE_COLORS: Record<ToastTone, StatusColorSet> = {
  neutral: { fill: gray[0], text: gray[900], border: gray[300] },
  success: { fill: feedback.successSubtle, text: "#166534", border: "#86efac" },
  warning: { fill: feedback.warningSubtle, text: "#92400e", border: "#fcd34d" },
  danger: { fill: feedback.dangerSubtle, text: "#991b1b", border: "#fca5a5" },
  info: { fill: feedback.infoSubtle, text: "#075985", border: "#7dd3fc" },
};

const ToastContext = createContext<ToastApi | null>(null);

/** Imperative toast API. Must be used within a ToastProvider. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = (idRef.current += 1);
      setToasts((list) => [
        ...list,
        {
          id,
          title: options.title,
          description: options.description,
          tone: options.tone ?? "neutral",
        },
      ]);
      const duration = options.duration ?? 3500;
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ show }}>
      <View style={{ flex: 1 }}>
        {children}
        <View
          style={{
            position: "absolute",
            top: spacing.lg,
            right: spacing.lg,
            gap: spacing.sm,
            maxWidth: 360,
            pointerEvents: "box-none",
          }}
        >
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              item={toast}
              onDismiss={() => dismiss(toast.id)}
            />
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const colors = TONE_COLORS[item.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Dismiss: ${item.title}`}
      onPress={onDismiss}
      style={[
        elevation.lg,
        {
          minWidth: 240,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.fill,
          gap: spacing.xxs,
        },
      ]}
    >
      <Text variant="bodyStrong" color={colors.text}>
        {item.title}
      </Text>
      {item.description ? (
        <Text variant="caption" color={colors.text}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );
}
