import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ChatPage } from "./components/chat/ChatPage";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <ChatPage />
      </div>
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}

export default App;
