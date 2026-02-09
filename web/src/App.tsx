import { RouterProvider } from "react-router";
import router from "@/router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConnectionDialog } from "@/components/connection/ConnectionDialog";
import { OfflineBanner } from "@/components/pwa";

function App() {
  return (
    <ThemeProvider>
      <OfflineBanner />
      <ConnectionDialog />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
