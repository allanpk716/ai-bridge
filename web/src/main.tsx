import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import App from "@/App.tsx";
import { QueryProvider } from "@/providers/QueryProvider";
import { SocketProvider } from "@/providers/SocketProvider";
import { AppErrorBoundary } from "@/components/error-boundaries";
import { Toaster } from "@/components/ui/sonner";

// Register Service Worker in production only
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register/react').then(() => {
    // Service Worker is auto-registered by Vite PWA plugin
    console.log('Service Worker ready')
  })
}

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
