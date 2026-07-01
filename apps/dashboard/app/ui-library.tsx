// Renders the existing design-system showcase (unchanged) at its own route.
// The satisfies Record<OrderStatus, …> exhaustiveness check lives inside the
// showcase module and keeps working after this move.
import { UILibraryScreen } from "../src/ui-library/UILibraryScreen.tsx";

export default function UILibraryRoute() {
  return <UILibraryScreen />;
}
