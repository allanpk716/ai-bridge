import { createBrowserRouter, useNavigate } from "react-router";
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

/**
 * Navigation utility hook for navigating to a specific session
 * @param sessionId - The ID of the session to navigate to
 * @returns A function that navigates to the session detail page
 */
export function useNavigateToSession() {
  const navigate = useNavigate();

  return (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };
}

/**
 * Navigation utility hook for navigating to the session list
 * @returns A function that navigates to the session list page
 */
export function useNavigateToSessionList() {
  const navigate = useNavigate();

  return () => {
    navigate('/');
  };
}

export default router;
