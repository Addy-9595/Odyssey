/**
 * Cross-platform elevation set. Web uses boxShadow; native uses RN shadow props
 * + Android elevation. Selecting per-platform avoids react-native-web's
 * shadow-prop deprecation warnings while keeping native correct.
 */
import { Platform, type ViewStyle } from "react-native";

function make(web: string, native: ViewStyle): ViewStyle {
  return Platform.select({
    web: { boxShadow: web } as unknown as ViewStyle,
    default: native,
  });
}

export const elevation = {
  none: {} as ViewStyle,
  sm: make("0px 1px 2px rgba(15, 23, 42, 0.06)", {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  }),
  md: make("0px 2px 6px rgba(15, 23, 42, 0.08)", {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  }),
  lg: make("0px 8px 16px rgba(15, 23, 42, 0.12)", {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  }),
} as const;

export type ElevationToken = keyof typeof elevation;
