import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import { QueryProvider } from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { AppErrorBoundary } from "@/providers/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Toaster />
      <QueryProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </QueryProvider>
    </AppErrorBoundary>
  </StrictMode>
);
