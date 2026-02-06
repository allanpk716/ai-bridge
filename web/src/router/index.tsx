import { createBrowserRouter } from "react-router";
import RootLayout from "@/layouts/RootLayout";
import MainLayout from "@/layouts/MainLayout";
import SessionList from "@/pages/SessionList";
import SessionDetail from "@/pages/SessionDetail";
import ComponentTest from "@/pages/ComponentTest";

/**
 * Router configuration for AI-Bridge web application
 *
 * Route hierarchy:
 * - RootLayout (full-height container)
 *   - MainLayout (TopNav + content area)
 *     - / (root) → SessionList page
 *     - /sessions/:id → SessionDetail page
 *     - /components → ComponentTest page (dev only)
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <SessionList />,
          },
          {
            path: "sessions/:id",
            element: <SessionDetail />,
          },
          {
            path: "components",
            element: <ComponentTest />,
          },
        ],
      },
    ],
  },
]);

export default router;
