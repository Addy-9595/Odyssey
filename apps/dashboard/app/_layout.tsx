import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ToastProvider } from "@odyssey/shared";
import { NavShell } from "../src/shell/NavShell.tsx";

// One QueryClient for the app. Pages wire real data in later chunks.
const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <NavShell>
            <Slot />
          </NavShell>
        </ToastProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
