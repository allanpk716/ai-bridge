import { createBrowserRouter, useNavigate } from "react-router";
import { lazy, Suspense } from "react";
import RootLayout from "@/layouts/RootLayout";
import MainLayout from "@/layouts/MainLayout";
import { SessionListPageSkeleton, SessionDetailPageSkeleton } from "@/pages/skeleton";

// Lazy load page components
const SessionList = lazy(() => import("@/pages/SessionList"));
const SessionDetail = lazy(() => import("@/pages/SessionDetail"));
const ComponentTest = lazy(() => import("@/pages/ComponentTest"));

/**
 * Loading fallback component for component test page
 */
function ComponentTestFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="h-8 w-8 bg-muted rounded animate-pulse" />
      <span className="ml-2 text-muted-foreground">加载中...</span>
    </div>
  );
}

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
            element: (
              <Suspense fallback={<SessionListPageSkeleton />}>
                <SessionList />
              </Suspense>
            ),
          },
          {
            path: "sessions/:id",
            element: (
              <Suspense fallback={<SessionDetailPageSkeleton />}>
                <SessionDetail />
              </Suspense>
            ),
          },
          {
            path: "components",
            element: (
              <Suspense fallback={<ComponentTestFallback />}>
                <ComponentTest />
              </Suspense>
            ),
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
