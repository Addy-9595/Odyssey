import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@odyssey/shared";
import { UILibraryScreen } from "./src/ui-library/UILibraryScreen.tsx";

// QueryClientProvider is kept for when pages wire real data; the UI-library
// showcase itself needs no data. ToastProvider hosts the toast overlay.
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <UILibraryScreen />
      </ToastProvider>
    </QueryClientProvider>
  );
}
