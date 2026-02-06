import { useLocation } from "react-router";

interface BreadcrumbProps {
  // Future: Can accept custom breadcrumb items
}

export default function Breadcrumb(_props: BreadcrumbProps) {
  const location = useLocation();

  // Build breadcrumb based on current path
  const getBreadcrumbs = () => {
    const path = location.pathname;

    if (path === "/") {
      return [{ label: "Sessions", path: "/" }];
    }

    if (path.startsWith("/sessions/")) {
      return [
        { label: "Sessions", path: "/" },
        { label: "Detail", path: location.pathname },
      ];
    }

    return [{ label: "Home", path: "/" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="hidden md:flex">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground">/</span>
            )}
            <span
              className={
                index === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {crumb.label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
