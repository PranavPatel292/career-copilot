import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/sonner";
import { KBPage } from "./components/upload/KBPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <KBPage />
      </div>
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}

export default App;
