import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { Toaster } from "@/components/ui/sonner";
import { ChatPage } from "./components/chat/ChatPage";
import { Header } from "./components/shared/Header";
import { KBPage } from "./components/upload/KBPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/kb" element={<KBPage />} />
        </Routes>
      </BrowserRouter>

      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}

export default App;
