import { RouterProvider } from "react-router";
import router from "@/router";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ConnectionDialog } from "@/components/connection/ConnectionDialog";

function App() {
  return (
    <ThemeProvider>
      <ConnectionDialog />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
