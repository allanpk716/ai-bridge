import { createBrowserRouter } from "react-router";

/**
 * Router configuration for AI-Bridge web application
 *
 * Routes:
 * - / (root) → Session List page
 * - /sessions/:id → Session Detail page
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Session List Page</div>,
  },
  {
    path: "/sessions/:id",
    element: <div>Session Detail Page</div>,
  },
]);

export default router;
